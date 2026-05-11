import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import { useSocket } from '../context/SocketContext'

const SPORT_COLORS = [
  'from-green-500 to-emerald-600', 'from-blue-500 to-indigo-600',
  'from-orange-500 to-amber-600',  'from-red-500 to-rose-600',
  'from-yellow-500 to-orange-500', 'from-purple-500 to-violet-600',
  'from-pink-500 to-rose-500',     'from-gray-600 to-gray-800',
  'from-teal-500 to-cyan-600',     'from-lime-500 to-green-600',
]

const statusColors = {
  upcoming:  'bg-blue-600',
  live:      'bg-red-600 animate-pulse',
  completed: 'bg-green-600',
}

// ── Sports Hub (no sportId selected) ──────────────────────
function SportsHub() {
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/sports').then(r => setSports(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 t-muted hover:t-text transition-colors text-sm mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold gradient-text">SPORTS</h1>
          <p className="t-muted mt-1">Select a sport to view matches</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><div className="spinner"></div></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {sports.map((sport, i) => (
              <Link key={sport.id} to={`/sports/${sport.id}`}
                className="t-card rounded-xl p-6 text-center card-hover hover:border-[var(--accent)] transition-all">
                <div className={`text-4xl mb-3 w-16 h-16 rounded-full bg-gradient-to-br ${SPORT_COLORS[i % SPORT_COLORS.length]} flex items-center justify-center mx-auto`}>
                  {sport.icon}
                </div>
                <h3 className="font-bold">{sport.name}</h3>
                {sport.description && <p className="text-xs t-faint mt-1">{sport.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sport Detail (sportId selected) ───────────────────────
function SportDetail({ sportId }) {
  const { socket } = useSocket()
  const [activeTab, setActiveTab] = useState('men')
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [sport, setSport] = useState(null)

  const fetchMatches = async () => {
    try {
      const res = await axios.get(`/api/matches?sport=${sportId}`)
      setMatches(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    setLoading(true)
    axios.get('/api/sports').then(res => {
      setSport(res.data.find(s => s.id === sportId) || null)
    })
    fetchMatches()
  }, [sportId])

  useEffect(() => {
    if (!socket) return
    const onScore = (m) => {
      if (m.sport === sportId) setMatches(prev => prev.map(x => x.id === m.id ? { ...x, ...m } : x))
    }
    const onRefresh = () => fetchMatches()
    socket.on('score-updated', onScore)
    socket.on('matches-updated', onRefresh)
    return () => { socket.off('score-updated', onScore); socket.off('matches-updated', onRefresh) }
  }, [socket, sportId])

  const filteredMatches = matches.filter(m => m.gender === activeTab)

  if (!sport && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🏆</p>
          <h2 className="text-2xl font-bold mb-2">Sport not found</h2>
          <Link to="/sports" className="t-accent hover:underline">← Back to Sports</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Sport header */}
      <div className="py-8 px-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="container mx-auto max-w-5xl">
          <Link to="/sports" className="inline-flex items-center gap-2 t-muted hover:t-text transition-colors text-sm mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            All Sports
          </Link>
          {sport && (
            <div className="flex items-center gap-4">
              <span className="text-5xl">{sport.icon}</span>
              <div>
                <h1 className="text-3xl font-bold">{sport.name}</h1>
                {sport.description && <p className="t-muted text-sm mt-1">{sport.description}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Gender tabs */}
        <div className="flex gap-2 mb-6">
          {['men', 'women'].map(g => (
            <button key={g} onClick={() => setActiveTab(g)}
              className={`px-6 py-2.5 rounded-lg font-bold transition-all text-sm ${
                activeTab === g
                  ? g === 'men' ? 'bg-[var(--accent)] text-black' : 'bg-[var(--accent2)] text-white'
                  : 'glass t-muted hover:t-text'
              }`}>
              {g === 'men' ? '👨 Men' : '👩 Women'}
            </button>
          ))}
        </div>

        {/* Matches */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="spinner"></div></div>
        ) : filteredMatches.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-5xl mb-4">📭</p>
            <h3 className="text-xl font-bold mb-2">No Matches Yet</h3>
            <p className="t-muted">No {activeTab}'s matches scheduled for {sport?.name}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map(match => (
              <Link key={match.id} to={`/match/${match.id}`}
                className="glass rounded-xl p-4 sm:p-5 block hover:border-[var(--accent)] transition-all"
                style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between gap-2">
                  {/* Team A */}
                  <p className="font-bold text-sm flex-1 text-right truncate min-w-0">{match.team_a_name || 'TBD'}</p>
                  {/* Score */}
                  <div className="px-3 py-1.5 rounded-lg text-center shrink-0"
                    style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', minWidth: '72px' }}>
                    {match.status !== 'upcoming' ? (
                      <span className="font-black text-lg">
                        <span style={{ color: 'var(--accent)' }}>{match.score_a}</span>
                        <span className="t-faint mx-0.5">:</span>
                        <span style={{ color: 'var(--accent2)' }}>{match.score_b}</span>
                      </span>
                    ) : (
                      <span className="t-faint font-bold text-sm">VS</span>
                    )}
                  </div>
                  {/* Team B */}
                  <p className="font-bold text-sm flex-1 text-left truncate min-w-0">{match.team_b_name || 'TBD'}</p>
                </div>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <div className="text-xs t-faint">
                    {match.scheduled_time && format(new Date(match.scheduled_time), 'MMM dd, hh:mm a')}
                    {match.venue && <span className="ml-2">📍 {match.venue}</span>}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white shrink-0 ${statusColors[match.status]}`}>
                    {match.status === 'live' ? '🔴 LIVE' : match.status === 'completed' ? '✅ Done' : '📅 Soon'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Sports() {
  const { sportId } = useParams()
  return sportId ? <SportDetail sportId={sportId} /> : <SportsHub />
}
