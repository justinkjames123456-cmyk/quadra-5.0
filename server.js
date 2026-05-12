const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const Database = require('better-sqlite3')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')
const { Client } = require('pg')
require('dotenv').config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  }
})

const PORT = process.env.PORT || 3001
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!ADMIN_PASSWORD) {
  console.error('❌  ADMIN_PASSWORD is not set in .env — refusing to start')
  process.exit(1)
}

// ── Rate limiter (in-memory, per IP) ────────────────────────
const loginAttempts = new Map()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(ip) {
  const now = Date.now()
  const entry = loginAttempts.get(ip) || { count: 0, resetAt: now + WINDOW_MS }
  if (now > entry.resetAt) {
    entry.count = 0
    entry.resetAt = now + WINDOW_MS
  }
  entry.count++
  loginAttempts.set(ip, entry)
  return entry.count <= MAX_ATTEMPTS
}

function resetRateLimit(ip) {
  loginAttempts.delete(ip)
}

// ── Middleware ───────────────────────────────────────────────
app.use(cors())
app.use(express.json({ limit: '10kb' }))
app.set('trust proxy', 1)

// Static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')))
}

// Database setup
const db = new Database('tournament.db')

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS colleges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL,
    gender TEXT NOT NULL DEFAULT 'men',
    team_a_id INTEGER,
    team_b_id INTEGER,
    team_a_name TEXT,
    team_b_name TEXT,
    score_a INTEGER DEFAULT 0,
    score_b INTEGER DEFAULT 0,
    scheduled_time DATETIME,
    venue TEXT,
    status TEXT DEFAULT 'upcoming',
    winner_id INTEGER,
    extra_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_a_id) REFERENCES colleges(id),
    FOREIGN KEY (team_b_id) REFERENCES colleges(id)
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS sports (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🏆',
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0
  )
`)

// Seed sports if empty
const sportsCount = db.prepare('SELECT COUNT(*) as count FROM sports').get()
if (sportsCount.count === 0) {
  const defaultSports = [
    { id: 'football',     name: 'Football',     icon: '⚽', description: "Men: 11-a-side | Women: 5-a-side (Futsal)", sort_order: 1 },
    { id: 'cricket',      name: 'Cricket',      icon: '🏏', description: 'Standard cricket rules apply',             sort_order: 2 },
    { id: 'basketball',   name: 'Basketball',   icon: '🏀', description: '5v5 standard rules',                       sort_order: 3 },
    { id: 'badminton',    name: 'Badminton',    icon: '🏸', description: 'Singles & Doubles',                        sort_order: 4 },
    { id: 'volleyball',   name: 'Volleyball',   icon: '🏐', description: '6v6 indoor volleyball',                    sort_order: 5 },
    { id: 'kho-kho',      name: 'Kho Kho',      icon: '🏃', description: 'Traditional Indian tag game',              sort_order: 6 },
    { id: 'table-tennis', name: 'Table Tennis', icon: '🏓', description: 'Singles & Doubles',                        sort_order: 7 },
    { id: 'chess',        name: 'Chess',        icon: '♟️', description: 'Mixed teams allowed',                      sort_order: 8 },
  ]
  const ins = db.prepare('INSERT INTO sports (id, name, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)')
  defaultSports.forEach(s => ins.run(s.id, s.name, s.icon, s.description, s.sort_order))
}

// Seed initial colleges if empty
const collegeCount = db.prepare('SELECT COUNT(*) as count FROM colleges').get()
if (collegeCount.count === 0) {
  const colleges = [
    { full_name: 'Government Medical College Alappuzha', short_name: 'GMC Alappuzha' },
    { full_name: 'Amrita Institute of Medical Sciences', short_name: 'Amrita' },
    { full_name: 'Government Medical College Kottayam', short_name: 'GMC Kottayam' },
    { full_name: 'Government Medical College Thiruvananthapuram', short_name: 'GMC TVM' },
    { full_name: 'Kerala Institute of Medical Sciences', short_name: 'KIMS' },
    { full_name: 'Travancore Medical College', short_name: 'TMC' },
    { full_name: 'Sree Gokulam Medical College', short_name: 'SGMC' },
    { full_name: 'Jubilee Mission Medical College', short_name: 'Jubilee' }
  ]
  const insert = db.prepare('INSERT INTO colleges (full_name, short_name) VALUES (?, ?)')
  colleges.forEach(c => insert.run(c.full_name, c.short_name))
  console.log('Seeded initial colleges')
}

// ── Data Backup/Restore System ────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
const SUPABASE_BUCKET = 'quadra-backups'
const useSupabaseBackup = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
const useSupabaseDb = Boolean(SUPABASE_DB_URL)
const supabase = useSupabaseBackup
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null
const supabaseDb = useSupabaseDb
  ? new Client({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
  : null

async function connectSupabaseDb() {
  if (!supabaseDb) return false
  try {
    await supabaseDb.connect()
    await ensureSupabaseDbTables()
    console.log('✅ Supabase Postgres connected')
    return true
  } catch (error) {
    console.error('❌ Supabase Postgres connection failed:', error.message || error)
    return false
  }
}

async function ensureSupabaseDbTables() {
  if (!supabaseDb) return

  await supabaseDb.query(`
    CREATE TABLE IF NOT EXISTS colleges (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await supabaseDb.query(`
    CREATE TABLE IF NOT EXISTS sports (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🏆',
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )
  `)

  await supabaseDb.query(`
    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      sport TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'men',
      team_a_id INTEGER,
      team_b_id INTEGER,
      team_a_name TEXT,
      team_b_name TEXT,
      score_a INTEGER DEFAULT 0,
      score_b INTEGER DEFAULT 0,
      scheduled_time TIMESTAMPTZ,
      venue TEXT,
      status TEXT DEFAULT 'upcoming',
      winner_id INTEGER,
      extra_data TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (team_a_id) REFERENCES colleges(id),
      FOREIGN KEY (team_b_id) REFERENCES colleges(id)
    )
  `)
}

