import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGender, setSelectedGender] = useState('all')

  useEffect(() => { fetchLeaderboard() }, [selectedGender])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const endpoint = selectedGender === 'all'
        ? '/api/leaderboard/overall'
        : `/api/leaderboard?gender=${selectedGender}`
      const res = await axios.get(endpoint)
      setLeaderboard(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const FILTERS = [
    { key: 'all',   label: 'Overall' },
    { key: 'men',   label: '👨 Men' },
    { key: 'women', label: '👩 Women' },
  ]

  return (
    <div className="min-h-screen t-bg py-10 px-4">
      <div className="container mx-auto max-w-5xl">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black gradient-text mb-2">LEADERBOARD</h1>
          <p className="t-muted">Overall college rankings based on match results</p>
        </div>

        {/* Filter */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex gap-1 p-1.5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setSelectedGender(f.key)}
                className="px-5 py-2 rounded-lg text-sm font-bold transition-all"
                style={selectedGender === f.key
                  ? { background: 'var(--accent)', color: '#000' }
                  : { color: 'var(--text-muted)' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="spinner" /></div>
        ) : leaderboard.length === 0 ? (
          <div className="t-card rounded-2xl p-12 text-center">
            <p className="text-5xl mb-4">📊</p>
            <h3 className="text-xl font-bold mb-2">No Data Yet</h3>
            <p className="t-muted">Matches haven't started yet. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {leaderboard.length >= 3 && (
              <div className="t-card rounded-2xl p-8 mb-6">
                <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-8 overflow-x-auto pb-2">
                  {/* 2nd */}
                  <div className="text-center">
                    <p className="text-3xl mb-2">🥈</p>
                    <div className="w-20 sm:w-28 md:w-40 rounded-t-xl p-4"
                      style={{ background: 'linear-gradient(to top, #475569, #64748b)' }}>
                      <p className="font-bold text-white truncate text-sm">{leaderboard[1]?.short_name}</p>
                      <p className="text-xs text-slate-200">{leaderboard[1]?.total_points} pts</p>
                    </div>
                    <div className="w-20 sm:w-28 md:w-40 h-10 sm:h-14 rounded-b-xl" style={{ background: '#334155' }} />
                  </div>
                  {/* 1st */}
                  <div className="text-center">
                    <p className="text-4xl mb-2">🥇</p>
                    <div className="w-24 sm:w-36 md:w-52 rounded-t-xl p-5"
                      style={{ background: 'linear-gradient(to top, #b45309, #d97706)' }}>
                      <p className="font-bold text-white truncate">{leaderboard[0]?.short_name}</p>
                      <p className="text-sm text-yellow-100">{leaderboard[0]?.total_points} pts</p>
                    </div>
                    <div className="w-24 sm:w-36 md:w-52 h-14 sm:h-20 rounded-b-xl" style={{ background: '#92400e' }} />
                  </div>
                  {/* 3rd */}
                  <div className="text-center">
                    <p className="text-3xl mb-2">🥉</p>
                    <div className="w-16 sm:w-24 md:w-36 rounded-t-xl p-4"
                      style={{ background: 'linear-gradient(to top, #92400e, #b45309)' }}>
                      <p className="font-bold text-white truncate text-sm">{leaderboard[2]?.short_name}</p>
                      <p className="text-xs text-orange-100">{leaderboard[2]?.total_points} pts</p>
                    </div>
                    <div className="w-16 sm:w-24 md:w-36 h-8 sm:h-10 rounded-b-xl" style={{ background: '#78350f' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Full table */}
            <div className="t-card rounded-2xl overflow-hidden mb-6">
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-section)' }}>
                <h3 className="font-bold t-muted text-sm">Full Standings — {leaderboard.length} colleges</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead style={{ background: 'var(--bg-section)', borderBottom: '1px solid var(--border)' }}>
                    <tr>
                      {['#','College','MP','W','D','L','PTS'].map(h => (
                        <th key={h}
                          className={`px-4 py-3 text-xs font-bold tracking-wider ${h === 'College' ? 'text-left' : 'text-center'}`}
                          style={{ color: h === 'PTS' ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((team, i) => (
                      <tr key={team.id} className="transition-colors"
                        style={{ borderTop: '1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td className="px-4 py-4 text-center">
                          <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center font-bold text-sm ${
                            i === 0 ? 'bg-yellow-400 text-black' :
                            i === 1 ? 'bg-slate-400 text-black' :
                            i === 2 ? 'bg-orange-500 text-black' : ''
                          }`}
                            style={i >= 3 ? { background: 'var(--bg-section)', color: 'var(--text-muted)' } : {}}>
                            {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <Link to={`/college/${team.id}`}
                            className="font-bold hover:underline" style={{ color: 'var(--accent)' }}>
                            {team.short_name}
                          </Link>
                          <p className="text-xs t-faint truncate max-w-[180px]">{team.full_name}</p>
                        </td>
                        <td className="px-4 py-4 text-center text-sm t-muted">{team.matches_played ?? team.played ?? 0}</td>
                        <td className="px-4 py-4 text-center text-sm font-semibold text-green-500">{team.wins}</td>
                        <td className="px-4 py-4 text-center text-sm font-semibold text-yellow-500">{team.draws}</td>
                        <td className="px-4 py-4 text-center text-sm font-semibold text-red-500">{team.losses}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-xl font-black" style={{ color: 'var(--accent)' }}>
                            {team.total_points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Points system */}
        <div className="t-card rounded-xl p-5">
          <h3 className="font-bold mb-3 text-sm">📋 Points System</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              { dot: 'bg-green-500', label: 'Win',  val: '3 pts' },
              { dot: 'bg-yellow-500', label: 'Draw', val: '1 pt'  },
              { dot: 'bg-red-500',   label: 'Loss', val: '0 pts' },
            ].map(p => (
              <div key={p.label} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${p.dot}`} />
                <span className="t-muted">{p.label}:</span>
                <span className="font-bold">{p.val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

