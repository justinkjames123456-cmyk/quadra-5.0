import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useSocket } from '../context/SocketContext'
import { useTheme } from '../context/ThemeContext'

const SPORT_COLORS = [
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-yellow-400 to-orange-500',
  'from-indigo-500 to-blue-700',
  'from-fuchsia-500 to-pink-600',
  'from-lime-500 to-green-600',
  'from-sky-500 to-cyan-600',
]

export default function Home() {
  const heroRef  = useRef(null)
  const vantaRef = useRef(null)
  const { dark } = useTheme()

  const [sports,      setSports]      = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [liveMatches, setLiveMatches] = useState([])
  const [loading,     setLoading]     = useState(true)
  const { socket } = useSocket()

  /* ── Vanta NET (runs in both modes, bg matches theme) ── */
  useEffect(() => {
    const init = () => {
      if (!window.VANTA || !window.THREE || !heroRef.current || vantaRef.current) return
      vantaRef.current = window.VANTA.NET({
        el: heroRef.current,
        THREE: window.THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200, minWidth: 200,
        scale: 1.0, scaleMobile: 1.0,
        color: dark ? 0x00e5ff : 0x38bdf8,
        backgroundColor: dark ? 0x05050f : 0x0f1729,
        points: 14, maxDistance: 22, spacing: 18,
      })
    }
    init()
    const t = setTimeout(init, 600)
    return () => {
      clearTimeout(t)
      if (vantaRef.current) { vantaRef.current.destroy(); vantaRef.current = null }
    }
  }, [dark])

  /* ── Data ── */
  const fetchData = async () => {
    try {
      const [lb, live, sp] = await Promise.all([
        axios.get('/api/leaderboard/overall'),
        axios.get('/api/matches?status=live'),
        axios.get('/api/sports'),
      ])
      setLeaderboard(lb.data.slice(0, 5))
      setLiveMatches(live.data)
      setSports(sp.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (!socket) return
    const onScore    = (m) => setLiveMatches(p => p.map(x => x.id === m.id ? { ...x, ...m } : x))
    const onRefresh  = () => fetchData()
    const onLb       = async () => { try { const r = await axios.get('/api/leaderboard/overall'); setLeaderboard(r.data.slice(0,5)) } catch {} }
    socket.on('score-updated',    onScore)
    socket.on('status-updated',   onRefresh)
    socket.on('matches-updated',  onRefresh)
    socket.on('leaderboard-update', onLb)
    return () => {
      socket.off('score-updated',    onScore)
      socket.off('status-updated',   onRefresh)
      socket.off('matches-updated',  onRefresh)
      socket.off('leaderboard-update', onLb)
    }
  }, [socket])

  return (
    <div className="min-h-screen">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: '100svh' }}
      >
        {/* overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'var(--hero-overlay)' }} />

        <div className="relative z-10 text-center w-full px-4 max-w-2xl mx-auto py-24">
          {/* Logo */}
          <div className="mb-6">
            <img src="/logo.png" alt="QUADRA 5.0"
              className="mx-auto object-contain w-auto"
              style={{
                height: 'clamp(110px, 28vw, 280px)',
                filter: 'drop-shadow(0 0 40px color-mix(in srgb, var(--accent) 60%, transparent))',
              }}
            />
          </div>

          {/* Tag line */}
          <p className="text-xs sm:text-base font-semibold tracking-[0.2em] uppercase mb-1"
            style={{ color: 'var(--text-muted)' }}>
            Intercollegiate Sports Tournament
          </p>
          <p className="text-xs sm:text-sm mb-1" style={{ color: 'var(--text-faint)' }}>
            Government Medical College Alappuzha
          </p>
          <p className="text-xs sm:text-sm font-bold tracking-[0.25em] mb-8"
            style={{ color: 'var(--accent)' }}>
            MAY 15 – 17 · 2026
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/sports"      className="btn-primary  w-full sm:w-48">🏆 Live Scores</Link>
            <Link to="/leaderboard" className="btn-secondary w-full sm:w-48">📊 Leaderboard</Link>
          </div>

          {/* Scroll hint */}
          <div className="mt-12 flex flex-col items-center gap-2 animate-bounce opacity-40">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ color: 'var(--accent)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LIVE MATCHES
      ══════════════════════════════════════════ */}
      {liveMatches.length > 0 && (
        <section className="py-10 px-3 sm:px-4 section-alt">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-wide">LIVE NOW</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {liveMatches.map(match => (
                <Link key={match.id} to={`/match/${match.id}`}
                  className="t-card rounded-2xl p-4 sm:p-5 block group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider truncate mr-2"
                      style={{ color: 'var(--accent)' }}>{match.sport}</span>
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse shrink-0">
                      LIVE
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-xs sm:text-sm flex-1 text-center leading-tight min-w-0 truncate">
                      {match.team_a_name || 'TBD'}
                    </p>
                    <div className="px-2 sm:px-4 py-1.5 rounded-xl text-center shrink-0"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <span className="text-xl sm:text-2xl font-black" style={{ color: 'var(--accent)' }}>
                        {match.score_a}
                      </span>
                      <span className="text-xs mx-0.5 sm:mx-1" style={{ color: 'var(--text-faint)' }}>:</span>
                      <span className="text-xl sm:text-2xl font-black" style={{ color: 'var(--accent2)' }}>
                        {match.score_b}
                      </span>
                    </div>
                    <p className="font-bold text-xs sm:text-sm flex-1 text-center leading-tight min-w-0 truncate">
                      {match.team_b_name || 'TBD'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          SPORTS GRID
      ══════════════════════════════════════════ */}
      <section className="py-10 sm:py-16 px-3 sm:px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-wide gradient-text">SPORTS</h2>
            <Link to="/sports" className="text-xs sm:text-sm font-semibold"
              style={{ color: 'var(--accent)' }}>View All →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {sports.map((sport, i) => (
              <Link key={sport.id} to={`/sports/${sport.id}`}
                className="t-card rounded-2xl p-3 sm:p-5 text-center group">
                <div className={`text-2xl sm:text-3xl mb-2 sm:mb-3 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${SPORT_COLORS[i % SPORT_COLORS.length]} flex items-center justify-center mx-auto shadow-lg`}>
                  {sport.icon}
                </div>
                <h3 className="font-bold text-xs sm:text-sm">{sport.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STANDINGS
      ══════════════════════════════════════════ */}
      <section className="py-10 sm:py-16 px-3 sm:px-4 section-alt">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-wide gradient-text">STANDINGS</h2>
            <Link to="/leaderboard" className="text-xs sm:text-sm font-semibold"
              style={{ color: 'var(--accent)' }}>Full Table →</Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><div className="spinner" /></div>
          ) : leaderboard.length === 0 ? (
            <div className="t-card rounded-2xl p-10 text-center">
              <p className="text-4xl mb-3">📊</p>
              <p style={{ color: 'var(--text-muted)' }}>No matches completed yet.</p>
            </div>
          ) : (
            <div className="t-card rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--bg-section)', borderBottom: '1px solid var(--border)' }}>
                    {['#','College','W','D','L','PTS'].map(h => (
                      <th key={h} className={`px-4 py-3 text-xs font-bold tracking-wider ${h === 'College' ? 'text-left' : 'text-center'}`}
                        style={{ color: h === 'PTS' ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((team, i) => (
                    <tr key={team.id}
                      className="transition-colors"
                      style={{ borderTop: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td className="px-4 py-3 text-center">
                        <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                          i === 0 ? 'bg-yellow-400 text-black' :
                          i === 1 ? 'bg-slate-400 text-black' :
                          i === 2 ? 'bg-orange-500 text-black' : ''
                        }`}
                          style={i >= 3 ? { background: 'var(--bg-section)', color: 'var(--text-muted)' } : {}}>
                          {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/college/${team.id}`}
                          className="font-bold text-sm hover:underline"
                          style={{ color: 'var(--accent)' }}>
                          {team.short_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-green-500 font-semibold">{team.wins}</td>
                      <td className="px-4 py-3 text-center text-sm text-yellow-500 font-semibold">{team.draws}</td>
                      <td className="px-4 py-3 text-center text-sm text-red-500 font-semibold">{team.losses}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-lg font-black" style={{ color: 'var(--accent)' }}>
                          {team.total_points}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          EVENT INFO
      ══════════════════════════════════════════ */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="t-card rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-black gradient-text mb-2">QUADRA 5.0</h2>
            <p className="text-sm font-semibold tracking-widest mb-6"
              style={{ color: 'var(--accent)' }}>IGNITE · INSPIRE</p>
            <p className="mb-8 max-w-xl mx-auto leading-relaxed"
              style={{ color: 'var(--text-muted)' }}>
              The premier intercollegiate multi-sports tournament of Government Medical College Alappuzha.
              Watch live scores, track your favourite teams, and experience the thrill of competition.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { val: sports.length || 8, label: 'Sports',     color: 'var(--accent)'  },
                { val: '50+',              label: 'Matches',    color: 'var(--accent2)' },
                { val: '₹35K',             label: 'Prize Pool', color: 'var(--accent3)' },
              ].map(s => (
                <div key={s.label} className="px-6 py-4 rounded-xl text-center"
                  style={{ background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
                  <p className="text-2xl font-black" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          INSTAGRAM
      ══════════════════════════════════════════ */}
      <section className="py-12 px-4 section-alt">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Follow us for live updates & highlights
          </p>
          <a href="https://instagram.com/quadra.tdmc" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-white
                       bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500
                       hover:opacity-90 transition-opacity shadow-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @quadra.tdmc
          </a>
        </div>
      </section>

    </div>
  )
}
