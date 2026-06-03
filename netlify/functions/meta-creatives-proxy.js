// netlify/functions/meta-creatives-proxy.js
// Proxy do Meta Ads (criativos) — opcional, ativa quando META_* estiver configurado.
const https = require('https');

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, r => { let b = ''; r.on('data', c => b += c);
      r.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { reject(e); } }); })
      .on('error', reject);
  });
}

exports.handler = async function () {
  const TOKEN = process.env.META_ACCESS_TOKEN;
  const ACCOUNT = process.env.META_AD_ACCOUNT_ID;
  if (!TOKEN || !ACCOUNT) return { statusCode: 500, body: JSON.stringify({ error: 'Variáveis do Meta ausentes' }) };

  const base = `https://graph.facebook.com/v19.0/${ACCOUNT}`;
  const fields = 'id,name,status,creative{thumbnail_url,object_story_spec,asset_feed_spec,image_url,image_hash}';
  const adsUrl = `${base}/ads?fields=${encodeURIComponent(fields)}&limit=50&access_token=${TOKEN}`;
  const insUrl = `${base}/insights?level=ad&fields=${encodeURIComponent('ad_id,spend,clicks,ctr,impressions,actions')}&date_preset=last_30d&limit=200&access_token=${TOKEN}`;
  try {
    // 2 chamadas paralelas (evita erro 400 do field expansion com time_range)
    const [ads, ins] = await Promise.all([getJSON(adsUrl), getJSON(insUrl)]);
    if (ads.error) throw new Error(ads.error.message);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify({ ads: ads.data || [], insights: (ins && ins.data) || [] }),
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
