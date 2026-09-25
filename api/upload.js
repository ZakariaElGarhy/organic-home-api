const { put } = require('@vercel/blob');
const { requireAdmin } = require('../lib/auth');
const { applyCors } = require('../lib/helpers');

// Vercel's default body parser doesn't handle raw file uploads well,
// so we read the incoming file as a raw buffer ourselves.
module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const filename = req.headers['x-filename'] || `upload-${Date.now()}`;
  const contentType = req.headers['content-type'] || 'application/octet-stream';

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const fileBuffer = Buffer.concat(chunks);

  if (fileBuffer.length === 0) {
    return res.status(400).json({ error: 'No file data received' });
  }
  if (fileBuffer.length > 8 * 1024 * 1024) {
    return res.status(400).json({ error: 'File too large (max 8MB)' });
  }

  const blob = await put(filename, fileBuffer, {
    access: 'public',
    contentType,
    addRandomSuffix: true,
  });

  res.status(200).json({ url: blob.url });
};

// Tell Vercel not to auto-parse the body as JSON, since we're reading raw file bytes.
module.exports.config = {
  api: {
    bodyParser: false,
  },
};