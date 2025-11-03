import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

// Use DATABASE_URL from Railway in production, or local Postgres in development
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/nominations_dev',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log('Connected to PostgreSQL database');
console.log('Using connection string:', process.env.DATABASE_URL ? 'DATABASE_URL from env' : 'default localhost');

// Initialize database schema
async function initializeDatabase() {
  const client = await pool.connect();

  try {
    // Users table (committee members)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'committee')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Nominations table with detailed fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS nominations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        year INTEGER,

        career_position TEXT,

        professional_achievements TEXT,
        professional_awards TEXT,
        educational_achievements TEXT,
        merit_awards TEXT,

        service_church_community TEXT,
        service_mbaphs TEXT,

        nomination_summary TEXT,

        nominator_name TEXT,
        nominator_email TEXT,
        nominator_phone TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id)
      )
    `);

    // Ballot selections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ballot_selections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        person_name TEXT NOT NULL,
        person_year TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, person_name, person_year)
      )
    `);

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_ballot_selections_user ON ballot_selections(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_nominations_name_year ON nominations(name, year)');

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Initialize on startup
initializeDatabase().catch(console.error);

export default pool;
