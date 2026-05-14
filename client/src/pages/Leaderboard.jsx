import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Leaderboard() {
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLeaderboard() }, [])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/leaderboard/overall')
      setLeaderboard(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen t-bg py-10 px-4">
      <div className="container mx-auto max-w-5xl">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black gradient-text mb-2">LEADERBOARD</h1>
          <p className="t-muted">Overall college rankings based on manually assigned points</p>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm t-muted max-w-xl mx-auto">Overall college rankings based on manually assigned points. Click any row to view full college details.</p>
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
            <div className="t-card rounded-2xl overflow-hidden mb-6 shadow-lg shadow-black/5">
              <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-section)' }}>
                <h3 className="font-bold text-sm">Standings — {leaderboard.length} colleges</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px]">
                  <thead style={{ background: 'var(--bg-section)', borderBottom: '1px solid var(--border)' }}>
                    <tr>
                      {['#','College','PNT',''].map(h => (
                        <th key={h}
                          className={`px-4 py-3 text-xs font-bold tracking-wider ${h === 'College' ? 'text-left' : 'text-center'}`}
                          style={{ color: h === 'PNT' ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((team, i) => (
                      <tr key={team.id} className="group cursor-pointer transition duration-200"
                        style={{ borderTop: '1px solid var(--border)' }}
                        onClick={() => navigate(`/college/${team.id}`)}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold ${
                            i === 0 ? 'bg-yellow-400 text-black' :
                            i === 1 ? 'bg-slate-400 text-black' :
                            i === 2 ? 'bg-orange-500 text-black' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-base text-[var(--accent)]">{team.short_name}</div>
                          <p className="text-xs t-faint truncate max-w-[220px]">{team.full_name}</p>
                        </td>
                        <td className="px-4 py-4 text-center text-lg font-black" style={{ color: 'var(--accent)' }}>
                          {team.total_points}
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-semibold text-[var(--accent)]">
                          View →
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
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { dot: 'bg-yellow-500', label: 'Winner',  val: '10 pts' },
              { dot: 'bg-gray-500',   label: 'Runner-up', val: '6 pts'  },
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

