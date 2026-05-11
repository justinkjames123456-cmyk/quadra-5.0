import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import { useSocket } from '../context/SocketContext'

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

export default function MatchDetail() {
  const { id } = useParams()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const { socket, joinMatchRoom } = useSocket()

  // Fetch match data on mount / id change
  useEffect(() => {
    fetchMatch()
  }, [id])

  // Join socket room and listen for live updates
  useEffect(() => {
    if (!socket) return

    // Join the room (joinMatchRoom handles not-yet-connected case)
    joinMatchRoom(id)

    const onScoreUpdated = (updatedMatch) => {
      if (String(updatedMatch.id) === String(id)) setMatch(updatedMatch)
    }
    const onStatusUpdated = (updatedMatch) => {
      if (String(updatedMatch.id) === String(id)) setMatch(updatedMatch)
    }
    const onMatchUpdated = (updatedMatch) => {
      if (String(updatedMatch.id) === String(id)) setMatch(updatedMatch)
    }

    socket.on('score-updated', onScoreUpdated)
    socket.on('status-updated', onStatusUpdated)
    socket.on('match-updated', onMatchUpdated)

    // Re-join room if socket reconnects mid-session
    const onReconnect = () => joinMatchRoom(id)
    socket.on('connect', onReconnect)

    return () => {
      socket.off('score-updated', onScoreUpdated)
      socket.off('status-updated', onStatusUpdated)
      socket.off('match-updated', onMatchUpdated)
      socket.off('connect', onReconnect)
    }
  }, [id, socket, joinMatchRoom])

  const fetchMatch = async () => {
    try {
      const res = await axios.get(`/api/matches/${id}`)
      setMatch(res.data)
    } catch (error) {
      console.error('Error fetching match:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Match not found</h2>
          <Link to="/sports" className="btn-primary">
            Back to Sports
          </Link>
        </div>
      </div>
    )
  }

  const sportIcon = sportIcons[match.sport] || '🏆'
  const statusColor = match.status === 'live' ? 'text-red-500' : match.status === 'completed' ? 'text-green-500' : 'text-blue-500'

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <Link to={`/sports/${match.sport}/${match.gender}`} className="inline-flex items-center text-gray-400 hover:text-white mb-6">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to {match.sport}
        </Link>

        {/* Match Header */}
        <div className="glass rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{sportIcon}</span>
              <div>
                <h1 className="text-2xl font-bold font-display">
                  {match.sport.charAt(0).toUpperCase() + match.sport.slice(1)} - {match.gender === 'men' ? "Men's" : "Women's"}
                </h1>
                <span className={`text-sm font-bold ${statusColor}`}>
                  {match.status === 'live' ? '🔴 LIVE' : match.status === 'completed' ? '✅ COMPLETED' : '📅 UPCOMING'}
                </span>
              </div>
            </div>
            {match.venue && (
              <div className="text-right text-gray-400">
                <p className="text-sm">Venue</p>
                <p className="font-semibold">{match.venue}</p>
              </div>
            )}
          </div>

          {match.scheduled_time && (
            <p className="text-gray-400">
              {format(new Date(match.scheduled_time), 'EEEE, MMMM dd, yyyy • hh:mm a')}
            </p>
          )}
        </div>

        {/* Scoreboard */}
        <div className="glass rounded-xl p-8 mb-6">
          {match.status === 'upcoming' ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🆚</div>
              <h2 className="text-2xl font-bold mb-2">
                {match.team_a_name || 'TBD'} vs {match.team_b_name || 'TBD'}
              </h2>
              <p className="text-gray-400">Match hasn't started yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Team A */}
              <div className="text-center">
                <div className="text-4xl mb-2">{match.winner_id === match.team_a_id ? '🏆' : ''}</div>
                <h3 className="text-xl font-bold mb-2">{match.team_a_name || 'TBD'}</h3>
                <div className="score-digit text-6xl text-quadra-cyan neon-text-cyan">
                  {match.score_a}
                </div>
              </div>

              {/* VS / Live Indicator */}
              <div className="text-center">
                {match.status === 'live' && (
                  <div className="live-indicator">
                    <span className="text-red-500 font-bold text-xl">LIVE</span>
                  </div>
                )}
                <div className="text-2xl font-bold text-gray-500">:</div>
              </div>

              {/* Team B */}
              <div className="text-center">
                <div className="text-4xl mb-2">{match.winner_id === match.team_b_id ? '🏆' : ''}</div>
                <h3 className="text-xl font-bold mb-2">{match.team_b_name || 'TBD'}</h3>
                <div className="score-digit text-6xl text-quadra-purple neon-text-purple">
                  {match.score_b}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Match Details */}
        {match.status === 'completed' && match.winner_id && (
          <div className="glass rounded-xl p-6 mb-6 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-2xl font-bold gradient-text mb-2">WINNER</h2>
            <p className="text-xl font-bold">
              {match.winner_id === match.team_a_id ? match.team_a_name : match.team_b_name}
            </p>
          </div>
        )}

        {/* Extra Data (for sport-specific info) */}
        {match.extra_data && Object.keys(match.extra_data).length > 0 && (
          <div className="glass rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Match Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(match.extra_data).map(([key, value]) => (
                <div key={key} className="bg-quadra-glass rounded-lg p-4">
                  <p className="text-sm text-gray-400 capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="text-lg font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Matches */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Other Matches</h3>
          <Link to={`/sports/${match.sport}/${match.gender}`} className="text-quadra-cyan hover:underline">
            View all {match.sport} matches →
          </Link>
        </div>
      </div>
    </div>
  )
}