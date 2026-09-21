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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://organic-home.vercel.app"
  );
}

module.exports = { toApiPost, applyCors };
