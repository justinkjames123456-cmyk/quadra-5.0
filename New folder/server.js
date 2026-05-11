require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

// Initialize Database (synchronous-style helpers)
const db = new sqlite3.Database('tournament.db');

// Promisified helpers
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Create tables
async function initDB() {
  await dbRun(`CREATE TABLE IF NOT EXISTS colleges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    short_name TEXT NOT NULL UNIQUE
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL,
    gender TEXT NOT NULL,
    scheduled_time DATETIME,
    status TEXT DEFAULT 'upcoming',
    team_a_id INTEGER,
    team_b_id INTEGER,
    score_a INTEGER DEFAULT 0,
    score_b INTEGER DEFAULT 0,
    winner_id INTEGER,
    venue TEXT,
    extra_data TEXT,
    FOREIGN KEY (team_a_id) REFERENCES colleges(id),
    FOREIGN KEY (team_b_id) REFERENCES colleges(id)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed colleges if empty
  const row = await dbGet('SELECT COUNT(*) as count FROM colleges');
  if (row.count === 0) {
    const sampleColleges = [
      { full_name: 'Government Medical College Alappuzha', short_name: 'GMC Alappuzha' },
      { full_name: 'Amrita Institute of Medical Sciences', short_name: 'Amrita' },
      { full_name: 'Government Medical College Kottayam', short_name: 'GMC Kottayam' },
      { full_name: 'Government Medical College Thiruvananthapuram', short_name: 'GMC TVM' },
      { full_name: 'Kerala Institute of Medical Sciences', short_name: 'KIMS' },
      { full_name: 'Travancore Medical College', short_name: 'TMC' },
      { full_name: 'Sree Gokulam Medical College', short_name: 'SGMC' },
      { full_name: 'Jubilee Mission Medical College', short_name: 'Jubilee' }
    ];
    for (const c of sampleColleges) {
      try {
        await dbRun('INSERT INTO colleges (full_name, short_name) VALUES (?, ?)', [c.full_name, c.short_name]);
      } catch (e) { /* skip duplicates */ }
    }
  }
}

// Helper: get match with team details
async function getMatchWithTeams(matchId) {
  const match = await dbGet(`
    SELECT m.*,
           ca.short_name as team_a_name, ca.full_name as team_a_full,
           cb.short_name as team_b_name, cb.full_name as team_b_full
    FROM matches m
    LEFT JOIN colleges ca ON m.team_a_id = ca.id
    LEFT JOIN colleges cb ON m.team_b_id = cb.id
    WHERE m.id = ?
  `, [matchId]);

  if (match && match.extra_data) {
    try { match.extra_data = JSON.parse(match.extra_data); } catch (e) { match.extra_data = {}; }
  }
  return match;
}

function parseExtraData(matches) {
  return matches.map(m => {
    if (m.extra_data) {
      try { m.extra_data = JSON.parse(m.extra_data); } catch (e) { m.extra_data = {}; }
    }
    return m;
  });
}

// Socket.io auth middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next();
  const session = await dbGet('SELECT * FROM admin_sessions WHERE token = ?', [token]);
  if (session) socket.isAdmin = true;
  next();
});

// Socket.io connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-match', (matchId) => {
    socket.join(`match-${matchId}`);
  });

  socket.on('update-score', async (data) => {
    if (!socket.isAdmin) { socket.emit('error', { message: 'Unauthorized' }); return; }
    const { matchId, field, value } = data;
    const match = await dbGet('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (!match) { socket.emit('error', { message: 'Match not found' }); return; }

    if (field === 'score_a') await dbRun('UPDATE matches SET score_a = ? WHERE id = ?', [value, matchId]);
    else if (field === 'score_b') await dbRun('UPDATE matches SET score_b = ? WHERE id = ?', [value, matchId]);
    else if (field === 'extra_data') await dbRun('UPDATE matches SET extra_data = ? WHERE id = ?', [JSON.stringify(value), matchId]);

    const updated = await getMatchWithTeams(matchId);
    io.to(`match-${matchId}`).emit('score-updated', updated);
    io.to('leaderboard').emit('leaderboard-update');
  });

  socket.on('update-status', async (data) => {
    if (!socket.isAdmin) { socket.emit('error', { message: 'Unauthorized' }); return; }
    const { matchId, status, winnerId } = data;
    await dbRun('UPDATE matches SET status = ?, winner_id = ? WHERE id = ?', [status, winnerId || null, matchId]);
    const updated = await getMatchWithTeams(matchId);
    io.to(`match-${matchId}`).emit('status-updated', updated);
    io.to('leaderboard').emit('leaderboard-update');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ── API Routes ──────────────────────────────────────────────

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    const token = bcrypt.hashSync(Date.now().toString(), 10);
    await dbRun('INSERT INTO admin_sessions (token) VALUES (?)', [token]);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// Verify admin token
app.get('/api/admin/verify', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ valid: false });
  const session = await dbGet('SELECT * FROM admin_sessions WHERE token = ?', [token]);
  res.json({ valid: !!session });
});

// Colleges
app.get('/api/colleges', async (req, res) => {
  const colleges = await dbAll('SELECT * FROM colleges ORDER BY short_name');
  res.json(colleges);
});

app.post('/api/colleges', async (req, res) => {
  const { full_name, short_name } = req.body;
  try {
    const result = await dbRun('INSERT INTO colleges (full_name, short_name) VALUES (?, ?)', [full_name, short_name]);
    res.json({ id: result.lastID, full_name, short_name });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/colleges/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, short_name } = req.body;
  try {
    await dbRun('UPDATE colleges SET full_name = ?, short_name = ? WHERE id = ?', [full_name, short_name, id]);
    res.json({ id: parseInt(id), full_name, short_name });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/colleges/:id', async (req, res) => {
  await dbRun('DELETE FROM colleges WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Matches
app.get('/api/matches', async (req, res) => {
  const { sport, gender, status } = req.query;
  let query = `
    SELECT m.*,
           ca.short_name as team_a_name, ca.full_name as team_a_full,
           cb.short_name as team_b_name, cb.full_name as team_b_full
    FROM matches m
    LEFT JOIN colleges ca ON m.team_a_id = ca.id
    LEFT JOIN colleges cb ON m.team_b_id = cb.id
    WHERE 1=1
  `;
  const params = [];
  if (sport)  { query += ' AND m.sport = ?';   params.push(sport); }
  if (gender) { query += ' AND m.gender = ?';  params.push(gender); }
  if (status) { query += ' AND m.status = ?';  params.push(status); }
  query += ' ORDER BY m.scheduled_time DESC';

  const matches = await dbAll(query, params);
  res.json(parseExtraData(matches));
});

app.get('/api/matches/:id', async (req, res) => {
  const match = await getMatchWithTeams(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  res.json(match);
});

app.post('/api/matches', async (req, res) => {
  const { sport, gender, scheduled_time, team_a_id, team_b_id, venue, status = 'upcoming' } = req.body;
  const result = await dbRun(
    'INSERT INTO matches (sport, gender, scheduled_time, status, team_a_id, team_b_id, venue) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [sport, gender, scheduled_time, status, team_a_id, team_b_id, venue || null]
  );
  const match = await getMatchWithTeams(result.lastID);
  io.emit('matches-updated');
  res.json(match);
});

app.put('/api/matches/:id', async (req, res) => {
  const { id } = req.params;
  const { sport, gender, scheduled_time, team_a_id, team_b_id, venue, status, score_a, score_b, winner_id, extra_data } = req.body;
  await dbRun(
    `UPDATE matches SET sport=?, gender=?, scheduled_time=?, team_a_id=?, team_b_id=?,
     venue=?, status=?, score_a=?, score_b=?, winner_id=?, extra_data=? WHERE id=?`,
    [sport, gender, scheduled_time, team_a_id, team_b_id,
     venue, status, score_a ?? 0, score_b ?? 0,
     winner_id || null, extra_data ? JSON.stringify(extra_data) : null, id]
  );
  const match = await getMatchWithTeams(id);
  io.to(`match-${id}`).emit('match-updated', match);
  io.emit('matches-updated');
  res.json(match);
});

app.delete('/api/matches/:id', async (req, res) => {
  await dbRun('DELETE FROM matches WHERE id = ?', [req.params.id]);
  io.emit('matches-updated');
  res.json({ success: true });
});

// Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  const { gender } = req.query;
  let query = `
    SELECT c.id, c.full_name, c.short_name,
      COUNT(m.id) as matches_played,
      SUM(CASE WHEN m.winner_id = c.id THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN m.status='completed' AND m.winner_id != c.id AND m.score_a = m.score_b THEN 1 ELSE 0 END) as draws,
      SUM(CASE WHEN m.status='completed' AND m.winner_id != c.id AND m.score_a != m.score_b THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN m.winner_id = c.id THEN 3 WHEN m.status='completed' AND m.score_a = m.score_b THEN 1 ELSE 0 END) as total_points,
      SUM(CASE WHEN m.winner_id = c.id THEN m.score_a + m.score_b ELSE 0 END) as total_goals
    FROM colleges c
    LEFT JOIN matches m ON (m.team_a_id = c.id OR m.team_b_id = c.id) AND m.status = 'completed'
  `;
  const params = [];
  if (gender) { query += ' WHERE m.gender = ?'; params.push(gender); }
  query += ' GROUP BY c.id ORDER BY total_points DESC, total_goals DESC, c.short_name ASC';
  res.json(await dbAll(query, params));
});

app.get('/api/leaderboard/overall', async (req, res) => {
  const rows = await dbAll(`
    SELECT c.id, c.full_name, c.short_name,
      COUNT(m.id) as matches_played,
      SUM(CASE WHEN m.winner_id = c.id THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN m.status='completed' AND m.winner_id != c.id AND m.score_a = m.score_b THEN 1 ELSE 0 END) as draws,
      SUM(CASE WHEN m.status='completed' AND m.winner_id != c.id AND m.score_a != m.score_b THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN m.winner_id = c.id THEN 3 WHEN m.status='completed' AND m.score_a = m.score_b THEN 1 ELSE 0 END) as total_points,
      SUM(CASE WHEN m.winner_id = c.id THEN m.score_a + m.score_b ELSE 0 END) as total_goals
    FROM colleges c
    LEFT JOIN matches m ON (m.team_a_id = c.id OR m.team_b_id = c.id) AND m.status = 'completed'
    GROUP BY c.id
    ORDER BY total_points DESC, total_goals DESC, c.short_name ASC
  `);
  res.json(rows);
});

// Score update via REST (used as reliable fallback from admin panel)
app.post('/api/matches/:id/score', async (req, res) => {
  const { id } = req.params;
  const { score_a, score_b } = req.body;
  await dbRun(
    'UPDATE matches SET score_a = ?, score_b = ? WHERE id = ?',
    [score_a, score_b, id]
  );
  const match = await getMatchWithTeams(id);
  // Broadcast to all socket clients watching this match
  io.to(`match-${id}`).emit('score-updated', match);
  io.emit('matches-updated');
  res.json(match);
});

// Status update via REST
app.post('/api/matches/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, winner_id } = req.body;
  await dbRun(
    'UPDATE matches SET status = ?, winner_id = ? WHERE id = ?',
    [status, winner_id || null, id]
  );
  const match = await getMatchWithTeams(id);
  io.to(`match-${id}`).emit('status-updated', match);
  io.emit('matches-updated');
  res.json(match);
});

// Sports list
app.get('/api/sports', (req, res) => {
  res.json([
    { id: 'football',     name: 'Football',     icon: '⚽' },
    { id: 'cricket',      name: 'Cricket',      icon: '🏏' },
    { id: 'basketball',   name: 'Basketball',   icon: '🏀' },
    { id: 'badminton',    name: 'Badminton',    icon: '🏸' },
    { id: 'volleyball',   name: 'Volleyball',   icon: '🏐' },
    { id: 'kho-kho',      name: 'Kho Kho',      icon: '🏃' },
    { id: 'table-tennis', name: 'Table Tennis', icon: '🏓' },
    { id: 'chess',        name: 'Chess',        icon: '♟️' }
  ]);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Start
initDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🏟️  QUADRA 5.0 Server running on port ${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/realadmin`);
    console.log(`🏟️  Public site: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
