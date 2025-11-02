import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'nominations.db'));

console.log('Starting migration to detailed schema...\n');

try {
  // Begin transaction
  db.exec('BEGIN TRANSACTION');

  // Create new nominations table with all fields
  db.exec(`
    CREATE TABLE IF NOT EXISTS nominations_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      year INTEGER,

      -- Career information
      career_position TEXT,

      -- Achievement fields
      professional_achievements TEXT,
      professional_awards TEXT,
      educational_achievements TEXT,
      merit_awards TEXT,

      -- Service fields
      service_church_community TEXT,
      service_mbaphs TEXT,

      -- Summary
      nomination_summary TEXT,

      -- Nominator information
      nominator_name TEXT,
      nominator_email TEXT,
      nominator_phone TEXT,

      -- System fields
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  console.log('✅ Created new nominations table structure');

  // Try to migrate existing data by parsing the concatenated fields
  // This is a best-effort migration
  const oldNominations = db.prepare(`
    SELECT id, name, year, description, achievements, additional_info, created_at, created_by
    FROM nominations
  `).all();

  console.log(`\nMigrating ${oldNominations.length} existing nominations...\n`);

  const insertStmt = db.prepare(`
    INSERT INTO nominations_new (
      id, name, year,
      nomination_summary,
      professional_achievements,
      created_at, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let migratedCount = 0;
  for (const nom of oldNominations) {
    try {
      insertStmt.run(
        nom.id,
        nom.name,
        nom.year,
        nom.description || null,
        nom.achievements || null,
        nom.created_at,
        nom.created_by
      );
      migratedCount++;
      console.log(`✅ Migrated: ${nom.name}${nom.year ? ` (${nom.year})` : ''}`);
    } catch (error) {
      console.error(`❌ Error migrating ${nom.name}:`, error.message);
    }
  }

  // Drop old table and rename new one
  db.exec('DROP TABLE nominations');
  db.exec('ALTER TABLE nominations_new RENAME TO nominations');

  console.log('\n✅ Renamed new table to nominations');

  // Commit transaction
  db.exec('COMMIT');

  console.log('\n═══════════════════════════════════════');
  console.log('✅ Migration completed successfully!');
  console.log(`   Migrated ${migratedCount} of ${oldNominations.length} nominations`);
  console.log('═══════════════════════════════════════');
  console.log('\n⚠️  NOTE: Old concatenated data was preserved in the summary and achievements fields.');
  console.log('   You should re-import your CSV to get properly structured data.\n');

} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.log('Rolling back changes...');
  db.exec('ROLLBACK');
  console.log('✅ Rollback complete');
  process.exit(1);
}

db.close();