async function restoreFromSupabaseDbIfEmpty() {
  if (!supabaseDb) return false

  const localCollegeCount = db.prepare('SELECT COUNT(*) as count FROM colleges').get().count
  const localMatchCount = db.prepare('SELECT COUNT(*) as count FROM matches').get().count
  const localSportCount = db.prepare('SELECT COUNT(*) as count FROM sports').get().count
  if (localCollegeCount > 0 || localMatchCount > 0 || localSportCount > 0) return false

  try {
    const { rows: sports } = await supabaseDb.query('SELECT * FROM sports ORDER BY sort_order ASC, name ASC')
    const { rows: colleges } = await supabaseDb.query('SELECT * FROM colleges ORDER BY id ASC')
    const { rows: matches } = await supabaseDb.query('SELECT * FROM matches ORDER BY id ASC')

    if (sports.length === 0 && colleges.length === 0 && matches.length === 0) {
      return false
    }

    importData({ colleges, matches, sports })
    console.log('🔄 Restored local data from Supabase Postgres')
    return true
  } catch (error) {
    console.error('❌ Supabase DB restore failed:', error.message || error)
    return false
  }
}

async function syncImportToSupabase(data) {
  if (!supabaseDb) return { success: true, message: 'No Supabase DB configured' }

  try {
    await supabaseDb.query('BEGIN')
    await supabaseDb.query('DELETE FROM matches')
    await supabaseDb.query('DELETE FROM colleges')
    await supabaseDb.query('DELETE FROM sports')

    for (const college of data.colleges) {
      await supabaseDb.query(
        `INSERT INTO colleges (id, full_name, short_name, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, short_name = EXCLUDED.short_name, created_at = EXCLUDED.created_at`,
        [college.id, college.full_name, college.short_name, college.created_at || new Date().toISOString()]
      )
    }

    for (const sport of data.sports) {
      await supabaseDb.query(
        `INSERT INTO sports (id, name, icon, description, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order`,
        [sport.id, sport.name, sport.icon, sport.description, sport.sort_order]
      )
    }

    for (const match of data.matches) {
      await supabaseDb.query(
        `INSERT INTO matches (id, sport, gender, team_a_id, team_b_id, team_a_name, team_b_name,
         score_a, score_b, scheduled_time, venue, status, winner_id, extra_data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id) DO UPDATE SET
           sport = EXCLUDED.sport,
           gender = EXCLUDED.gender,
           team_a_id = EXCLUDED.team_a_id,
           team_b_id = EXCLUDED.team_b_id,
           team_a_name = EXCLUDED.team_a_name,
           team_b_name = EXCLUDED.team_b_name,
           score_a = EXCLUDED.score_a,
           score_b = EXCLUDED.score_b,
           scheduled_time = EXCLUDED.scheduled_time,
           venue = EXCLUDED.venue,
           status = EXCLUDED.status,
           winner_id = EXCLUDED.winner_id,
           extra_data = EXCLUDED.extra_data,
           created_at = EXCLUDED.created_at,
           updated_at = EXCLUDED.updated_at`,
        [match.id, match.sport, match.gender, match.team_a_id, match.team_b_id, match.team_a_name, match.team_b_name,
          match.score_a, match.score_b, match.scheduled_time, match.venue, match.status, match.winner_id,
          match.extra_data, match.created_at || new Date().toISOString(), match.updated_at || new Date().toISOString()]
      )
    }

    await supabaseDb.query(`SELECT setval(pg_get_serial_sequence('colleges','id'), COALESCE(MAX(id), 1), true) FROM colleges`)
    await supabaseDb.query(`SELECT setval(pg_get_serial_sequence('matches','id'), COALESCE(MAX(id), 1), true) FROM matches`)

    await supabaseDb.query('COMMIT')
    return { success: true, message: 'Supabase DB synchronized with local data' }
  } catch (error) {
    await supabaseDb.query('ROLLBACK').catch(() => {})
    console.error('❌ Supabase DB import sync failed:', error.message || error)
    return { success: false, message: error.message || 'Supabase DB sync failed' }
  }
}

