/**
 * server.js — Proxy backend (Node puro, sem Express) para Render.
 *
 * Serve os arquivos estáticos do dashboard E expõe os endpoints:
 *   GET /api/sheets           -> dados da planilha (Google Sheets API)
 *   GET /api/meta-creatives   -> criativos do Meta Ads (opcional)
 *
 * A API Key e o token NUNCA chegam ao navegador: ficam só aqui,
 * lidos de variáveis de ambiente. Cache de 5 minutos em memória.
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Carrega .env local (sem dependências) se existir
try {
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    });
  }
} catch (e) { /* ignora */ }

const PORT = process.env.PORT || 3000;

const ENV = {
  SHEETS_KEY:   process.env.GOOGLE_SHEETS_API_KEY || '',
  SHEETS_ID:    process.env.GOOGLE_SHEETS_ID || '',
  SHEETS_NAME:  process.env.GOOGLE_SHEETS_NAME || 'Página1',
  SHEETS_RANGE: process.env.GOOGLE_SHEETS_RANGE || 'A1:Z200',
  META_TOKEN:   process.env.META_ACCESS_TOKEN || '',
  META_ACCOUNT: process.env.META_AD_ACCOUNT_ID || '',
};

const CACHE_MS = 5 * 60 * 1000;
const cache = {};
function cached(key, ttl, producer) {
  const hit = cache[key];
  if (hit && Date.now() - hit.t < ttl) return Promise.resolve(hit.v);
  return producer().then(v => { cache[key] = { t: Date.now(), v }; return v; });
}

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Resposta inválida: ' + body.slice(0, 200))); }
      });
    }).on('error', reject);
  });
}

/* ---------- Google Sheets ---------- */
async function fetchSheets() {
  if (!ENV.SHEETS_KEY || !ENV.SHEETS_ID) throw new Error('Variáveis do Sheets não configuradas');
  const range = encodeURIComponent(`${ENV.SHEETS_NAME}!${ENV.SHEETS_RANGE}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${ENV.SHEETS_ID}/values/${range}?key=${ENV.SHEETS_KEY}`;
  const data = await getJSON(url);
  if (data.error) throw new Error(data.error.message || 'Erro do Google Sheets');
  return { values: data.values || [] };
}

/* ---------- Meta Ads (criativos) ---------- */
async function fetchMetaCreatives() {
  if (!ENV.META_TOKEN || !ENV.META_ACCOUNT) throw new Error('Variáveis do Meta não configuradas');
  const base = `https://graph.facebook.com/v19.0/${ENV.META_ACCOUNT}`;
  const fields = 'id,name,status,creative{thumbnail_url,object_story_spec,asset_feed_spec,image_url,image_hash}';
  // 2 chamadas paralelas (NÃO usar field expansion com time_range — dá erro 400)
  const adsUrl = `${base}/ads?fields=${encodeURIComponent(fields)}&limit=50&access_token=${ENV.META_TOKEN}`;
  const insUrl = `${base}/insights?level=ad&fields=${encodeURIComponent('ad_id,spend,clicks,ctr,impressions,actions')}&date_preset=last_30d&limit=200&access_token=${ENV.META_TOKEN}`;
  const [ads, ins] = await Promise.all([getJSON(adsUrl), getJSON(insUrl)]);
  if (ads.error) throw new Error(ads.error.message);
  return { ads: ads.data || [], insights: (ins && ins.data) || [] };
}

/* ---------- estáticos ---------- */
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript',
  '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.json':'application/json',
  '.ico':'image/x-icon', '.woff2':'font/woff2' };

function serveStatic(req, res) {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(__dirname, p);
  if (!file.startsWith(__dirname)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
}

function sendJSON(res, code, obj, cacheable) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  if (cacheable) headers['Cache-Control'] = 'public, max-age=300';
  res.writeHead(code, headers);
  res.end(JSON.stringify(obj));
}

http.createServer((req, res) => {
  if (req.url.startsWith('/api/sheets')) {
    return cached('sheets', CACHE_MS, fetchSheets)
      .then(d => sendJSON(res, 200, d, true))
      .catch(e => sendJSON(res, 502, { error: e.message }));
  }
  if (req.url.startsWith('/api/meta-creatives')) {
    return cached('meta', CACHE_MS, fetchMetaCreatives)
      .then(d => sendJSON(res, 200, d, true))
      .catch(e => sendJSON(res, 502, { error: e.message }));
  }
  serveStatic(req, res);
}).listen(PORT, () => console.log('Dashboard rodando na porta ' + PORT));
