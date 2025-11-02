import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import db from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Admin-only middleware
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, role]
    );

    res.status(201).json({
      message: 'User created successfully',
      userId: result.rows[0].id
    });
  } catch (error) {
    if (error.message.includes('duplicate key') || error.code === '23505') {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============ PEOPLE ROUTES ============

// Get all people (grouped nominations)
app.get('/api/people', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT name, year, COUNT(*) as nomination_count,
             array_agg(id) as nomination_ids
      FROM nominations
      GROUP BY name, year
      ORDER BY name
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch people' });
  }
});

// Get nominations for specific person
app.get('/api/people/:name/:year/nominations', authenticateToken, async (req, res) => {
  try {
    const { name, year } = req.params;

    const result = await db.query(`
      SELECT *
      FROM nominations
      WHERE name = $1 AND year = $2
      ORDER BY created_at DESC
    `, [name, year]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No nominations found for this person' });
    }

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nominations' });
  }
});

// ============ BALLOT ROUTES ============

// Get current user's ballot selections
app.get('/api/ballot/my-selections', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT person_name, person_year, created_at, updated_at
      FROM ballot_selections
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ballot selections' });
  }
});

// Save/update ballot selections
app.post('/api/ballot', authenticateToken, async (req, res) => {
  const client = await db.connect();

  try {
    const { selections } = req.body;

    if (!Array.isArray(selections)) {
      return res.status(400).json({ error: 'Selections must be an array' });
    }

    if (selections.length > 8) {
      return res.status(400).json({ error: 'Maximum 8 selections allowed' });
    }

    await client.query('BEGIN');

    // Delete existing selections
    await client.query('DELETE FROM ballot_selections WHERE user_id = $1', [req.user.id]);

    // Insert new selections
    for (const selection of selections) {
      await client.query(
        `INSERT INTO ballot_selections (user_id, person_name, person_year)
         VALUES ($1, $2, $3)`,
        [req.user.id, selection.person_name, selection.person_year]
      );
    }

    await client.query('COMMIT');

    res.json({ message: 'Ballot saved successfully', count: selections.length });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to save ballot' });
  } finally {
    client.release();
  }
});

// ============ RESULTS ROUTE ============

