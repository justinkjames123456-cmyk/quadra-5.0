import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useSocket } from '../../context/SocketContext'

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

  if (loading) {
    return (
      <div className="min-h-screen bg-quadra-dark flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-quadra-dark flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Match not found</h2>
          <button
            onClick={() => navigate('/realadmin/matches')}
            className="btn-primary"
          >
            Back to Matches
          </button>
        </div>
      </div>
    )
  }

  const sportIcon = sportIcons[match.sport] || '🏆'

  return (
    <div className="min-h-screen bg-quadra-dark">
      {/* Header */}
      <header className="glass border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display gradient-text">Live Score Control</h1>
              <p className="text-sm text-gray-400">Real-time score management</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/realadmin/matches')}
                className="px-4 py-2 glass border border-gray-600 text-gray-300 rounded-lg hover:bg-white/5 transition-colors text-sm font-semibold"
              >
                Back to Matches
              </button>
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Match Info */}
        <div className="glass rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-4xl">{sportIcon}</span>
            <div>
              <h2 className="text-2xl font-bold">
                {match.sport.charAt(0).toUpperCase() + match.sport.slice(1)} - {match.gender === 'men' ? "Men's" : "Women's"}
              </h2>
              <p className="text-gray-400">
                {match.venue && `Venue: ${match.venue}`}
              </p>
            </div>
          </div>

          {/* Status Controls */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-gray-300">Match Status</label>
            <div className="flex gap-3">
              <button
                onClick={() => updateStatus('upcoming')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  status === 'upcoming'
                    ? 'bg-blue-600 text-white'
                    : 'glass text-gray-300 hover:bg-white/5'
                }`}
              >
                📅 Upcoming
              </button>
              <button
                onClick={() => updateStatus('live')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  status === 'live'
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'glass text-gray-300 hover:bg-white/5'
                }`}
              >
                🔴 Live
              </button>
              <button
                onClick={() => updateStatus('completed')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  status === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'glass text-gray-300 hover:bg-white/5'
                }`}
              >
                ✅ Completed
              </button>
            </div>
          </div>

          {/* Winner Display */}
          {status === 'completed' && winnerId && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 text-center">
              <span className="text-2xl">🏆</span>
              <span className="text-xl font-bold text-green-400 ml-2">
                Winner: {winnerId === match.team_a_id ? match.team_a_name : match.team_b_name}
              </span>
            </div>
          )}
        </div>

        {/* Scoreboard Controls */}
        <div className="glass rounded-xl p-8">
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Team A Controls */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">{match.team_a_name || 'Team A'}</h3>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() => updateScore('a', -1)}
                  className="w-12 h-12 rounded-full bg-red-600/20 border-2 border-red-600 text-red-400 text-2xl font-bold hover:bg-red-600/30 transition-colors"
                >
                  -
                </button>
                <div className="score-digit text-6xl text-quadra-cyan neon-text-cyan">
                  {scoreA}
                </div>
                <button
                  onClick={() => updateScore('a', 1)}
                  className="w-12 h-12 rounded-full bg-green-600/20 border-2 border-green-600 text-green-400 text-2xl font-bold hover:bg-green-600/30 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* VS / Divider */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-500">:</div>
              {status === 'live' && (
                <div className="mt-2">
                  <span className="text-red-500 font-bold animate-pulse">LIVE</span>
                </div>
              )}
            </div>

            {/* Team B Controls */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">{match.team_b_name || 'Team B'}</h3>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() => updateScore('b', -1)}
                  className="w-12 h-12 rounded-full bg-red-600/20 border-2 border-red-600 text-red-400 text-2xl font-bold hover:bg-red-600/30 transition-colors"
                >
                  -
                </button>
                <div className="score-digit text-6xl text-quadra-purple neon-text-purple">
                  {scoreB}
                </div>
                <button
                  onClick={() => updateScore('b', 1)}
                  className="w-12 h-12 rounded-full bg-green-600/20 border-2 border-green-600 text-green-400 text-2xl font-bold hover:bg-green-600/30 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 glass rounded-xl p-6">
          <h3 className="font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => {
                updateScore('a', 1)
              }}
              className="px-4 py-3 bg-green-600/20 border border-green-600 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors font-semibold"
            >
              +1 Team A
            </button>
            <button
              onClick={() => {
                updateScore('b', 1)
              }}
              className="px-4 py-3 bg-green-600/20 border border-green-600 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors font-semibold"
            >
              +1 Team B
            </button>
            <button
              onClick={() => {
                setScoreA(0)
                setScoreB(0)
                axios.post(`/api/matches/${id}/score`, { score_a: 0, score_b: 0 })
                  .catch(err => console.error('Reset failed:', err))
              }}
              className="px-4 py-3 bg-yellow-600/20 border border-yellow-600 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-colors font-semibold"
            >
              Reset Scores
            </button>
            <a
              href={`/match/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-quadra-cyan/20 border border-quadra-cyan text-quadra-cyan rounded-lg hover:bg-quadra-cyan/30 transition-colors font-semibold text-center"
            >
              View Public Page
            </a>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-4 text-center text-sm text-gray-500">
          {socket?.connected ? (
            <span className="text-green-400">● Connected - Updates are live</span>
          ) : (
            <span className="text-yellow-400">● Connecting...</span>
          )}
        </div>
      </div>
    </div>
  )
}