const { pool } = require('../lib/db');
const { passwordMatches, createSession, destroySession, getSessionUser } = require('../lib/auth');
const { applyCors } = require('../lib/helpers');

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { action } = req.query;

  if (action === 'login') {
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
    return res.status(200).json({ username: user.username, role: user.role });
  }

  if (action === 'logout') {
    await destroySession(req, res);
    return res.status(204).end();
  }

  if (action === 'me') {
    const user = await getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.status(200).json(user);
  }

  res.status(404).json({ error: 'Unknown auth action' });
};