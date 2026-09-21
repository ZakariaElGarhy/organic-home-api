const { pool } = require('../lib/db');
const { requireAdmin } = require('../lib/auth');
const { toApiPost, applyCors } = require('../lib/helpers');

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const { search, featured } = req.query;
    let category = req.query.category;
    if (category === 'Living Room') category = 'Living Rooms';

    const conditions = [];
    const params = [];

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(title ILIKE $${params.length} OR category ILIKE $${params.length})`);
    }

    let sql = 'SELECT * FROM posts';
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY created_at DESC LIMIT ' + (featured === 'true' ? 6 : 100);

    const { rows } = await pool.query(sql, params);
    return res.status(200).json(rows.map(toApiPost));
  }

  if (req.method === 'POST') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const body = req.body || {};
    const required = ['title', 'slug', 'category', 'accent_color', 'intro_text', 'cover_image', 'products', 'conclusion_text'];
    for (const field of required) {
      if (body[field] === undefined) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }

    const existing = await pool.query('SELECT id FROM posts WHERE slug = $1', [body.slug]);
    if (existing.rows.length) {
      return res.status(400).json({ error: 'A post with this slug already exists' });
    }

    const { rows } = await pool.query(
      `INSERT INTO posts (title, slug, category, accent_color, intro_text, cover_image, products, conclusion_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [body.title, body.slug, body.category, body.accent_color, body.intro_text, body.cover_image, JSON.stringify(body.products), body.conclusion_text],
    );

    return res.status(201).json(toApiPost(rows[0]));
  }

  res.status(405).json({ error: 'Method not allowed' });
};
