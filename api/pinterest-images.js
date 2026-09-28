const { requireAdmin } = require('./lib/auth');
const { applyCors } = require('./lib/helpers');

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const feedUrl = process.env.PINTEREST_RSS_URL;
    if (!feedUrl) {
      return res.status(500).json({ error: 'PINTEREST_RSS_URL is not set' });
    }

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Pinterest responded with status ${response.status}` });
    }

    const xml = await response.text();
    const items = xml.split('<item>').slice(1);
    const pins = [];

    for (const item of items) {
      const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);
      if (!descMatch) continue;

      const description = decodeEntities(descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, ''));
      const imgMatch = description.match(/<img[^>]+src="([^"]+)"/);
      if (!imgMatch) continue;

      // RSS thumbnails are small (/236x/), so ask Pinterest's CDN for a larger version.
      const imageUrl = imgMatch[1].replace(/\/(?:236x|474x)\//, '/736x/');

      const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
      const title = titleMatch
        ? decodeEntities(titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '')).trim()
        : '';

      pins.push({ imageUrl, title });
    }

    res.status(200).json(pins);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Could not read the Pinterest feed' });
    }
  }
};