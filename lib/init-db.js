// lib/init-db.js
// Run once with `npm run init-db` to create the SQLite database and tables.
// Safe to run multiple times — uses CREATE TABLE IF NOT EXISTS.

const { getDb } = require('./db');

const db = getDb();
console.log('✓ Database initialized at', process.env.DATABASE_PATH || './the-collective.db');
console.log('✓ Tables ready: users, folders, notes');
db.close();
