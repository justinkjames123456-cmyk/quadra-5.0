import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useSocket } from '../../context/SocketContext'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { adminToken, logoutAdmin } = useSocket()
  const [backupStatus, setBackupStatus] = useState(null)
  const [backupLoading, setBackupLoading] = useState(false)

  useEffect(() => {
    if (!adminToken) { navigate('/realadmin'); return }
    fetchStats()
    fetchBackupStatus()
  }, [adminToken, navigate])

  const fetchBackupStatus = async () => {
    try {
      const res = await axios.get('/api/admin/backup-status', {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      setBackupStatus(res.data)
    } catch (e) { console.error('Backup status error:', e) }
  }

  const handleExport = async () => {
    try {
      setBackupLoading(true)
      const res = await axios.get('/api/admin/export', {
        headers: { Authorization: `Bearer ${adminToken}` },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `quadra-backup-${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('Export failed: ' + e.message)
    } finally {
      setBackupLoading(false)
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setBackupLoading(true)
      const text = await file.text()
      const data = JSON.parse(text)

      await axios.post('/api/admin/import', data, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })

      alert('Data imported successfully!')
      fetchStats()
      fetchBackupStatus()
    } catch (e) {
      alert('Import failed: ' + e.message)
    } finally {
      setBackupLoading(false)
      event.target.value = '' // Reset file input
    }
  }

  const fetchStats = async () => {
    try {
      const [collegesRes, matchesRes, sportsRes] = await Promise.all([
        axios.get('/api/colleges'),
        axios.get('/api/matches'),
        axios.get('/api/sports'),
      ])
      const matches = matchesRes.data
      setStats({
        colleges: collegesRes.data.length,
        matches: matches.length,
        live: matches.filter(m => m.status === 'live').length,
        completed: matches.filter(m => m.status === 'completed').length,
      })
      setSportsList(sportsRes.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (!adminToken) return null

  const STAT_CARDS = [
    { icon: '🏫', val: stats.colleges,  label: 'Colleges',       color: 'var(--accent)'  },
    { icon: '🏟️', val: stats.matches,   label: 'Total Matches',  color: 'var(--accent2)' },
    { icon: '🔴', val: stats.live,      label: 'Live Now',       color: '#ef4444'        },
    { icon: '✅', val: stats.completed, label: 'Completed',      color: '#22c55e'        },
  ]

  const ACTIONS = [
    { to: '/realadmin/colleges',          icon: '🏫', title: 'Manage Colleges', desc: 'Add, edit, or remove colleges' },
    { to: '/realadmin/matches',           icon: '📅', title: 'Manage Matches',  desc: 'Create and schedule matches'  },
    { to: '/realadmin/matches?filter=live', icon: '🔴', title: 'Live Scores',  desc: 'Update live match scores'     },
    { to: '/realadmin/sports',            icon: '🏅', title: 'Manage Sports',  desc: 'Add or remove sport events'   },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Header */}
      <header className="glass sticky top-0 z-40" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src="/logo.png" alt="QUADRA" className="h-9 w-auto object-contain shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold gradient-text truncate">Admin Dashboard</h1>
                <p className="text-xs t-faint hidden sm:block">QUADRA 5.0 Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a href="/" target="_blank" rel="noopener noreferrer"
                className="hidden sm:flex px-3 py-1.5 glass rounded-lg text-xs font-semibold t-muted hover:t-text transition-colors"
                style={{ border: '1px solid var(--border)' }}>
                🌐 Site
              </a>
              <button onClick={() => { logoutAdmin(); navigate('/realadmin') }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-600/10 border border-red-600/40 hover:bg-red-600/20 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="t-card rounded-xl p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl mb-2">{s.icon}</div>
              <p className="text-xl sm:text-2xl font-black" style={{ color: s.color }}>{s.val}</p>
              <p className="text-xs sm:text-sm t-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-base sm:text-xl font-bold mb-4 t-text">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {ACTIONS.map(a => (
            <Link key={a.to} to={a.to}
              className="t-card rounded-xl p-4 sm:p-5 flex items-center gap-3 card-hover">
              <span className="text-3xl shrink-0">{a.icon}</span>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base truncate">{a.title}</h3>
                <p className="text-xs t-muted truncate">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Sports Overview */}
        <h2 className="text-base sm:text-xl font-bold mb-4 t-text">Sports Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {sportsList.map(sport => (
            <Link key={sport.id} to={`/realadmin/matches?sport=${sport.id}`}
              className="t-card rounded-xl p-3 sm:p-4 text-center card-hover">
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{sport.icon}</div>
              <h3 className="font-bold text-xs sm:text-sm">{sport.name}</h3>
            </Link>
          ))}
        </div>

        {/* Data Management */}
        <h2 className="text-base sm:text-xl font-bold mb-4 t-text">Data Management</h2>
        <div className="t-card rounded-xl p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm sm:text-base mb-1">Backup & Restore</h3>
              <p className="text-xs sm:text-sm t-muted mb-2">
                Export all tournament data or import from a backup file. Auto-backup runs on server restart.
              </p>
              {backupStatus && (
                <div className="text-xs t-faint">
                  Current: {backupStatus.current.colleges} colleges, {backupStatus.current.matches} matches
                  {backupStatus.backup && (
                    <span className="ml-2">• Backup: {backupStatus.backup.colleges} colleges, {backupStatus.backup.matches} matches</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                onClick={handleExport}
                disabled={backupLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <span>📤</span>
                {backupLoading ? 'Exporting...' : 'Export Data'}
              </button>
              <label className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2">
                <span>📥</span>
                Import Data
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  disabled={backupLoading}
                />
              </label>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="t-card rounded-xl p-4 flex items-center gap-3 card-hover">
            <span className="text-2xl">🌐</span>
            <div>
              <p className="font-semibold text-sm">View Public Site</p>
              <p className="text-xs t-muted">See what users see</p>
            </div>
          </a>
          <a href="https://instagram.com/quadra.tdmc" target="_blank" rel="noopener noreferrer"
            className="t-card rounded-xl p-4 flex items-center gap-3 card-hover">
            <span className="text-2xl">📸</span>
            <div>
              <p className="font-semibold text-sm">Instagram</p>
              <p className="text-xs t-muted">@quadra.tdmc</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
