# Importing Nominations from CSV

This guide explains how to import nominations from your Excel/CSV file.

## Step 1: Export Your Excel to CSV

1. Open your Excel file
2. Go to **File** → **Save As**
3. Choose **CSV (Comma delimited) (*.csv)** as the format
4. Save it as `nominations.csv` (or any name you prefer)

## Step 2: Verify Column Names

Make sure your CSV has these exact column headers (case-sensitive):

- Name of the Nominee
- Graduation Year
- Career / Position / Title
- Professional Achievements
- Professional Awards and Honors
- Educational Achievements
- Merit Awards
- Service to Church and Community
- Service to MBAPHS
- Nomination Summary / Narrative
- Your Name
- Email
- Phone

**Note:** The columns must match exactly as shown above. If your Excel has different column names, rename them before exporting to CSV.

## Step 3: Place the CSV File

Copy your CSV file to the backend directory:

```bash
cp /path/to/your/nominations.csv /Users/kellyanne/Sites/prendiehofnominations/backend/
```

Or just move it to: `/Users/kellyanne/Sites/prendiehofnominations/backend/`

## Step 4: Create Admin Account First

Before importing, make sure you have created an admin account:

1. Go to http://localhost:3000
2. Create your first admin account
3. The import script will attribute all nominations to this admin

## Step 5: Run the Import

From the backend directory, run:

```bash
cd /Users/kellyanne/Sites/prendiehofnominations/backend
node import-nominations.js nominations.csv
```

Or if your CSV is somewhere else:

```bash
node import-nominations.js /path/to/your/file.csv
```

Or use the npm script:

```bash
npm run import nominations.csv
```

## What Happens During Import

The script will:
1. Read your CSV file
2. Map all columns to the database fields
3. Combine related fields (achievements, service info, etc.)
4. Insert each nomination into the database
5. Show progress with ✅ for success and ❌ for errors

## How Fields Are Mapped

The import script intelligently combines your detailed columns into the app's structure:

**Name**: `Name of the Nominee` → nomination name

**Year**: `Graduation Year` → stored as year

**Category**: Set to "Hall of Fame" (you can edit after import)

**Description**: `Nomination Summary / Narrative` → main description

**Achievements**: Combines:
- Professional Achievements
- Professional Awards and Honors (prefixed with "Awards:")
- Educational Achievements (prefixed with "Education:")
- Merit Awards (prefixed with "Merit:")

**Additional Info**: Combines:
- Career / Position / Title (prefixed with "Position:")
- Service to Church and Community
- Service to MBAPHS
- Nominator info (Your Name, Email, Phone)

## After Import

1. Refresh your browser at http://localhost:3000
2. Go to the Nominations page
3. All imported nominations should appear
4. You can edit any nomination from the Admin Panel if needed

## Troubleshooting

**Error: "No admin user found"**
- Create an admin account first at http://localhost:3000

**Error: "ENOENT: no such file or directory"**
- Check the file path is correct
- Make sure the CSV file exists

**Some nominations skipped**
- Check that each row has at least a name
- Empty name rows will be skipped

**Column name errors**
- Verify your CSV column headers match exactly (including spaces and capitalization)
- Re-export from Excel if needed

## Re-importing

If you need to import again:

1. **Option A - Delete all nominations first:**
   ```bash
   # This will delete all nominations
   sqlite3 nominations.db "DELETE FROM nominations;"
   ```

2. **Option B - Import will add to existing:**
   The script will add new nominations without deleting existing ones.

## Example

```bash
# Full example workflow
cd /Users/kellyanne/Sites/prendiehofnominations/backend

# Copy your CSV
cp ~/Downloads/hof-nominations.csv ./nominations.csv

# Run import
node import-nominations.js nominations.csv
```

Output will look like:
```
Starting import from: nominations.csv

Using admin ID: 1 for created_by field

Parsed 25 rows from CSV

✅ Imported: John Doe (1995)
✅ Imported: Jane Smith (1998)
✅ Imported: Robert Johnson (2001)
...

═══════════════════════════════════════
✅ Import completed!
   Successfully imported: 25 nominations
═══════════════════════════════════════

You can now view the nominations in the web interface!
```
