const { destroySession } = require('../lib/auth');
const { applyCors } = require('../lib/helpers');

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  await destroySession(req, res);
  res.status(204).end();
};
