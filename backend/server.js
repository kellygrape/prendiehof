import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
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
app.use(express.json());

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

// ============ VOTING ROUTES ============

// Submit or update vote
app.post('/api/votes/:nominationId', authenticateToken, (req, res) => {
  try {
    const { vote, comment } = req.body;
    const nominationId = req.params.nominationId;

    if (!['yes', 'no', 'abstain'].includes(vote)) {
      return res.status(400).json({ error: 'Invalid vote. Must be yes, no, or abstain' });
    }

    // Check if nomination exists
    const nomination = db.prepare('SELECT id FROM nominations WHERE id = ?').get(nominationId);
    if (!nomination) {
      return res.status(404).json({ error: 'Nomination not found' });
    }

    // Insert or replace vote
    const stmt = db.prepare(`
      INSERT INTO votes (nomination_id, user_id, vote, comment, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(nomination_id, user_id)
      DO UPDATE SET vote = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(nominationId, req.user.id, vote, comment || null, vote, comment || null);

    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Get user's votes
app.get('/api/votes/my-votes', authenticateToken, (req, res) => {
  try {
    const votes = db.prepare(`
      SELECT v.*, n.name as nomination_name
      FROM votes v
      JOIN nominations n ON v.nomination_id = n.id
      WHERE v.user_id = ?
      ORDER BY v.updated_at DESC
    `).all(req.user.id);

    res.json(votes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
});

// Get voting results (admin or for finished voting)
app.get('/api/votes/results', authenticateToken, (req, res) => {
  try {
    const results = db.prepare(`
      SELECT
        n.id,
        n.name,
        n.category,
        COUNT(DISTINCT v.id) as total_votes,
        COUNT(DISTINCT CASE WHEN v.vote = 'yes' THEN v.id END) as yes_votes,
        COUNT(DISTINCT CASE WHEN v.vote = 'no' THEN v.id END) as no_votes,
        COUNT(DISTINCT CASE WHEN v.vote = 'abstain' THEN v.id END) as abstain_votes,
        (SELECT COUNT(*) FROM users WHERE role = 'committee') as total_committee_members
      FROM nominations n
      LEFT JOIN votes v ON n.id = v.nomination_id
      GROUP BY n.id
      ORDER BY yes_votes DESC, n.name
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

// ============ STATS ROUTE ============

app.get('/api/stats', authenticateToken, (req, res) => {
  try {
    const stats = {
      totalNominations: db.prepare('SELECT COUNT(*) as count FROM nominations').get().count,
      totalCommitteeMembers: db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('committee').count,
      myVotesCount: db.prepare('SELECT COUNT(*) as count FROM votes WHERE user_id = ?').get(req.user.id).count
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
