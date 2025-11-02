import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use production path if it exists, otherwise local
const dbPath = process.env.NODE_ENV === 'production' && existsSync('/app/data')
  ? '/app/data/nominations.db'
  : join(__dirname, 'nominations.db');

console.log('Using database at:', dbPath);
const db = new Database(dbPath);

async function createAdmin(username, password) {
  console.log('\nCreating admin account...\n');

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO users (username, password, role)
      VALUES (?, ?, ?)
    `);

    insertStmt.run(username, hashedPassword, 'admin');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Admin account created successfully!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠️  Save these credentials securely!\n');
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    db.close();
  }
}

// Get credentials from command line or use defaults
const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'changeme123!';

if (!process.argv[2] || !process.argv[3]) {
  console.log('⚠️  Warning: Using default credentials!');
  console.log('Usage: node create-admin.js <username> <password>');
  console.log('');
}

createAdmin(username, password);
