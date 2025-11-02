import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('server-sqlite-backup.js', 'utf8');

let converted = content;

// Convert db.prepare().get() pattern
converted = converted.replace(
  /const\s+(\w+)\s*=\s*db\.prepare\((.*?)\)\.get\((.*?)\);/gs,
  (match, varName, query, params) => {
    const pgQuery = query.replace(/\?/g, (m, offset, string) => {
      const beforeCount = string.substring(0, offset).split('?').length;
      return `$${beforeCount}`;
    });
    return `const result = await db.query(${pgQuery}, [${params}]);\n    const ${varName} = result.rows[0];`;
  }
);

// Convert db.prepare().all() pattern
converted = converted.replace(
  /const\s+(\w+)\s*=\s*db\.prepare\((.*?)\)\.all\((.*?)\);/gs,
  (match, varName, query, params) => {
    const pgQuery = query.replace(/\?/g, (m, offset, string) => {
      const beforeCount = string.substring(0, offset).split('?').length;
      return `$${beforeCount}`;
    });
    return `const result = await db.query(${pgQuery}, [${params}]);\n    const ${varName} = result.rows;`;
  }
);

// Convert db.prepare().run() pattern
converted = converted.replace(
  /const\s+(\w+)\s*=\s*db\.prepare\((.*?)\)\.run\((.*?)\);/gs,
  (match, varName, query, params) => {
    const pgQuery = query.replace(/\?/g, (m, offset, string) => {
      const beforeCount = string.substring(0, offset).split('?').length;
      return `$${beforeCount}`;
    });
    return `const ${varName} = await db.query(${pgQuery}, [${params}]);`;
  }
);

writeFileSync('server-converted.js', converted);
console.log('Conversion complete! Check server-converted.js');
console.log('Note: Manual review needed for complex queries and transactions');
