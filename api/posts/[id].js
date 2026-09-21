const { pool } = require('../lib/db');
const { requireAdmin } = require('../lib/auth');
const { toApiPost, applyCors } = require('../lib/helpers');

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { id } = req.query;

  if (req.method === 'PATCH') {
    const body = req.body || {};
    const map = {
      title: 'title',
      slug: 'slug',
      category: 'category',
      accent_color: 'accent_color',
      intro_text: 'intro_text',
      cover_image: 'cover_image',
      conclusion_text: 'conclusion_text',
    };

    const sets = [];
    const params = [];
    for (const [key, col] of Object.entries(map)) {
      if (body[key] !== undefined) {
        params.push(body[key]);
        sets.push(`${col} = $${params.length}`);
      }
    }
    if (body.products !== undefined) {
      params.push(JSON.stringify(body.products));
      sets.push(`products = $${params.length}`);
    }

    if (!sets.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const { rows } = await pool.query(
      `UPDATE posts SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params,
    );

    if (!rows[0]) return res.status(404).json({ error: 'Post not found' });
    return res.status(200).json(toApiPost(rows[0]));
  }

  if (req.method === 'DELETE') {
    const { rows } = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING id', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Post not found' });
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
};
