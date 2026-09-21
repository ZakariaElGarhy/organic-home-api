const { pool } = require('../../lib/db');
const { toApiPost, applyCors } = require('../../lib/helpers');

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { slug } = req.query;
  const { rows } = await pool.query('SELECT * FROM posts WHERE slug = $1 LIMIT 1', [slug]);

  if (!rows[0]) return res.status(404).json({ error: 'Post not found' });
  res.status(200).json(toApiPost(rows[0]));
};