async function syncSingleCollegeToSupabase(college) {
  if (!supabaseDb) return { success: true }
  try {
    await supabaseDb.query(
      `INSERT INTO colleges (id, full_name, short_name, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, short_name = EXCLUDED.short_name, created_at = EXCLUDED.created_at`,
      [college.id, college.full_name, college.short_name, college.created_at || new Date().toISOString()]
    )
    return { success: true }
  } catch (error) {
    console.error('❌ Supabase DB college sync failed:', error.message || error)
    return { success: false, message: error.message || 'College sync failed' }
  }
}

async function syncSingleSportToSupabase(sport) {
  if (!supabaseDb) return { success: true }
  try {
    await supabaseDb.query(
      `INSERT INTO sports (id, name, icon, description, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order`,
      [sport.id, sport.name, sport.icon, sport.description, sport.sort_order]
    )
    return { success: true }
  } catch (error) {
    console.error('❌ Supabase DB sport sync failed:', error.message || error)
    return { success: false, message: error.message || 'Sport sync failed' }
  }
}

async function syncSingleMatchToSupabase(match) {
  if (!supabaseDb) return { success: true }
  try {
    await supabaseDb.query(
      `INSERT INTO matches (id, sport, gender, team_a_id, team_b_id, team_a_name, team_b_name,
       score_a, score_b, scheduled_time, venue, status, winner_id, extra_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO UPDATE SET
         sport = EXCLUDED.sport,
         gender = EXCLUDED.gender,
         team_a_id = EXCLUDED.team_a_id,
         team_b_id = EXCLUDED.team_b_id,
         team_a_name = EXCLUDED.team_a_name,
         team_b_name = EXCLUDED.team_b_name,
         score_a = EXCLUDED.score_a,
         score_b = EXCLUDED.score_b,
         scheduled_time = EXCLUDED.scheduled_time,
         venue = EXCLUDED.venue,
         status = EXCLUDED.status,
         winner_id = EXCLUDED.winner_id,
         extra_data = EXCLUDED.extra_data,
         created_at = EXCLUDED.created_at,
         updated_at = EXCLUDED.updated_at`,
      [match.id, match.sport, match.gender, match.team_a_id, match.team_b_id, match.team_a_name, match.team_b_name,
        match.score_a, match.score_b, match.scheduled_time, match.venue, match.status, match.winner_id,
        match.extra_data, match.created_at || new Date().toISOString(), match.updated_at || new Date().toISOString()]
    )
    return { success: true }
  } catch (error) {
    console.error('❌ Supabase DB match sync failed:', error.message || error)
    return { success: false, message: error.message || 'Match sync failed' }
  }
}

async function deleteFromSupabaseTable(table, id) {
  if (!supabaseDb) return { success: true }
  try {
    await supabaseDb.query(`DELETE FROM ${table} WHERE id = $1`, [id])
    return { success: true }
  } catch (error) {
    console.error(`❌ Supabase DB delete from ${table} failed:`, error.message || error)
    return { success: false, message: error.message || 'Delete failed' }
  }
}

function emitSupabaseSyncStatus(payload) {
  io.emit('supabase-sync-status', payload)
}

async function syncLocalDatabaseToSupabase() {
  if (!supabaseDb) return { success: true, message: 'No Supabase DB configured' }
  const data = exportData()
  return syncImportToSupabase(data)
}

async function ensureSupabaseDatabaseMirror() {
  if (!supabaseDb) return

  const localCollegeCount = db.prepare('SELECT COUNT(*) as count FROM colleges').get().count
  const localMatchCount = db.prepare('SELECT COUNT(*) as count FROM matches').get().count
  const localSportCount = db.prepare('SELECT COUNT(*) as count FROM sports').get().count

  if (localCollegeCount === 0 && localMatchCount === 0 && localSportCount === 0) {
    return
  }

  const result = await syncLocalDatabaseToSupabase()
  if (!result.success) {
    console.error('❌ Initial Supabase DB mirror failed:', result.message)
    emitSupabaseSyncStatus({ operation: 'initial-sync', success: false, message: result.message })
  }
}

async function ensureSupabaseBucket() {
  if (!supabase) return

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    if (error) {
      console.error('Supabase bucket list failed:', error.message || error)
      return
    }

    const exists = buckets.some(bucket => bucket.name === SUPABASE_BUCKET)
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket(SUPABASE_BUCKET, { public: false })
      if (createError) {
        console.error('Supabase bucket create failed:', createError.message || createError)
      }
    }
  } catch (error) {
    console.error('Supabase bucket setup failed:', error.message || error)
  }
}

