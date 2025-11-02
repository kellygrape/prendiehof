import Database from 'better-sqlite3';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'nominations.db'));

// Create invite_tokens table
db.exec(`
  CREATE TABLE IF NOT EXISTS invite_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
  )
`);

function generateInviteToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createInviteLinks(members, baseUrl) {
  console.log('Creating invite links for committee members...\n');
  console.log('═══════════════════════════════════════════════════════════');

  const invites = [];
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO invite_tokens (email, name, token, expires_at)
    VALUES (?, ?, ?, datetime('now', '+7 days'))
  `);

  for (const member of members) {
    const token = generateInviteToken();

    try {
      insertStmt.run(member.email, member.name, token);
      const inviteLink = `${baseUrl}/setup?token=${token}`;

      invites.push({
        name: member.name,
        email: member.email,
        link: inviteLink
      });

      console.log(`✅ ${member.name}`);
      console.log(`   ${inviteLink}\n`);
    } catch (error) {
      console.error(`❌ Error creating invite for ${member.email}:`, error.message);
    }
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📧 Send each member their unique setup link');
  console.log('   Links expire in 7 days');
  console.log('   Users will create their own username and password');
  console.log('═══════════════════════════════════════════════════════════\n');

  db.close();
}

// Example usage - CUSTOMIZE THIS
const committeeMembers = [
  { name: 'John Smith', email: 'john@example.com' },
  { name: 'Jane Doe', email: 'jane@example.com' },
  // Add more members
];

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

createInviteLinks(committeeMembers, BASE_URL);
