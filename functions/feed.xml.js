// Cloudflare Pages Function — /feed.xml
// Bu dosya "functions" klasörünün İÇİNDE olduğu için Cloudflare Pages onu
// otomatik olarak https://SİTEN/feed.xml adresine bağlar. Ayrı bir kurulum
// gerekmez — GitHub reposuna bu haliyle (functions/feed.xml.js yolunda)
// eklenmesi yeterli.
//
// Yaptığı iş: Supabase'teki mbh_podcasts tablosunu okuyup gerçek bir RSS
// (feed.xml) dosyası olarak döndürür. Yeni podcast eklendikçe bu feed de
// otomatik güncellenir — RSS okuyucusu olan biri siteyi takip edebilir.

const SUPABASE_URL = 'https://jmdbheaespcxfdmlfqyh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7mqaKjAN9WeASlwPtnvn2Q_3-hGyS_r';

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function onRequestGet(context) {
  const siteUrl = new URL(context.request.url).origin;

  let podcasts = [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/mbh_podcasts?select=*&order=added_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (res.ok) podcasts = await res.json();
  } catch (e) {
    // Supabase'e ulaşılamazsa boş ama geçerli bir feed döndür — hata sayfası gösterme
  }

  const items = podcasts.map(p => {
    const pubDate = new Date(p.added_at || Date.now()).toUTCString();
    return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(p.url)}</link>
      <guid isPermaLink="false">${escapeXml(p.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(p.title)} — Mutfak Brand Hub ortak yayın kanalı.</description>
    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Mutfak Brand Hub — Podcastler</title>
    <link>${siteUrl}</link>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Marka Mutfağı, İnovasyon Mutfağı ve Pazarlama Maratonu'nun ortak yayın kanalından son bölümler.</description>
    <language>tr</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=UTF-8',
      'cache-control': 'public, max-age=300'
    }
  });
}