async function backupToSupabase() {
  if (!supabase) return

  try {
    await ensureSupabaseBucket()
    const backupData = exportData()
    const json = JSON.stringify(backupData, null, 2)
    const file = Buffer.from(json, 'utf8')
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload('data-backup.json', file, {
      contentType: 'application/json',
      upsert: true,
    })
    if (error) {
      throw error
    }
    console.log('📦 Supabase backup completed')
  } catch (error) {
    console.error('❌ Supabase backup failed:', error.message || error)
  }
}

function scheduleSupabaseBackup() {
  if (!supabase) return
  backupToSupabase().catch(error => console.error('Scheduled Supabase backup failed:', error.message || error))
}

async function restoreFromSupabaseIfEmpty() {
  if (!supabase) return false

  const collegeCount = db.prepare('SELECT COUNT(*) as count FROM colleges').get().count
  const matchCount = db.prepare('SELECT COUNT(*) as count FROM matches').get().count
  if (collegeCount > 0 || matchCount > 0) return false

  try {
    await ensureSupabaseBucket()
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download('data-backup.json')
    if (error) {
      if (error.status !== 404) {
        console.error('Supabase restore failed:', error.message || error)
      }
      return false
    }
    const body = await data.text()
    const backupData = JSON.parse(body)
    importData(backupData)
    console.log('🔄 Restored from Supabase backup')
    return true
  } catch (error) {
    console.error('❌ Supabase restore failed:', error.message || error)
    return false
  }
}

async function autoRestore() {
  try {
    const restoredFromSupabaseDb = await restoreFromSupabaseDbIfEmpty()
    if (restoredFromSupabaseDb) return

    const restoredFromSupabase = await restoreFromSupabaseIfEmpty()
    if (restoredFromSupabase) return

    const backupPath = path.join(__dirname, 'data-backup.json')
    if (fs.existsSync(backupPath)) {
      const collegeCount = db.prepare('SELECT COUNT(*) as count FROM colleges').get()
      const matchCount = db.prepare('SELECT COUNT(*) as count FROM matches').get()

      if (collegeCount.count === 0 && matchCount.count === 0) {
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
        importData(backupData)
        console.log('🔄 Auto-restored from local backup:', backupPath)
      }
    }
  } catch (error) {
    console.error('❌ Auto-restore failed:', error.message || error)
  }
}

async function autoBackup() {
  try {
    const collegeCount = db.prepare('SELECT COUNT(*) as count FROM colleges').get()
    const matchCount = db.prepare('SELECT COUNT(*) as count FROM matches').get()

    if (collegeCount.count > 0 || matchCount.count > 0) {
      const backupData = exportData()
      const backupPath = path.join(__dirname, 'data-backup.json')
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2))
      console.log('📦 Auto-backup created:', backupPath)
      await backupToSupabase()
    }
  } catch (error) {
    console.error('❌ Auto-backup failed:', error.message || error)
  }
}

// Export all data
function exportData() {
  return {
    timestamp: new Date().toISOString(),
    version: '1.0',
    colleges: db.prepare('SELECT * FROM colleges ORDER BY id').all(),
    matches: db.prepare('SELECT * FROM matches ORDER BY id').all(),
    sports: db.prepare('SELECT * FROM sports ORDER BY sort_order').all()
  }
}

function sqliteSequenceExists() {
  return !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'").get()
}

