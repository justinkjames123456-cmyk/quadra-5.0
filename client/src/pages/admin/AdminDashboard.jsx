import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useSocket } from '../../context/SocketContext'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { adminToken, logoutAdmin } = useSocket()
  const [stats, setStats] = useState({ colleges: 0, matches: 0, live: 0, completed: 0 })
  const [sportsList, setSportsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!adminToken) { navigate('/realadmin'); return }
    fetchStats()
  }, [adminToken, navigate])

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

        {/* Quick Links */}
        <h2 className="text-base sm:text-xl font-bold mb-4 t-text">Quick Links</h2>
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
