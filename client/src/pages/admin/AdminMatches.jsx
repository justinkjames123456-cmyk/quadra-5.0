import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import { useSocket } from '../../context/SocketContext'
import AdminHeader from '../../components/AdminHeader'

const statusOptions = [
  { value: 'upcoming', label: 'Upcoming', color: 'bg-blue-600' },
  { value: 'live', label: 'Live', color: 'bg-red-600' },
  { value: 'completed', label: 'Completed', color: 'bg-green-600' }
]

export default function AdminMatches() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { adminToken, logoutAdmin, socket } = useSocket()
  const [colleges, setColleges] = useState([])
  const [matches, setMatches] = useState([])
  const [sportsList, setSportsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMatch, setEditingMatch] = useState(null)
  const [formData, setFormData] = useState({
    sport: '',
    gender: 'men',
    team_a_id: '',
    team_b_id: '',
    scheduled_time: '',
    venue: '',
    status: 'upcoming'
  })
  const [filterSport, setFilterSport] = useState(searchParams.get('sport') || '')
  const [filterStatus, setFilterStatus] = useState(searchParams.get('filter') || '')

  useEffect(() => {
    if (!adminToken) {
      navigate('/realadmin')
      return
    }
    fetchData()
  }, [adminToken, navigate])

  useEffect(() => {
    if (socket) {
      socket.on('matches-updated', fetchData)
      return () => socket.off('matches-updated', fetchData)
    }
  }, [socket])

  const fetchData = async () => {
    try {
      const [collegesRes, matchesRes, sportsRes] = await Promise.all([
        axios.get('/api/colleges'),
        axios.get('/api/matches'),
        axios.get('/api/sports'),
      ])
      setColleges(collegesRes.data)
      setMatches(matchesRes.data)
      setSportsList(sportsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.sport || !formData.team_a_id || !formData.team_b_id) {
      alert('Please fill all required fields')
      return
    }

    try {
      const matchData = {
        ...formData,
        team_a_id: parseInt(formData.team_a_id),
        team_b_id: parseInt(formData.team_b_id)
      }

      if (editingMatch) {
        await axios.put(`/api/matches/${editingMatch.id}`, matchData)
      } else {
        await axios.post('/api/matches', matchData)
      }
      fetchData()
      setShowForm(false)
      setEditingMatch(null)
      resetForm()
    } catch (error) {
      console.error('Error saving match:', error)
      alert('Error saving match')
    }
  }

  const handleEdit = (match) => {
    setEditingMatch(match)
    setFormData({
      sport: match.sport,
      gender: match.gender,
      team_a_id: match.team_a_id?.toString() || '',
      team_b_id: match.team_b_id?.toString() || '',
      scheduled_time: match.scheduled_time ? format(new Date(match.scheduled_time), "yyyy-MM-dd'T'HH:mm") : '',
      venue: match.venue || '',
      status: match.status
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return

    try {
      await axios.delete(`/api/matches/${id}`)
      fetchData()
    } catch (error) {
      console.error('Error deleting match:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      sport: '',
      gender: 'men',
      team_a_id: '',
      team_b_id: '',
      scheduled_time: '',
      venue: '',
      status: 'upcoming'
    })
  }

  const handleLogout = () => {
    logoutAdmin()
    navigate('/realadmin')
  }

  const filteredMatches = matches.filter(match => {
    if (filterSport && match.sport !== filterSport) return false
    if (filterStatus && match.status !== filterStatus) return false
    return true
  })

  if (!adminToken) return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <AdminHeader
        title="Manage Matches"
        subtitle="Create, edit, and manage tournament matches"
        backTo="/realadmin/dashboard"
        backLabel="Dashboard"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="glass rounded-xl p-3 sm:p-4 mb-6" style={{ border: '1px solid var(--border)' }}>
          <div className="flex flex-wrap gap-3">
            <select value={filterSport} onChange={e => setFilterSport(e.target.value)}
              className="input-field w-auto flex-1 min-w-[120px]">
              <option value="">All Sports</option>
              {sportsList.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="input-field w-auto flex-1 min-w-[120px]">
              <option value="">All Status</option>
              {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => { setShowForm(true); resetForm(); setEditingMatch(null) }}
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2 ml-auto">
              <span>+</span><span>Add Match</span>
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="glass rounded-xl p-6 w-full max-w-lg my-8">
              <h2 className="text-xl font-bold mb-4">
                {editingMatch ? 'Edit Match' : 'Add New Match'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">Sport *</label>
                    <select
                      value={formData.sport}
                      onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                      className="w-full px-4 py-3 bg-quadra-glass border border-gray-700 rounded-lg text-white focus:outline-none focus:border-quadra-cyan"
                      required
                    >
                      <option value="">Select Sport</option>
                      {sportsList.map(sport => (
                        <option key={sport.id} value={sport.id}>{sport.icon} {sport.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">Gender *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 bg-quadra-glass border border-gray-700 rounded-lg text-white focus:outline-none focus:border-quadra-cyan"
                    >
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">Team A *</label>
                    <select
                      value={formData.team_a_id}
                      onChange={(e) => setFormData({ ...formData, team_a_id: e.target.value })}
                      className="w-full px-4 py-3 bg-quadra-glass border border-gray-700 rounded-lg text-white focus:outline-none focus:border-quadra-cyan"
                      required
                    >
                      <option value="">Select Team</option>
                      {colleges.map(college => (
                        <option key={college.id} value={college.id}>{college.short_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">Team B *</label>
                    <select
                      value={formData.team_b_id}
                      onChange={(e) => setFormData({ ...formData, team_b_id: e.target.value })}
                      className="w-full px-4 py-3 bg-quadra-glass border border-gray-700 rounded-lg text-white focus:outline-none focus:border-quadra-cyan"
                      required
                    >
                      <option value="">Select Team</option>
                      {colleges.map(college => (
                        <option key={college.id} value={college.id}>{college.short_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.scheduled_time}
                      onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                      className="w-full px-4 py-3 bg-quadra-glass border border-gray-700 rounded-lg text-white focus:outline-none focus:border-quadra-cyan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 bg-quadra-glass border border-gray-700 rounded-lg text-white focus:outline-none focus:border-quadra-cyan"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-4 py-3 bg-quadra-glass border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quadra-cyan"
                    placeholder="e.g., Main Stadium"
                  />
                </div>

                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary flex-1">
                    {editingMatch ? 'Update' : 'Create'} Match
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingMatch(null)
                      resetForm()
                    }}
                    className="px-4 py-3 glass border border-gray-600 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Matches List */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner"></div></div>
        ) : (
          <div className="glass rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead style={{ background: 'var(--bg-section)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold t-muted">Sport</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold t-muted">Match</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold t-muted">Score</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold t-muted">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold t-muted hidden md:table-cell">Time</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold t-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map(match => {
                    const sport = sportsList.find(s => s.id === match.sport)
                    const status = statusOptions.find(s => s.value === match.status)
                    return (
                      <tr key={match.id} className="transition-colors"
                        style={{ borderTop: '1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{sport?.icon}</span>
                            <div>
                              <p className="font-semibold text-xs">{sport?.name}</p>
                              <p className="text-xs t-faint capitalize">{match.gender}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-xs">{match.team_a_name || 'TBD'}</p>
                          <p className="text-xs t-faint">vs</p>
                          <p className="font-semibold text-xs">{match.team_b_name || 'TBD'}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {match.status !== 'upcoming' ? (
                            <span className="font-bold text-sm">
                              <span style={{ color: 'var(--accent)' }}>{match.score_a}</span>
                              <span className="t-faint mx-1">-</span>
                              <span style={{ color: 'var(--accent2)' }}>{match.score_b}</span>
                            </span>
                          ) : <span className="t-faint text-xs">-</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${status?.color}`}>
                            {status?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs t-muted hidden md:table-cell">
                          {match.scheduled_time ? format(new Date(match.scheduled_time), 'MMM dd, hh:mm a') : '-'}
                          {match.venue && <p className="text-xs t-faint">{match.venue}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            {match.status === 'live' && (
                              <button onClick={() => navigate(`/realadmin/live/${match.id}`)}
                                className="px-2 py-1 bg-red-600/20 border border-red-600 text-red-400 rounded text-xs hover:bg-red-600/30 transition-colors animate-pulse">
                                🔴
                              </button>
                            )}
                            <button onClick={() => handleEdit(match)}
                              className="px-2 py-1 bg-blue-600/20 border border-blue-600 text-blue-400 rounded text-xs hover:bg-blue-600/30 transition-colors">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(match.id)}
                              className="px-2 py-1 bg-red-600/20 border border-red-600 text-red-400 rounded text-xs hover:bg-red-600/30 transition-colors">
                              Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredMatches.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center t-muted text-sm">
                        No matches found. Click "Add Match" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