// Import data (clears existing data first)
function importData(data) {
  const importTransaction = db.transaction((payload) => {
    // Clear existing data
    db.prepare('DELETE FROM matches').run()
    db.prepare('DELETE FROM colleges').run()
    db.prepare('DELETE FROM sports').run()

    // Reset auto-increment counters if sqlite_sequence exists
    if (sqliteSequenceExists()) {
      db.prepare('DELETE FROM sqlite_sequence WHERE name IN ("colleges", "matches", "sports")').run()
    }

    // Import colleges
    if (payload.colleges && payload.colleges.length > 0) {
      const insertCollege = db.prepare('INSERT INTO colleges (id, full_name, short_name, created_at) VALUES (?, ?, ?, ?)')
      payload.colleges.forEach(college => {
        insertCollege.run(college.id, college.full_name, college.short_name, college.created_at || new Date().toISOString())
      })
    }

    // Import sports
    if (payload.sports && payload.sports.length > 0) {
      const insertSport = db.prepare('INSERT INTO sports (id, name, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)')
      payload.sports.forEach(sport => {
        insertSport.run(sport.id, sport.name, sport.icon, sport.description, sport.sort_order)
      })
    }

    // Import matches
    if (payload.matches && payload.matches.length > 0) {
      const insertMatch = db.prepare(`
        INSERT INTO matches (id, sport, gender, team_a_id, team_b_id, team_a_name, team_b_name,
                            score_a, score_b, scheduled_time, venue, status, winner_id, extra_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      payload.matches.forEach(match => {
        insertMatch.run(
          match.id, match.sport, match.gender, match.team_a_id, match.team_b_id,
          match.team_a_name, match.team_b_name, match.score_a, match.score_b,
          match.scheduled_time, match.venue, match.status, match.winner_id,
          match.extra_data, match.created_at || new Date().toISOString(), match.updated_at || new Date().toISOString()
        )
      })
    }
  })

  importTransaction(data)
}

// Initialize backup/restore system
;(async () => {
  try {
    await connectSupabaseDb()
    await autoRestore()
    await ensureSupabaseDatabaseMirror()
    await autoBackup()
  } catch (error) {
    console.error('❌ Backup/restore initialization failed:', error.message || error)
  }
})()

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (token) {
    const session = db.prepare(`SELECT * FROM admin_sessions WHERE token = ? AND (expires_at IS NULL OR expires_at > datetime('now'))`).get(token)
    socket.isAdmin = !!session
  }
  next()
})

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('update-score', async (data) => {
    if (!socket.isAdmin) return

    const { matchId, field, value } = data
    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId)
    if (!match) return

    db.prepare(`UPDATE matches SET ${field} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(value, matchId)

    // Determine winner if match is completed
    let winnerId = match.winner_id
    const updatedMatch = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId)
    if (updatedMatch.status === 'completed') {
      if (updatedMatch.score_a > updatedMatch.score_b) {
        winnerId = updatedMatch.team_a_id
      } else if (updatedMatch.score_b > updatedMatch.score_a) {
        winnerId = updatedMatch.team_b_id
      } else {
        winnerId = null
      }
      if (winnerId !== match.winner_id) {
        db.prepare('UPDATE matches SET winner_id = ? WHERE id = ?').run(winnerId, matchId)
      }
    }

    const finalMatch = db.prepare(`
      SELECT m.*, 
        ca.short_name as team_a_name, cb.short_name as team_b_name
      FROM matches m
      LEFT JOIN colleges ca ON m.team_a_id = ca.id
      LEFT JOIN colleges cb ON m.team_b_id = cb.id
      WHERE m.id = ?
    `).get(matchId)

    await autoBackup()
    io.emit('score-updated', finalMatch)
  })

  socket.on('update-status', async (data) => {
    if (!socket.isAdmin) return

    const { matchId, status, winnerId } = data
    db.prepare('UPDATE matches SET status = ?, winner_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, winnerId, matchId)

    const updatedMatch = db.prepare(`
      SELECT m.*, 
        ca.short_name as team_a_name, cb.short_name as team_b_name
      FROM matches m
      LEFT JOIN colleges ca ON m.team_a_id = ca.id
      LEFT JOIN colleges cb ON m.team_b_id = cb.id
      WHERE m.id = ?
    `).get(matchId)

    await autoBackup()
    io.emit('status-updated', updatedMatch)
    io.emit('matches-updated')
    io.emit('leaderboard-update')
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Admin login — rate limited, constant-time compare
app.post('/api/admin/login', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' })
  }

  const { password } = req.body
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password required' })
  }

  // Constant-time comparison to prevent timing attacks
  const provided = Buffer.from(password)
  const expected = Buffer.from(ADMIN_PASSWORD)
  const match =
    provided.length === expected.length &&
    crypto.timingSafeEqual(provided, expected)

  if (match) {
    resetRateLimit(ip)
    // Cryptographically secure token
    const token = crypto.randomBytes(48).toString('hex')
    // Store with 8-hour expiry
    db.prepare(`INSERT INTO admin_sessions (token, expires_at)
                VALUES (?, datetime('now', '+8 hours'))`).run(token)
    res.json({ token })
  } else {
    res.status(401).json({ error: 'Invalid password' })
  }
})

// Verify admin token
app.get('/api/admin/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '').trim()
  if (!token) return res.status(401).json({ error: 'No token' })

  const session = db.prepare(`SELECT id FROM admin_sessions
    WHERE token = ? AND expires_at > datetime('now')`).get(token)
  if (session) {
    res.json({ valid: true })
  } else {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
})

// Logout admin
app.post('/api/admin/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '').trim()
  if (token) {
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token)
  }
  res.json({ success: true })
})

// Get all colleges
app.get('/api/colleges', (req, res) => {
  const colleges = db.prepare('SELECT * FROM colleges ORDER BY short_name').all()
  res.json(colleges)
})

// Add college (admin)
app.post('/api/colleges', async (req, res) => {
  const { full_name, short_name } = req.body
  if (!full_name || !short_name) {
    return res.status(400).json({ error: 'Full name and short name are required' })
  }
  const result = db.prepare('INSERT INTO colleges (full_name, short_name) VALUES (?, ?)').run(full_name, short_name)
  const college = db.prepare('SELECT * FROM colleges WHERE id = ?').get(result.lastInsertRowid)
  const syncStatus = await syncSingleCollegeToSupabase(college)
  emitSupabaseSyncStatus({ operation: 'add-college', success: syncStatus.success, message: syncStatus.message || 'College synced to Supabase' })
  await autoBackup()
  res.json({ ...college, supabaseSync: syncStatus })
})

