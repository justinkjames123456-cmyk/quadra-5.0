import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import { useSocket } from '../context/SocketContext'

const sportIcons = {
  football: '⚽', cricket: '🏏', basketball: '🏀', badminton: '🏸',
  volleyball: '🏐', 'kho-kho': '🏃', 'table-tennis': '🏓', chess: '♟️',
}

export default function MatchDetail() {
  const { id } = useParams()
  const { socket } = useSocket()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMatch = async () => {
    try {
      const res = await axios.get(`/api/matches/${id}`)
      setMatch(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMatch() }, [id])

  useEffect(() => {
    if (!socket) return
    const onScore  = (m) => { if (m.id === parseInt(id)) setMatch(m) }
    const onStatus = (m) => { if (m.id === parseInt(id)) setMatch(m) }
    socket.on('score-updated',  onScore)
    socket.on('status-updated', onStatus)
    return () => { socket.off('score-updated', onScore); socket.off('status-updated', onStatus) }
  }, [socket, id])

  if (loading) return (
    <div className="min-h-screen t-bg flex items-center justify-center">
      <div className="spinner" />
    </div>
  )

  if (!match) return (
    <div className="min-h-screen t-bg flex items-center justify-center text-center px-4">
      <div>
        <p className="text-5xl mb-4">🏆</p>
        <h2 className="text-2xl font-bold mb-4">Match not found</h2>
        <Link to="/" className="t-accent hover:underline">← Back to Home</Link>
      </div>
    </div>
  )

  const sportIcon = sportIcons[match.sport] || '🏆'
  const isLive = match.status === 'live'

  return (
    <div className="min-h-screen t-bg">

      {/* ── Scoreboard ── */}
      <div className="container mx-auto max-w-4xl px-4 py-8">

        {/* Back */}
        <Link to={`/sports/${match.sport}`}
          className="inline-flex items-center gap-2 t-muted hover:t-text transition-colors text-sm mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to {match.sport}
        </Link>

        {/* Main card */}
        <div className="t-card rounded-2xl p-6 md:p-10 mb-6">
          {/* Sport + status row */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{sportIcon}</span>
              <div>
                <h2 className="text-xl font-bold capitalize">{match.sport}</h2>
                <p className="text-sm t-muted capitalize">{match.gender}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
              isLive ? 'bg-red-600 animate-pulse' :
              match.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
            }`}>
              {isLive ? '🔴 LIVE' : match.status === 'completed' ? '✅ COMPLETED' : '📅 UPCOMING'}
            </span>
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-12 mb-8">
            <div className="flex-1 text-center min-w-0">
              <h3 className="text-base sm:text-xl md:text-3xl font-bold mb-2 sm:mb-3 break-words px-1">{match.team_a_name || 'Team A'}</h3>
              <div className="text-5xl sm:text-6xl md:text-8xl font-black score-digit neon-text-blue"
                style={{ color: 'var(--accent)' }}>
                {match.score_a}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl md:text-5xl font-black t-faint shrink-0">:</div>
            <div className="flex-1 text-center min-w-0">
              <h3 className="text-base sm:text-xl md:text-3xl font-bold mb-2 sm:mb-3 break-words px-1">{match.team_b_name || 'Team B'}</h3>
              <div className="text-5xl sm:text-6xl md:text-8xl font-black score-digit neon-text-purple"
                style={{ color: 'var(--accent2)' }}>
                {match.score_b}
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap justify-center gap-4 text-sm t-muted">
            {match.scheduled_time && (
              <span className="flex items-center gap-1">
                🕐 {format(new Date(match.scheduled_time), 'MMM dd, yyyy • hh:mm a')}
              </span>
            )}
            {match.venue && <span>📍 {match.venue}</span>}
          </div>

          {/* Winner */}
          {match.status === 'completed' && match.winner_id && (
            <div className="mt-8 p-5 rounded-xl text-center"
              style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}>
              <p className="text-3xl mb-1">🏆</p>
              <p className="text-sm t-muted mb-1">Winner</p>
              <p className="text-2xl font-black text-yellow-400">
                {match.winner_id === match.team_a_id ? match.team_a_name : match.team_b_name}
              </p>
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="t-card rounded-xl p-5">
            <h3 className="font-bold mb-4" style={{ color: 'var(--accent)' }}>Match Details</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Sport',    match.sport],
                ['Category', match.gender],
                ['Status',   match.status],
                match.venue ? ['Venue', match.venue] : null,
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="t-muted">{k}</span>
                  <span className="font-semibold capitalize">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="t-card rounded-xl p-5">
            <h3 className="font-bold mb-4" style={{ color: 'var(--accent2)' }}>Quick Links</h3>
            <div className="space-y-2">
              {[
                { to: `/sports/${match.sport}`, label: `All ${match.sport} matches`, color: 'var(--accent)' },
                { to: '/leaderboard',           label: 'View leaderboard',           color: 'var(--accent2)' },
                { to: '/',                      label: 'Back to home',               color: 'var(--accent3)' },
              ].map(l => (
                <Link key={l.to} to={l.to}
                  className="flex items-center gap-2 p-3 rounded-lg transition-colors t-muted hover:t-text"
                  style={{ background: 'var(--bg-section)' }}>
                  <span style={{ color: l.color }}>→</span> {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center py-6 t-faint text-xs"
          style={{ borderTop: '1px solid var(--border)' }}>
          QUADRA 5.0 • May 15–17, 2026 • Government Medical College Alappuzha
        </div>
      </div>
    </div>
  )
}
