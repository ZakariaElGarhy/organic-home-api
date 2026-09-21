const { pool } = require('../lib/db');
const { passwordMatches, createSession } = require('../lib/auth');
const { applyCors } = require('../lib/helpers');

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const { rows } = await pool.query('SELECT * FROM admin_users WHERE username = $1 LIMIT 1', [username]);
  const user = rows[0];

  if (!user || !passwordMatches(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  await createSession(user.id, res);
  res.status(200).json({ username: user.username, role: user.role });
};