// Update college (admin)
app.put('/api/colleges/:id', async (req, res) => {
  const { id } = req.params
  const { full_name, short_name } = req.body
  db.prepare('UPDATE colleges SET full_name = ?, short_name = ? WHERE id = ?').run(full_name, short_name, id)
  const college = db.prepare('SELECT * FROM colleges WHERE id = ?').get(id)
  const syncStatus = await syncSingleCollegeToSupabase(college)
  emitSupabaseSyncStatus({ operation: 'update-college', success: syncStatus.success, message: syncStatus.message || 'College synced to Supabase' })
  await autoBackup()
  res.json({ ...college, supabaseSync: syncStatus })
})

// Delete college (admin)
app.delete('/api/colleges/:id', async (req, res) => {
  const { id } = req.params
  db.prepare('DELETE FROM colleges WHERE id = ?').run(id)
  const syncStatus = await deleteFromSupabaseTable('colleges', id)
  emitSupabaseSyncStatus({ operation: 'delete-college', success: syncStatus.success, message: syncStatus.message || 'College removed from Supabase' })
  await autoBackup()
  res.json({ success: true, supabaseSync: syncStatus })
})

// Get all matches (with optional filters)
app.get('/api/matches', (req, res) => {
  let query = `
    SELECT m.*, 
      ca.short_name as team_a_name, cb.short_name as team_b_name
    FROM matches m
    LEFT JOIN colleges ca ON m.team_a_id = ca.id
    LEFT JOIN colleges cb ON m.team_b_id = cb.id
    WHERE 1=1
  `

  const params = []
  if (req.query.sport) {
    query += ' AND m.sport = ?'
    params.push(req.query.sport)
  }
  if (req.query.status) {
    query += ' AND m.status = ?'
    params.push(req.query.status)
  }
  if (req.query.gender) {
    query += ' AND m.gender = ?'
    params.push(req.query.gender)
  }

  query += ' ORDER BY m.scheduled_time DESC, m.created_at DESC'

  const matches = db.prepare(query).all(...params)
  res.json(matches)
})

// Get single match
app.get('/api/matches/:id', (req, res) => {
  const match = db.prepare(`
    SELECT m.*, 
      ca.short_name as team_a_name, cb.short_name as team_b_name
    FROM matches m
    LEFT JOIN colleges ca ON m.team_a_id = ca.id
    LEFT JOIN colleges cb ON m.team_b_id = cb.id
    WHERE m.id = ?
  `).get(req.params.id)

  if (!match) {
    return res.status(404).json({ error: 'Match not found' })
  }
  res.json(match)
})

// Create match (admin)
app.post('/api/matches', async (req, res) => {
  const { sport, gender, team_a_id, team_b_id, scheduled_time, venue, status } = req.body

  // Get team names
  const teamA = db.prepare('SELECT short_name FROM colleges WHERE id = ?').get(team_a_id)
  const teamB = db.prepare('SELECT short_name FROM colleges WHERE id = ?').get(team_b_id)

  const result = db.prepare(`
    INSERT INTO matches (sport, gender, team_a_id, team_b_id, team_a_name, team_b_name, scheduled_time, venue, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(sport, gender || 'men', team_a_id, team_b_id, teamA?.short_name, teamB?.short_name, scheduled_time, venue, status || 'upcoming')

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(result.lastInsertRowid)
  const syncStatus = await syncSingleMatchToSupabase(match)
  emitSupabaseSyncStatus({ operation: 'add-match', success: syncStatus.success, message: syncStatus.message || 'Match synced to Supabase' })
  await autoBackup()
  io.emit('matches-updated')
  res.json({ ...match, supabaseSync: syncStatus })
})

// Update match (admin)
app.put('/api/matches/:id', async (req, res) => {
  const { id } = req.params
  const { sport, gender, team_a_id, team_b_id, scheduled_time, venue, status } = req.body

  // Get team names if changed
  const teamA = team_a_id ? db.prepare('SELECT short_name FROM colleges WHERE id = ?').get(team_a_id) : null
  const teamB = team_b_id ? db.prepare('SELECT short_name FROM colleges WHERE id = ?').get(team_b_id) : null

  const currentMatch = db.prepare('SELECT * FROM matches WHERE id = ?').get(id)

  db.prepare(`
    UPDATE matches SET 
      sport = ?, gender = ?, team_a_id = ?, team_b_id = ?, 
      team_a_name = ?, team_b_name = ?, scheduled_time = ?, venue = ?, status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    sport || currentMatch.sport,
    gender || currentMatch.gender,
    team_a_id || currentMatch.team_a_id,
    team_b_id || currentMatch.team_b_id,
    teamA?.short_name || currentMatch.team_a_name,
    teamB?.short_name || currentMatch.team_b_name,
    scheduled_time || currentMatch.scheduled_time,
    venue || currentMatch.venue,
    status || currentMatch.status,
    id
  )

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(id)
  const syncStatus = await syncSingleMatchToSupabase(match)
  emitSupabaseSyncStatus({ operation: 'update-match', success: syncStatus.success, message: syncStatus.message || 'Match synced to Supabase' })
  await autoBackup()
  io.emit('matches-updated')
  res.json({ ...match, supabaseSync: syncStatus })
})