app.get('/api/results', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT n.name, n.year,
             COUNT(DISTINCT n.id) as nomination_count,
             COUNT(DISTINCT bs.id) as selection_count,
             (SELECT COUNT(*) FROM users WHERE role = 'committee') as total_committee_members
      FROM nominations n
      LEFT JOIN ballot_selections bs ON n.name = bs.person_name AND n.year::text = bs.person_year
      GROUP BY n.name, n.year
      ORDER BY selection_count DESC, n.name
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// ============ USER MANAGEMENT ROUTES ============

app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============ STATS ROUTE ============

app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const [people, nominations, committee, mySelections] = await Promise.all([
      db.query('SELECT COUNT(DISTINCT (name || year)) as count FROM nominations'),
      db.query('SELECT COUNT(*) as count FROM nominations'),
      db.query("SELECT COUNT(*) as count FROM users WHERE role = 'committee'"),
      db.query('SELECT COUNT(*) as count FROM ballot_selections WHERE user_id = $1', [req.user.id])
    ]);

    res.json({
      totalPeople: parseInt(people.rows[0].count),
      totalNominations: parseInt(nominations.rows[0].count),
      totalCommitteeMembers: parseInt(committee.rows[0].count),
      mySelectionsCount: parseInt(mySelections.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============ ADMIN IMPORT ROUTE ============

app.post('/api/admin/import-nominations', authenticateToken, requireAdmin, async (req, res) => {
  const client = await db.connect();

  try {
    const { nominations } = req.body;

    if (!Array.isArray(nominations) || nominations.length === 0) {
      return res.status(400).json({ error: 'Invalid nominations data' });
    }

    await client.query('BEGIN');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const nom of nominations) {
      try {
        if (!nom.name) {
          errorCount++;
          errors.push({ nomination: nom, error: 'Missing name' });
          continue;
        }

        await client.query(
          `INSERT INTO nominations (
            name, year, career_position,
            professional_achievements, professional_awards,
            educational_achievements, merit_awards,
            service_church_community, service_mbaphs,
            nomination_summary,
            nominator_name, nominator_email, nominator_phone,
            created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            nom.name,
            nom.year || null,
            nom.career_position || null,
            nom.professional_achievements || null,
            nom.professional_awards || null,
            nom.educational_achievements || null,
            nom.merit_awards || null,
            nom.service_church_community || null,
            nom.service_mbaphs || null,
            nom.nomination_summary || null,
            nom.nominator_name || null,
            nom.nominator_email || null,
            nom.nominator_phone || null,
            req.user.id
          ]
        );
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({ nomination: nom.name, error: error.message });
      }
    }

    await client.query('COMMIT');

    res.json({
      message: 'Import completed',
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Import failed', details: error.message });
  } finally {
    client.release();
  }
});

// ============ ONE-TIME SETUP ENDPOINT ============

app.post('/api/setup', async (req, res) => {
  const client = await db.connect();

  try {
    const { setupKey, adminUsername, adminPassword } = req.body;

    const SETUP_KEY = process.env.SETUP_KEY || 'change-this-secret-key';

    if (setupKey !== SETUP_KEY) {
      return res.status(403).json({ error: 'Invalid setup key' });
    }

    // Check if admin already exists
    const adminCheck = await client.query("SELECT id FROM users WHERE role = 'admin'");
    if (adminCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Admin already exists. Setup already completed.' });
    }

    await client.query('BEGIN');

    const credentials = [];

    // Create admin
    const adminHash = await bcrypt.hash(adminPassword, 10);
    await client.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [adminUsername, adminHash, 'admin']
    );

    credentials.push({
      name: 'Admin',
      username: adminUsername,
      password: adminPassword,
      role: 'admin'
    });

    // Committee members
    const committeeMembers = [
      { name: "Kelly Anne Pipe", username: "kpipe", email: "kellyanne.martin@gmail.com" },
      { name: "Anne Marie Dolceamore", username: "adolceamore", email: "dolceamore@bonnerprendie.com" },
      { name: "Lisa Stabilo", username: "lstabilo", email: "lisas901@comcast.net" },
      { name: "Nikki Gingrich", username: "ngingrich", email: "nicole.gingrich15@gmail.com" },
      { name: "Carol Dunleavy", username: "cdunleavy", email: "caroldunleavy81@comcast.net" },
      { name: "Ashley Weyler", username: "aweyler", email: "arw723@gmail.com" },
      { name: "Erin Brookes", username: "ebrookes", email: "erinkbrookes@gmail.com" },
      { name: "Kelly Lynn Rogers", username: "krogers", email: "kellyrogers129@gmail.com" },
      { name: "Marykate Murphy", username: "mmurphy", email: "marycatherine1112@gmail.com" },
      { name: "Monique Shallow", username: "mshallow", email: "monique.shallow@bonnerprendie.com" }
    ];

    function generatePassword(length = 12) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
      let password = '';
      const randomBytes = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) {
        password += chars[randomBytes[i] % chars.length];
      }
      return password;
    }

    for (const member of committeeMembers) {
      const password = generatePassword(12);
      const hash = await bcrypt.hash(password, 10);

      try {
        await client.query(
          'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
          [member.username, hash, 'committee']
        );
        credentials.push({
          name: member.name,
          username: member.username,
          password: password,
          email: member.email,
          role: 'committee'
        });
      } catch (error) {
        console.error(`Error creating ${member.username}:`, error.message);
      }
    }

    await client.query('COMMIT');

    res.json({
      message: 'Setup completed successfully!',
      credentials: credentials,
      warning: 'Save these credentials securely!'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Setup failed', details: error.message });
  } finally {
    client.release();
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hall of Fame Nominations API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
