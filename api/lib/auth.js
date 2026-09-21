const crypto = require('crypto');
const { pool } = require('./db');

const SESSION_COOKIE = 'sid';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function hashPassword(password) {
  const salt = process.env.SESSION_SECRET || 'home-decor-dev-salt';
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function passwordMatches(password, passwordHash) {
  const actual = Buffer.from(hashPassword(password), 'hex');
  const expected = Buffer.from(passwordHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function signSessionId(id) {
  const secret = process.env.SESSION_SECRET || 'home-decor-dev-secret';
  const signature = crypto.createHmac('sha256', secret).update(id).digest('hex');
  return `${id}.${signature}`;
}

function verifySessionId(value) {
  if (!value) return null;
  const [id, signature] = value.split('.');
  if (!id || !signature) return null;
  const secret = process.env.SESSION_SECRET || 'home-decor-dev-secret';
  const expected = crypto.createHmac('sha256', secret).update(id).digest('hex');
  if (signature.length !== expected.length) return null;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? id : null;
}

async function createSession(userId, res) {
  const id = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query('INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)', [id, userId, expiresAt]);

  const signed = signSessionId(id);
  const cookie = [
    `${SESSION_COOKIE}=${signed}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    'Secure',
    `Expires=${expiresAt.toUTCString()}`,
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);
}

async function destroySession(req, res) {
  const raw = req.cookies ? req.cookies[SESSION_COOKIE] : null;
  const id = verifySessionId(raw);
  if (id) {
    await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
  }
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
}

async function getSessionUser(req) {
  const raw = req.cookies ? req.cookies[SESSION_COOKIE] : null;
  const id = verifySessionId(raw);
  if (!id) return null;

  const { rows } = await pool.query(
    `SELECT u.username, u.role
     FROM sessions s
     JOIN admin_users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function requireAdmin(req, res) {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return user;
}

module.exports = {
  hashPassword,
  passwordMatches,
  createSession,
  destroySession,
  getSessionUser,
  requireAdmin,
};
