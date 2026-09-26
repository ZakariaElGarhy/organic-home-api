function toApiPost(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    accent_color: row.accent_color,
    intro_text: row.intro_text,
    cover_image: row.cover_image,
    products: row.products,
    conclusion_text: row.conclusion_text,
    created_at: row.created_at.toISOString(),
  };
}

// Basic CORS + credentials support, needed only if frontend and API
// end up on different domains. Same-origin setups don't need this,
// but it's harmless to leave on.
function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Filename');
  }
}

async function purgeCache(paths) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const baseUrl = process.env.API_BASE_URL;

  if (!token || !zoneId || !baseUrl) {
    console.error('Cloudflare purge not configured (missing env vars), skipping');
    return;
  }

  const files = paths.map((p) => `${baseUrl}${p}`);

  try {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files }),
    });
  } catch (err) {
    console.error('Cache purge failed', err);
  }
}
module.exports = { toApiPost, applyCors ,purgeCache };

