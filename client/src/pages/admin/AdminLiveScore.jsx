import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useSocket } from '../../context/SocketContext'
import AdminHeader from '../../components/AdminHeader'

const sportIcons = {
  football: '⚽',
  cricket: '🏏',
  basketball: '🏀',
  badminton: '🏸',
  volleyball: '🏐',
  'kho-kho': '🏃',
  'table-tennis': '🏓',
  chess: '♟️'
}

export default function AdminLiveScore() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { adminToken, logoutAdmin, socket } = useSocket()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [extraData, setExtraData] = useState({})
  const [status, setStatus] = useState('upcoming')
  const [winnerId, setWinnerId] = useState(null)

  useEffect(() => {
    if (!adminToken) {
      navigate('/realadmin')
      return
    }
    fetchMatch()

    // Listen for real-time updates
    if (socket) {
      socket.on('score-updated', handleScoreUpdate)
      socket.on('status-updated', handleStatusUpdate)
      socket.on('match-updated', handleMatchUpdate)
    }

    return () => {
      if (socket) {
        socket.off('score-updated', handleScoreUpdate)
        socket.off('status-updated', handleStatusUpdate)
        socket.off('match-updated', handleMatchUpdate)
      }
    }
  }, [adminToken, navigate, socket, id])

  const fetchMatch = async () => {
    try {
      const res = await axios.get(`/api/matches/${id}`)
      const data = res.data
      setMatch(data)
      setScoreA(data.score_a || 0)
      setScoreB(data.score_b || 0)
      setExtraData(data.extra_data || {})
      setStatus(data.status || 'upcoming')
      setWinnerId(data.winner_id)
    } catch (error) {
      console.error('Error fetching match:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreUpdate = (updatedMatch) => {
    setMatch(updatedMatch)
    setScoreA(updatedMatch.score_a)
    setScoreB(updatedMatch.score_b)
  }

  const handleStatusUpdate = (updatedMatch) => {
    setMatch(updatedMatch)
    setStatus(updatedMatch.status)
    setWinnerId(updatedMatch.winner_id)
  }

  const handleMatchUpdate = (updatedMatch) => {
    setMatch(updatedMatch)
  }

  const updateScore = (team, delta) => {
    const newScore = team === 'a' ? scoreA + delta : scoreB + delta
    if (newScore < 0) return

    const newScoreA = team === 'a' ? newScore : scoreA
    const newScoreB = team === 'b' ? newScore : scoreB

    if (team === 'a') setScoreA(newScore)
    else setScoreB(newScore)

    // Use REST endpoint — reliable regardless of socket auth state
    axios.post(`/api/matches/${id}/score`, {
      score_a: newScoreA,
      score_b: newScoreB
    }).catch(err => console.error('Score update failed:', err))
  }

  const updateStatus = (newStatus) => {
    setStatus(newStatus)

    let winner = null
    if (newStatus === 'completed') {
      if (scoreA > scoreB) winner = match.team_a_id
      else if (scoreB > scoreA) winner = match.team_b_id
      setWinnerId(winner)
    }

    axios.post(`/api/matches/${id}/status`, {
      status: newStatus,
      winner_id: winner
    }).catch(err => console.error('Status update failed:', err))
  }

  const handleLogout = () => {
    logoutAdmin()
    navigate('/realadmin')
  }

  if (!adminToken) return null

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="spinner"></div>
    </div>
  )

  if (!match) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Match not found</h2>
        <button onClick={() => navigate('/realadmin/matches')} className="btn-primary">
          Back to Matches
        </button>
      </div>
    </div>
  )

  const sportIcon = sportIcons[match.sport] || '🏆'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <AdminHeader
        title="Live Score Control"
        subtitle="Real-time score management"
        backTo="/realadmin/matches"
        backLabel="Matches"
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Match Info */}
        <div className="glass rounded-xl p-4 sm:p-6 mb-6" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl sm:text-4xl">{sportIcon}</span>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold capitalize">
                {match.sport} — {match.gender === 'men' ? "Men's" : "Women's"}
              </h2>
              {match.venue && <p className="text-sm t-muted">📍 {match.venue}</p>}
            </div>
          </div>

          {/* Status Controls */}
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2 t-muted">Match Status</label>
            <div className="flex flex-wrap gap-2">
              {[
                { val: 'upcoming',  label: '📅 Upcoming', cls: 'bg-blue-600' },
                { val: 'live',      label: '🔴 Live',     cls: 'bg-red-600 animate-pulse' },
                { val: 'completed', label: '✅ Completed', cls: 'bg-green-600' },
              ].map(s => (
                <button key={s.val} onClick={() => updateStatus(s.val)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    status === s.val ? `${s.cls} text-white` : 'glass t-muted hover:t-text'
                  }`}
                  style={status !== s.val ? { border: '1px solid var(--border)' } : {}}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {status === 'completed' && winnerId && (
            <div className="p-4 rounded-xl text-center"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.4)' }}>
              <span className="text-2xl">🏆</span>
              <span className="text-lg font-bold text-green-400 ml-2">
                Winner: {winnerId === match.team_a_id ? match.team_a_name : match.team_b_name}
              </span>
            </div>
          )}
        </div>

        {/* Scoreboard Controls */}
        <div className="glass rounded-xl p-4 sm:p-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
            {/* Team A Controls */}
            <div className="text-center">
              <h3 className="text-xs sm:text-xl font-bold mb-2 truncate px-1">{match.team_a_name || 'Team A'}</h3>
              <div className="flex items-center justify-center gap-1 sm:space-x-4 mb-4">
                <button
                  onClick={() => updateScore('a', -1)}
                  className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-red-600/20 border-2 border-red-600 text-red-400 text-lg sm:text-2xl font-bold hover:bg-red-600/30 transition-colors"
                >
                  -
                </button>
                <div className="score-digit text-4xl sm:text-6xl neon-text-cyan" style={{ color: 'var(--accent)' }}>
                  {scoreA}
                </div>
                <button
                  onClick={() => updateScore('a', 1)}
                  className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-green-600/20 border-2 border-green-600 text-green-400 text-lg sm:text-2xl font-bold hover:bg-green-600/30 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* VS / Divider */}
            <div className="text-center">
              <div className="text-xl sm:text-3xl font-bold" style={{ color: 'var(--text-faint)' }}>:</div>
              {status === 'live' && (
                <div className="mt-2">
                  <span className="text-red-500 font-bold animate-pulse text-xs sm:text-base">LIVE</span>
                </div>
              )}
            </div>

            {/* Team B Controls */}
            <div className="text-center">
              <h3 className="text-xs sm:text-xl font-bold mb-2 truncate px-1">{match.team_b_name || 'Team B'}</h3>
              <div className="flex items-center justify-center gap-1 sm:space-x-4 mb-4">
                <button
                  onClick={() => updateScore('b', -1)}
                  className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-red-600/20 border-2 border-red-600 text-red-400 text-lg sm:text-2xl font-bold hover:bg-red-600/30 transition-colors"
                >
                  -
                </button>
                <div className="score-digit text-4xl sm:text-6xl neon-text-purple" style={{ color: 'var(--accent2)' }}>
                  {scoreB}
                </div>
                <button
                  onClick={() => updateScore('b', 1)}
                  className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-green-600/20 border-2 border-green-600 text-green-400 text-lg sm:text-2xl font-bold hover:bg-green-600/30 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 glass rounded-xl p-4 sm:p-6" style={{ border: '1px solid var(--border)' }}>
          <h3 className="font-bold mb-3 text-sm">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <button onClick={() => updateScore('a', 1)}
              className="px-3 py-2.5 bg-green-600/20 border border-green-600 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors font-semibold text-sm">
              +1 {match.team_a_name?.split(' ')[0] || 'A'}
            </button>
            <button onClick={() => updateScore('b', 1)}
              className="px-3 py-2.5 bg-green-600/20 border border-green-600 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors font-semibold text-sm">
              +1 {match.team_b_name?.split(' ')[0] || 'B'}
            </button>
            <button onClick={() => { setScoreA(0); setScoreB(0); axios.post(`/api/matches/${id}/score`, { score_a: 0, score_b: 0 }).catch(console.error) }}
              className="px-3 py-2.5 bg-yellow-600/20 border border-yellow-600 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-colors font-semibold text-sm">
              Reset
            </button>
            <a href={`/match/${id}`} target="_blank" rel="noopener noreferrer"
              className="px-3 py-2.5 rounded-lg font-semibold text-sm text-center transition-colors"
              style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
              View
            </a>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-3 text-center text-xs t-faint">
          {socket?.connected
            ? <span className="text-green-400">● Connected — updates are live</span>
            : <span className="text-yellow-400">● Connecting…</span>
          }
        </div>
      </div>
    </div>
  )
}