const { Pool } = require('pg');

// Reuses one connection pool across function invocations when possible.
const pool = global._pgPool || new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
global._pgPool = pool;

module.exports = { pool };
