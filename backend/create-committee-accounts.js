import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'nominations.db'));

// Generate secure random password
function generatePassword(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }

  return password;
}

async function createCommitteeAccounts(members) {
  console.log('Creating committee member accounts...\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('⚠️  IMPORTANT: Save these credentials securely!');
  console.log('   Each member should change their password after first login.');
  console.log('═══════════════════════════════════════════════════════════\n');

  const credentials = [];

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, role)
    VALUES (?, ?, ?)
  `);

  for (const member of members) {
    const password = generatePassword(12);
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const result = insertStmt.run(member.username, hashedPassword, 'committee');

      if (result.changes > 0) {
        credentials.push({
          name: member.name,
          username: member.username,
          password: password,
          email: member.email
        });
        console.log(`✅ Created: ${member.name} (${member.username})`);
      } else {
        console.log(`⚠️  Skipped: ${member.username} (already exists)`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${member.username}:`, error.message);
    }
  }

  // Output credentials in a secure format
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('COMMITTEE MEMBER CREDENTIALS');
  console.log('═══════════════════════════════════════════════════════════\n');

  credentials.forEach((cred, index) => {
    console.log(`${index + 1}. ${cred.name}`);
    console.log(`   Email: ${cred.email || 'N/A'}`);
    console.log(`   Username: ${cred.username}`);
    console.log(`   Temporary Password: ${cred.password}`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📧 NEXT STEPS:');
  console.log('   1. Send each member their credentials via secure channel');
  console.log('   2. Consider using a password manager to share (1Password, etc.)');
  console.log('   3. Ask members to change password after first login');
  console.log('   4. Delete this output after sharing credentials');
  console.log('═══════════════════════════════════════════════════════════\n');

  db.close();
}

// Example committee members - CUSTOMIZE THIS LIST
const committeeMembers = [
  { name: 'John Smith', username: 'jsmith', email: 'john@example.com' },
  { name: 'Jane Doe', username: 'jdoe', email: 'jane@example.com' },
  { name: 'Bob Wilson', username: 'bwilson', email: 'bob@example.com' },
  // Add more committee members here
];

// Run the script
createCommitteeAccounts(committeeMembers);
