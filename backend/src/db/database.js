const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'saas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Run migrations automatically on startup
async function runMigrations() {
  const migrationsPath = path.join('/app', 'database', 'migrations');
  try {
    // Run SQL migration files in order
    const files = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsPath, file), 'utf8');
      console.log(\Running migration: \\);
      await pool.query(sql);
    }
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

// Run migrations on startup
if (process.env.NODE_ENV !== 'test') {
  runMigrations().catch(console.error);
}

module.exports = { pool, runMigrations };
