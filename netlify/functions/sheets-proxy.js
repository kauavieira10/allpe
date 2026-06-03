// netlify/functions/sheets-proxy.js
// Proxy do Google Sheets para deploy no Netlify (mantém a API Key no servidor).
const https = require('https');

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, r => { let b = ''; r.on('data', c => b += c);
      r.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { reject(e); } }); })
      .on('error', reject);
  });
}

exports.handler = async function () {
  const KEY = process.env.GOOGLE_SHEETS_API_KEY;
  const ID = process.env.GOOGLE_SHEETS_ID;
  const NAME = process.env.GOOGLE_SHEETS_NAME || 'Página1';
  const RANGE = process.env.GOOGLE_SHEETS_RANGE || 'A1:Z200';
  if (!KEY || !ID) return { statusCode: 500, body: JSON.stringify({ error: 'Variáveis do Sheets ausentes' }) };

  const range = encodeURIComponent(`${NAME}!${RANGE}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${ID}/values/${range}?key=${KEY}`;
  try {
    const data = await getJSON(url);
    if (data.error) throw new Error(data.error.message);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify({ values: data.values || [] }),
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
