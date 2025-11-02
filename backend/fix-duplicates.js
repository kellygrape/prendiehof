import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'nominations.db'));

console.log('Fixing duplicate nominations...\n');

// 1. Anne Pescatore - change year from 1979 to 1978 for both
console.log('1. Standardizing Anne Pescatore (changing 1979 to 1978)...');
const pescatore = db.prepare(`
  UPDATE nominations
  SET year = 1978
  WHERE name LIKE '%Anne Pescatore%'
`).run();
console.log(`   ✅ Updated ${pescatore.changes} row(s)\n`);

// 2. Judy Culbertson - standardize all variations to "Judy (Gormley) Culbertson"
console.log('2. Standardizing Judy Culbertson variations to "Judy (Gormley) Culbertson"...');
const judyVariations = [
  'Judy (Gormley) Culbertson',
  'Judy Gormley Culbertson',
  'Judith Culbertson'
];

for (const variation of judyVariations) {
  const result = db.prepare(`
    UPDATE nominations
    SET name = 'Judy (Gormley) Culbertson', year = 1978
    WHERE name = ?
  `).run(variation);
  if (result.changes > 0) {
    console.log(`   ✅ Updated ${result.changes} row(s) from "${variation}"`);
  }
}
console.log('');

// 3. Suzanne McShane - standardize to "Suzanne McShane Hall"
console.log('3. Standardizing Suzanne McShane to "Suzanne McShane Hall"...');
const suzanneVariations = [
  'Suzanne McShane',
  'Suzanne McShane Hall'
];

for (const variation of suzanneVariations) {
  const result = db.prepare(`
    UPDATE nominations
    SET name = 'Suzanne McShane Hall', year = 1980
    WHERE name = ?
  `).run(variation);
  if (result.changes > 0) {
    console.log(`   ✅ Updated ${result.changes} row(s) from "${variation}"`);
  }
}
console.log('');

// 4. Check Elaine Van Blunk variations (McGillam vs McGillian)
console.log('4. Checking Elaine Van Blunk variations...');
const elaineCheck = db.prepare(`
  SELECT name, year, COUNT(*) as count
  FROM nominations
  WHERE name LIKE '%Elaine Van Blunk%'
  GROUP BY name, year
`).all();
console.log('   Found:', elaineCheck);

if (elaineCheck.length > 1) {
  console.log('   Standardizing to "Elaine Van Blunk (McGillian)"...');
  const result = db.prepare(`
    UPDATE nominations
    SET name = 'Elaine Van Blunk (McGillian)', year = 1982
    WHERE name LIKE '%Elaine Van Blunk%'
  `).run();
  console.log(`   ✅ Updated ${result.changes} row(s)\n`);
}

// Show final summary grouped by person
console.log('\n═══════════════════════════════════════');
console.log('Final nomination counts by person:');
console.log('═══════════════════════════════════════\n');

const summary = db.prepare(`
  SELECT name, year, COUNT(*) as nomination_count
  FROM nominations
  GROUP BY name, year
  HAVING COUNT(*) > 1
  ORDER BY nomination_count DESC, name
`).all();

if (summary.length > 0) {
  console.log('People with multiple nominations:');
  summary.forEach(row => {
    console.log(`  ${row.name} (${row.year}): ${row.nomination_count} nominations`);
  });
} else {
  console.log('No duplicate entries found - all nominations are unique!');
}

console.log('\n✅ Done!\n');

db.close();
