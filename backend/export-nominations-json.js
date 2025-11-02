import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'nominations.db'));

console.log('Exporting nominations to JSON...\n');

try {
  const nominations = db.prepare(`
    SELECT
      name, year, career_position,
      professional_achievements, professional_awards,
      educational_achievements, merit_awards,
      service_church_community, service_mbaphs,
      nomination_summary,
      nominator_name, nominator_email, nominator_phone
    FROM nominations
    ORDER BY name, year
  `).all();

  console.log(`Found ${nominations.length} nominations`);

  // Write to JSON file
  const jsonData = JSON.stringify({ nominations }, null, 2);
  writeFileSync('nominations-export.json', jsonData);

  console.log('\n✅ Exported to nominations-export.json');
  console.log(`   ${nominations.length} nominations ready for import\n`);

  db.close();
} catch (error) {
  console.error('❌ Export failed:', error.message);
  db.close();
  process.exit(1);
}