// Delete match (admin)
app.delete('/api/matches/:id', async (req, res) => {
  const { id } = req.params
  db.prepare('DELETE FROM matches WHERE id = ?').run(id)
  const syncStatus = await deleteFromSupabaseTable('matches', id)
  emitSupabaseSyncStatus({ operation: 'delete-match', success: syncStatus.success, message: syncStatus.message || 'Match removed from Supabase' })
  await autoBackup()
  io.emit('matches-updated')
  res.json({ success: true, supabaseSync: syncStatus })
})

// Get overall leaderboard
app.get('/api/leaderboard/overall', (req, res) => {
  const colleges = db.prepare('SELECT id, short_name FROM colleges').all()

  const leaderboard = colleges.map(college => {
    // Get all matches for this college
    const matches = db.prepare(`
      SELECT * FROM matches 
      WHERE (team_a_id = ? OR team_b_id = ?) AND status = 'completed'
    `).all(college.id, college.id)

    let wins = 0, draws = 0, losses = 0

    matches.forEach(match => {
      if (match.winner_id === college.id) {
        wins++
      } else if (match.winner_id === null && match.score_a === match.score_b) {
        draws++
      } else {
        losses++
      }
    })

    const total_points = wins * 3 + draws

    return {
      id: college.id,
      short_name: college.short_name,
      played: matches.length,
      wins,
      draws,
      losses,
      total_points
    }
  })

  // Sort by points descending
  leaderboard.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    return b.wins - a.wins
  })

  res.json(leaderboard)
})

// Get sport-wise leaderboard
app.get('/api/leaderboard/sport/:sport', (req, res) => {
  const { sport } = req.params
  const { gender } = req.query
  const colleges = db.prepare('SELECT id, short_name FROM colleges').all()

  const leaderboard = colleges.map(college => {
    let query = `
      SELECT * FROM matches 
      WHERE sport = ? AND (team_a_id = ? OR team_b_id = ?) AND status = 'completed'
    `
    const params = [sport, college.id, college.id]

    if (gender) {
      query += ' AND gender = ?'
      params.push(gender)
    }

    const matches = db.prepare(query).all(...params)

    let wins = 0, draws = 0, losses = 0

    matches.forEach(match => {
      if (match.winner_id === college.id) {
        wins++
      } else if (match.winner_id === null && match.score_a === match.score_b) {
        draws++
      } else {
        losses++
      }
    })

    const total_points = wins * 3 + draws

    return {
      id: college.id,
      short_name: college.short_name,
      played: matches.length,
      wins,
      draws,
      losses,
      total_points
    }
  })

  leaderboard.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    return b.wins - a.wins
  })

  res.json(leaderboard)
})

