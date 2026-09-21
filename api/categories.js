const { pool } = require('lib/db');
const { applyCors } = require('lib/helpers');

module.exports = async (req, res) => {
  console.log('starting categories');
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const { rows } = await pool.query(`
      SELECT category, cover_image
      FROM posts
      ORDER BY created_at DESC
    `);
    console.log('query done', rows.length);

    const grouped = {};

    for (const row of rows) {
      const category = row.category;

      if (!grouped[category]) {
        grouped[category] = {
          count: 0,
          image: row.cover_image
        };
      }

      grouped[category].count++;
    }

    const result = Object.entries(grouped).map(([name, details]) => ({
      name,
      count: details.count,
      image: details.image
    }));

    return res.status(200).json(result);

  } catch (error) {
    console.error('Categories API error:', error);

    return res.status(500).json({
      error: 'Failed to load categories',
      details: error.message
    });
  }
};