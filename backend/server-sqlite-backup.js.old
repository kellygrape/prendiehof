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
// Configure CORS to allow frontend in production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for nomination imports

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

// Register user (admin only, or initial setup)
app.post('/api/auth/register', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
    const result = stmt.run(username, hashedPassword, role);

    res.status(201).json({
      message: 'User created successfully',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
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

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

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

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Initialize admin account (only works if no admin exists)
app.post('/api/auth/init-admin', async (req, res) => {
  try {
    const existingAdmin = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');

    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
    const result = stmt.run(username, hashedPassword, 'admin');

    res.status(201).json({
      message: 'Admin account created successfully',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create admin account' });
  }
});

// ============ NOMINATION ROUTES ============

// Get all nominations
app.get('/api/nominations', authenticateToken, (req, res) => {
  try {
    const nominations = db.prepare(`
      SELECT n.*,
             COUNT(DISTINCT CASE WHEN v.vote = 'yes' THEN v.id END) as yes_votes,
             COUNT(DISTINCT CASE WHEN v.vote = 'no' THEN v.id END) as no_votes,
             COUNT(DISTINCT CASE WHEN v.vote = 'abstain' THEN v.id END) as abstain_votes,
             COUNT(DISTINCT v.id) as total_votes
      FROM nominations n
      LEFT JOIN votes v ON n.id = v.nomination_id
      GROUP BY n.id
      ORDER BY n.created_at DESC
    `).all();

    res.json(nominations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nominations' });
  }
});

// Get single nomination with user's vote
app.get('/api/nominations/:id', authenticateToken, (req, res) => {
  try {
    const nomination = db.prepare(`
      SELECT n.*,
             COUNT(DISTINCT CASE WHEN v.vote = 'yes' THEN v.id END) as yes_votes,
             COUNT(DISTINCT CASE WHEN v.vote = 'no' THEN v.id END) as no_votes,
             COUNT(DISTINCT CASE WHEN v.vote = 'abstain' THEN v.id END) as abstain_votes
      FROM nominations n
      LEFT JOIN votes v ON n.id = v.nomination_id
      WHERE n.id = ?
      GROUP BY n.id
    `).get(req.params.id);

    if (!nomination) {
      return res.status(404).json({ error: 'Nomination not found' });
    }

    // Get user's vote if exists
    const userVote = db.prepare('SELECT * FROM votes WHERE nomination_id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    res.json({ ...nomination, userVote });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nomination' });
  }
});

// Create nomination (admin only)
app.post('/api/nominations', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, category, description, achievements, year, additional_info } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO nominations (name, category, description, achievements, year, additional_info, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      category || null,
      description || null,
      achievements || null,
      year || null,
      additional_info || null,
      req.user.id
    );

    res.status(201).json({
      message: 'Nomination created successfully',
      nominationId: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create nomination' });
  }
});

// Update nomination (admin only)
app.put('/api/nominations/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, category, description, achievements, year, additional_info } = req.body;

    const stmt = db.prepare(`
      UPDATE nominations
      SET name = ?, category = ?, description = ?, achievements = ?, year = ?, additional_info = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      name,
      category || null,
      description || null,
      achievements || null,
      year || null,
      additional_info || null,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Nomination not found' });
    }

    res.json({ message: 'Nomination updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update nomination' });
  }
});

// Delete nomination (admin only)
app.delete('/api/nominations/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM nominations WHERE id = ?');
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Nomination not found' });
    }

    res.json({ message: 'Nomination deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete nomination' });
  }
});

// ============ PEOPLE ROUTES (Grouped Nominations) ============

// Get unique people (grouped nominations)
app.get('/api/people', authenticateToken, (req, res) => {
  try {
    const people = db.prepare(`
      SELECT
        name,
        year,
        COUNT(*) as nomination_count,
        GROUP_CONCAT(id) as nomination_ids
      FROM nominations
      GROUP BY name, year
      ORDER BY name
    `).all();

    res.json(people);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch people' });
  }
});

// Get all nominations for a specific person
app.get('/api/people/:name/:year/nominations', authenticateToken, (req, res) => {
  try {
    const { name, year } = req.params;

    const nominations = db.prepare(`
      SELECT *
      FROM nominations
      WHERE name = ? AND year = ?
      ORDER BY created_at DESC
    `).all(name, year);

    if (nominations.length === 0) {
      return res.status(404).json({ error: 'No nominations found for this person' });
    }

    res.json(nominations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nominations' });
  }
});

// ============ BALLOT ROUTES ============

// Get current user's ballot selections
app.get('/api/ballot/my-selections', authenticateToken, (req, res) => {
  try {
    const selections = db.prepare(`
      SELECT person_name, person_year, created_at, updated_at
      FROM ballot_selections
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json(selections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ballot selections' });
  }
});

// Save/update ballot selections
app.post('/api/ballot', authenticateToken, (req, res) => {
  try {
    const { selections } = req.body; // Array of { person_name, person_year }

    if (!Array.isArray(selections)) {
      return res.status(400).json({ error: 'Selections must be an array' });
    }

    if (selections.length > 8) {
      return res.status(400).json({ error: 'Cannot select more than 8 people' });
    }

    // Validate that all people exist
    for (const selection of selections) {
      const exists = db.prepare(`
        SELECT COUNT(*) as count
        FROM nominations
        WHERE name = ? AND year = ?
      `).get(selection.person_name, selection.person_year);

      if (exists.count === 0) {
        return res.status(400).json({
          error: `Person not found: ${selection.person_name} (${selection.person_year})`
        });
      }
    }

    // Use transaction to update selections
    const updateBallot = db.transaction((userId, selections) => {
      // Delete all existing selections for this user
      db.prepare('DELETE FROM ballot_selections WHERE user_id = ?').run(userId);

      // Insert new selections
      const insertStmt = db.prepare(`
        INSERT INTO ballot_selections (user_id, person_name, person_year)
        VALUES (?, ?, ?)
      `);

      for (const selection of selections) {
        insertStmt.run(userId, selection.person_name, selection.person_year);
      }
    });

    updateBallot(req.user.id, selections);

    res.json({ message: 'Ballot saved successfully', count: selections.length });
  } catch (error) {
    console.error('Ballot save error:', error);
    res.status(500).json({ error: 'Failed to save ballot' });
  }
});

// Get voting results
app.get('/api/results', authenticateToken, (req, res) => {
  try {
    const results = db.prepare(`
      SELECT
        n.name,
        n.year,
        COUNT(DISTINCT n.id) as nomination_count,
        COUNT(DISTINCT bs.id) as selection_count,
        (SELECT COUNT(*) FROM users WHERE role = 'committee') as total_committee_members
      FROM nominations n
      LEFT JOIN ballot_selections bs ON n.name = bs.person_name AND n.year = bs.person_year
      GROUP BY n.name, n.year
      ORDER BY selection_count DESC, n.name
    `).all();

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// ============ USER MANAGEMENT ROUTES ============

// Get all users (admin only)
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    // Prevent deleting yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============ ADMIN IMPORT ROUTE ============

// Import nominations (admin only)
app.post('/api/admin/import-nominations', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { nominations } = req.body;

    if (!Array.isArray(nominations) || nominations.length === 0) {
      return res.status(400).json({ error: 'Invalid nominations data. Expected array of nomination objects.' });
    }

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
    const errors = [];

    const importMany = db.transaction((nominations) => {
      for (const nom of nominations) {
        try {
          if (!nom.name) {
            errorCount++;
            errors.push({ nomination: nom, error: 'Missing name' });
            continue;
          }

          insertStmt.run(
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
          );
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({ nomination: nom.name, error: error.message });
        }
      }
    });

    importMany(nominations);

    res.json({
      message: 'Import completed',
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ error: 'Import failed', details: error.message });
  }
});

// ============ STATS ROUTE ============

app.get('/api/stats', authenticateToken, (req, res) => {
  try {
    const stats = {
      totalPeople: db.prepare('SELECT COUNT(DISTINCT name || year) as count FROM nominations').get().count,
      totalNominations: db.prepare('SELECT COUNT(*) as count FROM nominations').get().count,
      totalCommitteeMembers: db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('committee').count,
      mySelectionsCount: db.prepare('SELECT COUNT(*) as count FROM ballot_selections WHERE user_id = ?').get(req.user.id).count
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hall of Fame Nominations API' });
});

// ============ ONE-TIME SETUP ENDPOINT ============
// Call this once to initialize database with admin and committee accounts
app.post('/api/setup', async (req, res) => {
  try {
    const { setupKey, adminUsername, adminPassword } = req.body;

    // Verify setup key (set this in Railway environment variables)
    const SETUP_KEY = process.env.SETUP_KEY || 'change-this-secret-key';

    if (setupKey !== SETUP_KEY) {
      return res.status(403).json({ error: 'Invalid setup key' });
    }

    // Check if admin already exists
    const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists. Setup already completed.' });
    }

    const credentials = [];

    // Create admin
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const adminResult = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(adminUsername, adminHash, 'admin');

    credentials.push({
      name: 'Admin',
      username: adminUsername,
      password: adminPassword,
      role: 'admin'
    });

    // Committee members list
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

    // Generate password helper
    function generatePassword(length = 12) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
      let password = '';
      const randomBytes = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) {
        password += chars[randomBytes[i] % chars.length];
      }
      return password;
    }

    // Create committee accounts
    for (const member of committeeMembers) {
      const password = generatePassword(12);
      const hash = await bcrypt.hash(password, 10);

      try {
        db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(member.username, hash, 'committee');
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

    res.json({
      message: 'Setup completed successfully!',
      credentials: credentials,
      warning: 'Save these credentials securely and delete this endpoint after setup!'
    });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Setup failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
