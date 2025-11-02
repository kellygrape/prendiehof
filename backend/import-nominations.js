import Database from 'better-sqlite3';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'nominations.db'));

// CSV column mapping to database fields
const COLUMN_MAPPING = {
  'Name of the Nominee': 'name',
  'Graduation Year': 'year',
  'Career / Position / Title': 'position',
  'Professional Achievements': 'professional_achievements',
  'Professional Awards and Honors': 'professional_awards',
  'Educational Achievements': 'educational_achievements',
  'Merit Awards': 'merit_awards',
  'Service to Church and Community': 'service_church',
  'Service to MBAPHS': 'service_mbaphs',
  'Nomination Summary / Narrative': 'narrative',
  'Your Name': 'nominator_name',
  'Email': 'nominator_email',
  'Phone': 'nominator_phone'
};

async function importNominations(csvFilePath) {
  console.log('Starting import from:', csvFilePath);
  console.log('');

  // Get the first admin user to attribute nominations to
  const admin = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('admin');

  if (!admin) {
    console.error('❌ Error: No admin user found. Please create an admin account first.');
    process.exit(1);
  }

  const adminId = admin.id;
  console.log(`Using admin ID: ${adminId} for created_by field`);
  console.log('');

  const nominations = [];
  let rowCount = 0;

  return new Promise((resolve, reject) => {
    createReadStream(csvFilePath)
      .pipe(parse({
        columns: (header) => {
          // Handle duplicate column names by renaming them
          const seen = {};
          return header.map((col) => {
            // Normalize spacing
            const normalized = col.replace(/\s+/g, ' ').trim();
            if (seen[normalized]) {
              seen[normalized]++;
              return `${normalized} ${seen[normalized]}`;
            } else {
              seen[normalized] = 1;
              return normalized;
            }
          });
        },
        skip_empty_lines: true,
        trim: true
      }))
      .on('data', (row) => {
        rowCount++;

        const nomination = {
          name: row['Name of the Nominee'],
          year: row['Graduation Year'] || null,
          career_position: row['Career / Position / Title'] || null,
          professional_achievements: row['Professional Achievements'] || null,
          professional_awards: row['Professional Awards and Honors'] || null,
          educational_achievements: row['Educational Achievements'] || null,
          merit_awards: row['Merit Awards'] || null,
          service_church_community: row['Service to Church and Community'] || null,
          service_mbaphs: row['Service to MBAPHS'] || null,
          nomination_summary: row['Nomination Summary / Narrative'] || null,
          nominator_name: row['Your Name'] || null,
          nominator_email: row['Email'] || null,
          nominator_phone: row['Phone'] || null,
          created_by: adminId
        };

        nominations.push(nomination);
      })
      .on('end', () => {
        console.log(`Parsed ${rowCount} rows from CSV`);
        console.log('');

        // Insert nominations into database
        const insertStmt = db.prepare(`
          INSERT INTO nominations (
            name, year, career_position,
            professional_achievements, professional_awards,
            educational_achievements, merit_awards,
            service_church_community, service_mbaphs,
            nomination_summary,
            nominator_name, nominator_email, nominator_phone,
            created_by
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let successCount = 0;
        let errorCount = 0;

        const insertMany = db.transaction((nominations) => {
          for (const nom of nominations) {
            try {
              if (!nom.name) {
                console.log(`⚠️  Skipping row - no name provided`);
                errorCount++;
                continue;
              }

              insertStmt.run(
                nom.name,
                nom.year,
                nom.career_position,
                nom.professional_achievements,
                nom.professional_awards,
                nom.educational_achievements,
                nom.merit_awards,
                nom.service_church_community,
                nom.service_mbaphs,
                nom.nomination_summary,
                nom.nominator_name,
                nom.nominator_email,
                nom.nominator_phone,
                nom.created_by
              );
              successCount++;
              console.log(`✅ Imported: ${nom.name}${nom.year ? ` (${nom.year})` : ''}`);
            } catch (error) {
              errorCount++;
              console.error(`❌ Error importing ${nom.name}:`, error.message);
            }
          }
        });

        try {
          insertMany(nominations);
          console.log('');
          console.log('═══════════════════════════════════════');
          console.log(`✅ Import completed!`);
          console.log(`   Successfully imported: ${successCount} nominations`);
          if (errorCount > 0) {
            console.log(`   Errors: ${errorCount}`);
          }
          console.log('═══════════════════════════════════════');
          resolve({ successCount, errorCount });
        } catch (error) {
          console.error('❌ Transaction error:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });
}

// Main execution
const csvFile = process.argv[2];

if (!csvFile) {
  console.log('Usage: node import-nominations.js <path-to-csv-file>');
  console.log('');
  console.log('Example:');
  console.log('  node import-nominations.js nominations.csv');
  console.log('  node import-nominations.js /path/to/your/file.csv');
  console.log('');
  console.log('CSV should have these columns:');
  console.log('  - Name of the Nominee');
  console.log('  - Graduation Year');
  console.log('  - Career / Position / Title');
  console.log('  - Professional Achievements');
  console.log('  - Professional Awards and Honors');
  console.log('  - Educational Achievements');
  console.log('  - Merit Awards');
  console.log('  - Service to Church and Community');
  console.log('  - Service to MBAPHS');
  console.log('  - Nomination Summary / Narrative');
  console.log('  - Your Name');
  console.log('  - Email');
  console.log('  - Phone');
  process.exit(1);
}

importNominations(csvFile)
  .then(() => {
    console.log('');
    console.log('You can now view the nominations in the web interface!');
    db.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    db.close();
    process.exit(1);
  });
