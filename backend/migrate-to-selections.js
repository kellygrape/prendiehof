import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'nominations.db'));

console.log('Migrating voting system to selection-based ballots...\n');

// Drop old votes table and create new ballot_selections table
console.log('1. Dropping old votes table...');
db.exec('DROP TABLE IF EXISTS votes');
console.log('   ✅ Old votes table dropped\n');

// Create new ballot_selections table
console.log('2. Creating ballot_selections table...');
db.exec(`
  CREATE TABLE ballot_selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    person_name TEXT NOT NULL,
    person_year TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, person_name, person_year)
  )
`);
console.log('   ✅ ballot_selections table created\n');

// Create index for faster queries
console.log('3. Creating indexes...');
db.exec(`
  CREATE INDEX idx_ballot_user ON ballot_selections(user_id);
  CREATE INDEX idx_ballot_person ON ballot_selections(person_name, person_year);
`);
console.log('   ✅ Indexes created\n');

console.log('═══════════════════════════════════════');
console.log('✅ Migration completed!');
console.log('═══════════════════════════════════════\n');

console.log('New voting system:');
console.log('  - Committee members select up to 8 people');
console.log('  - Multiple nominations per person are grouped');
console.log('  - Results show selection counts per person\n');

db.close();
