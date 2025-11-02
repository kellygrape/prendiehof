import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use persistent volume path in production (Railway), local path in development
const dbPath = process.env.NODE_ENV === 'production' && existsSync('/app/data')
  ? '/app/data/nominations.db'
  : join(__dirname, 'nominations.db');

// Ensure data directory exists if using production path
if (process.env.NODE_ENV === 'production' && !existsSync('/app/data')) {
  try {
    mkdirSync('/app/data', { recursive: true });
  } catch (err) {
    console.error('Could not create data directory:', err);
  }
}

console.log('Using database at:', dbPath);
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  // Users table (committee members)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'committee')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Nominations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS nominations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      achievements TEXT,
      year INTEGER,
      additional_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Votes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomination_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      vote TEXT NOT NULL CHECK(vote IN ('yes', 'no', 'abstain')),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (nomination_id) REFERENCES nominations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(nomination_id, user_id)
    )
  `);

  console.log('Database initialized successfully');
}

initializeDatabase();

export default db;
