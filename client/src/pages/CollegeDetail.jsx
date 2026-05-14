import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'

const sportIcons = {
  football: '⚽', cricket: '🏏', basketball: '🏀', badminton: '🏸',
  volleyball: '🏐', 'kho-kho': '🏃', 'table-tennis': '🏓', chess: '♟️',
}

export default function CollegeDetail() {
  const { id } = useParams()
  const [college, setCollege] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      try {
        const [collegesRes, matchesRes] = await Promise.all([
          axios.get('/api/colleges'),
          axios.get('/api/matches'),
        ])
        const found = collegesRes.data.find(c => String(c.id) === String(id))
        setCollege(found || null)
        // Only matches this college participated in
        const myMatches = matchesRes.data.filter(
          m => String(m.team_a_id) === String(id) || String(m.team_b_id) === String(id)
        )
        setMatches(myMatches)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner"></div>
    </div>
  )

  if (!college) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <p className="text-5xl mb-4">🏫</p>
        <h2 className="text-2xl font-bold mb-2">College not found</h2>
        <Link to="/leaderboard" className="t-accent hover:underline">← Back to Leaderboard</Link>
      </div>
    </div>
  )

  // Stats
  const completed = matches.filter(m => m.status === 'completed')
  const wins   = completed.filter(m => String(m.winner_id) === String(id)).length
  const draws  = completed.filter(m => !m.winner_id && m.score_a === m.score_b).length
  const losses = completed.length - wins - draws
  const points = college.manual_points ?? 0

  const filtered = activeFilter === 'all' ? matches
    : matches.filter(m => m.status === activeFilter)

  const getResult = (match) => {
    if (match.status !== 'completed') return null
    if (String(match.winner_id) === String(id)) return 'win'
    if (!match.winner_id) return 'draw'
    return 'loss'
  }

  const isTeamA = (match) => String(match.team_a_id) === String(id)

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">

        {/* Back */}
        <Link to="/leaderboard" className="inline-flex items-center gap-2 t-muted hover:t-text transition-colors text-sm mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to Leaderboard
        </Link>

        {/* College header */}
        <div className="glass rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-1">{college.short_name}</h1>
              <p className="t-muted">{college.full_name}</p>
            </div>
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-3 mt-4 md:mt-0">
              <div className="text-center px-5 py-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{points}</p>
                <p className="text-xs t-muted">Points</p>
              </div>
              <div className="text-center px-5 py-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-2xl font-bold text-green-400">{wins}</p>
                <p className="text-xs t-muted">Wins</p>
              </div>
              <div className="text-center px-5 py-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-2xl font-bold text-yellow-400">{draws}</p>
                <p className="text-xs t-muted">Draws</p>
              </div>
              <div className="text-center px-5 py-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-2xl font-bold text-red-400">{losses}</p>
                <p className="text-xs t-muted">Losses</p>
              </div>
              <div className="text-center px-5 py-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-2xl font-bold t-text">{completed.length}</p>
                <p className="text-xs t-muted">Played</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { key: 'all',       label: 'All Matches' },
            { key: 'live',      label: '🔴 Live' },
            { key: 'upcoming',  label: '📅 Upcoming' },
            { key: 'completed', label: '✅ Completed' },
          ].map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeFilter === f.key
                  ? 'text-black'
                  : 'glass t-muted hover:t-text'
              }`}
              style={activeFilter === f.key ? { background: 'var(--accent)' } : {}}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Matches */}
        {filtered.length === 0 ? (
          <div className="glass rounded-xl p-10 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="t-muted">No matches in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(match => {
              const result = getResult(match)
              const teamA = isTeamA(match)
              const myScore    = teamA ? match.score_a : match.score_b
              const theirScore = teamA ? match.score_b : match.score_a
              const opponent   = teamA ? match.team_b_name : match.team_a_name

              const resultStyle = result === 'win'
                ? { border: '1px solid rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.05)' }
                : result === 'loss'
                ? { border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.05)' }
                : result === 'draw'
                ? { border: '1px solid rgba(234,179,8,0.4)', background: 'rgba(234,179,8,0.05)' }
                : { border: '1px solid var(--border)' }

              return (
                <Link key={match.id} to={`/match/${match.id}`}
                  className="block rounded-xl p-5 transition-all hover:scale-[1.01]"
                  style={resultStyle}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Sport + opponent */}
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-3xl">{sportIcons[match.sport] || '🏆'}</span>
                      <div>
                        <p className="font-bold capitalize">{match.sport}
                          <span className="t-faint text-xs ml-2 capitalize">({match.gender})</span>
                        </p>
                        <p className="text-sm t-muted">vs <span className="font-semibold t-text">{opponent || 'TBD'}</span></p>
                        {match.venue && <p className="text-xs t-faint">{match.venue}</p>}
                      </div>
                    </div>

                    {/* Score */}
                    {match.status !== 'upcoming' && (
                      <div className="text-center px-4">
                        <p className="text-2xl font-bold">
                          <span style={{ color: 'var(--accent)' }}>{myScore}</span>
                          <span className="t-faint mx-1">:</span>
                          <span style={{ color: 'var(--accent2)' }}>{theirScore}</span>
                        </p>
                        <p className="text-xs t-faint">Score</p>
                      </div>
                    )}

                    {/* Result badge + date */}
                    <div className="flex items-center gap-3 md:flex-col md:items-end">
                      {result && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                          result === 'win' ? 'bg-green-600' :
                          result === 'loss' ? 'bg-red-600' : 'bg-yellow-600'
                        }`}>
                          {result === 'win' ? '🏆 WIN' : result === 'loss' ? '❌ LOSS' : '🤝 DRAW'}
                        </span>
                      )}
                      {match.status === 'live' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-red-600 animate-pulse">🔴 LIVE</span>
                      )}
                      {match.status === 'upcoming' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-blue-600">📅 UPCOMING</span>
                      )}
                      {match.scheduled_time && (
                        <p className="text-xs t-faint">{format(new Date(match.scheduled_time), 'MMM dd, hh:mm a')}</p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
