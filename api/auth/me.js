const { getSessionUser } = require('../lib/auth');
const { applyCors } = require('../lib/helpers');

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.status(200).json(user);
};
