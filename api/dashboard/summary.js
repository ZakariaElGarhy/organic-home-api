const { pool } = require('../lib/db');
const { requireAdmin } = require('../lib/auth');
const { toApiPost, applyCors } = require('../lib/helpers');

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { rows } = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
  const categories = new Set(rows.map((r) => r.category));

  res.status(200).json({
    total_posts: rows.length,
    categories: categories.size,
    latest_post: rows[0] ? toApiPost(rows[0]) : null,
  });
};
