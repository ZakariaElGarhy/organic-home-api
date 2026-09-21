const { pool } = require('../lib/db');
const { applyCors } = require('../lib/helpers');

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { rows } = await pool.query('SELECT category, cover_image FROM posts ORDER BY created_at DESC');

  const grouped = new Map();
  for (const row of rows) {
    const current = grouped.get(row.category);
    grouped.set(row.category, {
      count: (current ? current.count : 0) + 1,
      image: current ? current.image : row.cover_image,
    });
  }

  res.status(200).json([...grouped.entries()].map(([name, details]) => ({ name, ...details })));
};