// Score update via REST (admin panel uses this)
app.post('/api/matches/:id/score', async (req, res) => {
  const { id } = req.params
  const { score_a, score_b } = req.body
  db.prepare('UPDATE matches SET score_a = ?, score_b = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(score_a, score_b, id)
  const match = db.prepare(`
    SELECT m.*, ca.short_name as team_a_name, cb.short_name as team_b_name
    FROM matches m
    LEFT JOIN colleges ca ON m.team_a_id = ca.id
    LEFT JOIN colleges cb ON m.team_b_id = cb.id
    WHERE m.id = ?
  `).get(id)
  const syncStatus = await syncSingleMatchToSupabase(match)
  emitSupabaseSyncStatus({ operation: 'score-update', success: syncStatus.success, message: syncStatus.message || 'Match score synced to Supabase' })
  await autoBackup()
  io.emit('score-updated', match)
  io.emit('matches-updated')
  res.json({ ...match, supabaseSync: syncStatus })
})

// Status update via REST (admin panel uses this)
app.post('/api/matches/:id/status', async (req, res) => {
  const { id } = req.params
  const { status, winner_id } = req.body
  db.prepare('UPDATE matches SET status = ?, winner_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, winner_id || null, id)
  const match = db.prepare(`
    SELECT m.*, ca.short_name as team_a_name, cb.short_name as team_b_name
    FROM matches m
    LEFT JOIN colleges ca ON m.team_a_id = ca.id
    LEFT JOIN colleges cb ON m.team_b_id = cb.id
    WHERE m.id = ?
  `).get(id)
  const syncStatus = await syncSingleMatchToSupabase(match)
  emitSupabaseSyncStatus({ operation: 'status-update', success: syncStatus.success, message: syncStatus.message || 'Match status synced to Supabase' })
  await autoBackup()
  io.emit('status-updated', match)
  io.emit('matches-updated')
  io.emit('leaderboard-update')
  res.json({ ...match, supabaseSync: syncStatus })
})

// Get sports list (from DB)
app.get('/api/sports', (req, res) => {
  const sports = db.prepare('SELECT * FROM sports ORDER BY sort_order ASC, name ASC').all()
  res.json(sports)
})

// Add sport (admin)
app.post('/api/sports', async (req, res) => {
  const { id, name, icon, description } = req.body
  if (!id || !name) return res.status(400).json({ error: 'id and name are required' })
  try {
    const normalizedId = id.toLowerCase().replace(/\s+/g, '-')
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM sports').get().m || 0
    db.prepare('INSERT INTO sports (id, name, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)')
      .run(normalizedId, name, icon || '🏆', description || '', maxOrder + 1)
    const sport = db.prepare('SELECT * FROM sports WHERE id = ?').get(normalizedId)
    const syncStatus = await syncSingleSportToSupabase(sport)
    emitSupabaseSyncStatus({ operation: 'add-sport', success: syncStatus.success, message: syncStatus.message || 'Sport synced to Supabase' })
    await autoBackup()
    res.json({ ...sport, supabaseSync: syncStatus })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Update sport (admin)
app.put('/api/sports/:id', async (req, res) => {
  const { name, icon, description } = req.body
  db.prepare('UPDATE sports SET name = ?, icon = ?, description = ? WHERE id = ?')
    .run(name, icon, description, req.params.id)
  const sport = db.prepare('SELECT * FROM sports WHERE id = ?').get(req.params.id)
  const syncStatus = await syncSingleSportToSupabase(sport)
  emitSupabaseSyncStatus({ operation: 'update-sport', success: syncStatus.success, message: syncStatus.message || 'Sport synced to Supabase' })
  await autoBackup()
  res.json({ ...sport, supabaseSync: syncStatus })
})

// Delete sport (admin)
app.delete('/api/sports/:id', async (req, res) => {
  db.prepare('DELETE FROM sports WHERE id = ?').run(req.params.id)
  const syncStatus = await deleteFromSupabaseTable('sports', req.params.id)
  emitSupabaseSyncStatus({ operation: 'delete-sport', success: syncStatus.success, message: syncStatus.message || 'Sport removed from Supabase' })
  await autoBackup()
  res.json({ success: true, supabaseSync: syncStatus })
})

// ── Data Backup/Restore API Endpoints ──────────────────

// Export all data as JSON
app.get('/api/admin/export', (req, res) => {
  try {
    const data = exportData()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename="quadra-backup.json"')
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Export failed: ' + error.message })
  }
})

// Import data from JSON
app.post('/api/admin/import', async (req, res) => {
  try {
    const data = req.body
    if (!data || !Array.isArray(data.colleges) || !Array.isArray(data.matches) || !Array.isArray(data.sports)) {
      return res.status(400).json({ error: 'Invalid backup data format' })
    }

    importData(data)
    await autoBackup() // Create new backup after import

    // Emit updates to all clients
    io.emit('matches-updated')
    io.emit('leaderboard-update')

    res.json({
      success: true,
      message: `Imported ${data.colleges.length} colleges, ${data.matches.length} matches, ${data.sports.length} sports`
    })
  } catch (error) {
    console.error('Import failed:', error)
    res.status(500).json({ error: 'Import failed: ' + error.message })
  }
})

// Get backup status
app.get('/api/admin/backup-status', (req, res) => {
  try {
    const backupPath = path.join(__dirname, 'data-backup.json')
    const hasBackup = fs.existsSync(backupPath)

    let backupInfo = null
    if (hasBackup) {
      const stats = fs.statSync(backupPath)
      const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
      backupInfo = {
        exists: true,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        colleges: data.colleges?.length || 0,
        matches: data.matches?.length || 0,
        sports: data.sports?.length || 0
      }
    }

    const currentData = {
      colleges: db.prepare('SELECT COUNT(*) as count FROM colleges').get().count,
      matches: db.prepare('SELECT COUNT(*) as count FROM matches').get().count,
      sports: db.prepare('SELECT COUNT(*) as count FROM sports').get().count
    }

    res.json({
      backup: backupInfo,
      current: currentData
    })
  } catch (error) {
    res.status(500).json({ error: 'Status check failed: ' + error.message })
  }
})

// SPA fallback for production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist', 'index.html'))
  })
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏟️  QUADRA 5.0 running on port ${PORT}`)
  console.log(`📊 Admin: http://localhost:${PORT}/realadmin`)
})

// Clean up expired sessions every hour
setInterval(() => {
  db.prepare(`DELETE FROM admin_sessions WHERE expires_at < datetime('now')`).run()
}, 60 * 60 * 1000)
