import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useSocket } from '../../context/SocketContext'

const sportsList = [
  { id: 'football', name: 'Football', icon: '⚽' },
  { id: 'cricket', name: 'Cricket', icon: '🏏' },
  { id: 'basketball', name: 'Basketball', icon: '🏀' },
  { id: 'badminton', name: 'Badminton', icon: '🏸' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
  { id: 'kho-kho', name: 'Kho Kho', icon: '🏃' },
  { id: 'table-tennis', name: 'Table Tennis', icon: '🏓' },
  { id: 'chess', name: 'Chess', icon: '♟️' }
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { adminToken, logoutAdmin } = useSocket()
  const [stats, setStats] = useState({
    colleges: 0,
    matches: 0,
    live: 0,
    completed: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!adminToken) {
      navigate('/realadmin')
      return
    }
    fetchStats()
  }, [adminToken, navigate])

  const fetchStats = async () => {
    try {
      const [collegesRes, matchesRes] = await Promise.all([
        axios.get('/api/colleges'),
        axios.get('/api/matches')
      ])
      
      const matches = matchesRes.data
      setStats({
        colleges: collegesRes.data.length,
        matches: matches.length,
        live: matches.filter(m => m.status === 'live').length,
        completed: matches.filter(m => m.status === 'completed').length
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logoutAdmin()
    navigate('/realadmin')
  }

  if (!adminToken) return null

  return (
    <div className="min-h-screen bg-quadra-dark">
      {/* Admin Header */}
      <header className="glass border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display gradient-text">QUADRA 5.0</h1>
              <p className="text-sm text-gray-400">Admin Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Admin</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600/20 border border-red-600 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-6">
            <div className="text-3xl mb-2">🏫</div>
            <p className="text-2xl font-bold text-quadra-cyan">{stats.colleges}</p>
            <p className="text-sm text-gray-400">Colleges</p>
          </div>
          <div className="glass rounded-xl p-6">
            <div className="text-3xl mb-2">🏟️</div>
            <p className="text-2xl font-bold text-quadra-purple">{stats.matches}</p>
            <p className="text-sm text-gray-400">Total Matches</p>
          </div>
          <div className="glass rounded-xl p-6">
            <div className="text-3xl mb-2">🔴</div>
            <p className="text-2xl font-bold text-red-500">{stats.live}</p>
            <p className="text-sm text-gray-400">Live Now</p>
          </div>
          <div className="glass rounded-xl p-6">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
            <p className="text-sm text-gray-400">Completed</p>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            to="/realadmin/colleges"
            className="glass rounded-xl p-6 card-hover flex items-center space-x-4"
          >
            <div className="text-4xl">🏫</div>
            <div>
              <h3 className="font-bold text-lg">Manage Colleges</h3>
              <p className="text-sm text-gray-400">Add, edit, or remove participating colleges</p>
            </div>
          </Link>

          <Link
            to="/realadmin/matches"
            className="glass rounded-xl p-6 card-hover flex items-center space-x-4"
          >
            <div className="text-4xl">📅</div>
            <div>
              <h3 className="font-bold text-lg">Manage Matches</h3>
              <p className="text-sm text-gray-400">Create and schedule matches</p>
            </div>
          </Link>

          <Link
            to="/realadmin/matches?filter=live"
            className="glass rounded-xl p-6 card-hover flex items-center space-x-4"
          >
            <div className="text-4xl">🔴</div>
            <div>
              <h3 className="font-bold text-lg">Live Scores</h3>
              <p className="text-sm text-gray-400">Update live match scores</p>
            </div>
          </Link>
        </div>

        {/* Sports Overview */}
        <h2 className="text-xl font-bold mb-4">Sports Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sportsList.map(sport => (
            <Link
              key={sport.id}
              to={`/realadmin/matches?sport=${sport.id}`}
              className="glass rounded-xl p-4 text-center card-hover"
            >
              <div className="text-3xl mb-2">{sport.icon}</div>
              <h3 className="font-bold text-sm">{sport.name}</h3>
              <p className="text-xs text-gray-400 mt-1">Manage matches</p>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Quick Links</h2>
          <div className="glass rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 bg-quadra-glass rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-2xl">🌐</span>
                <div>
                  <p className="font-semibold">View Public Site</p>
                  <p className="text-sm text-gray-400">See what users see</p>
                </div>
              </a>
              <a
                href="https://instagram.com/quadra.tdmc"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 bg-quadra-glass rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-2xl">📸</span>
                <div>
                  <p className="font-semibold">Instagram</p>
                  <p className="text-sm text-gray-400">@quadra.tdmc</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}