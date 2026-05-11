import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGender, setSelectedGender] = useState('all')

  useEffect(() => {
    fetchLeaderboard()
  }, [selectedGender])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const endpoint = selectedGender === 'all' 
        ? '/api/leaderboard/overall' 
        : `/api/leaderboard?gender=${selectedGender}`
      const res = await axios.get(endpoint)
      setLeaderboard(res.data)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankBadge = (index) => {
    if (index === 0) return { bg: 'bg-yellow-500', text: 'text-black', label: '🥇' }
    if (index === 1) return { bg: 'bg-gray-400', text: 'text-black', label: '🥈' }
    if (index === 2) return { bg: 'bg-orange-500', text: 'text-black', label: '🥉' }
    return { bg: 'bg-gray-700', text: 'text-white', label: `#${index + 1}` }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4 gradient-text">
            LEADERBOARD
          </h1>
          <p className="text-gray-400">Overall college rankings based on match results</p>
        </div>

        {/* Gender Filter */}
        <div className="flex justify-center mb-8">
          <div className="glass rounded-lg p-2 inline-flex">
            <button
              onClick={() => setSelectedGender('all')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedGender === 'all'
                  ? 'btn-primary'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Overall
            </button>
            <button
              onClick={() => setSelectedGender('men')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedGender === 'men'
                  ? 'btn-primary'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              👨 Men
            </button>
            <button
              onClick={() => setSelectedGender('women')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedGender === 'women'
                  ? 'btn-primary'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              👩 Women
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold mb-2">No Data Yet</h3>
            <p className="text-gray-400">
              {selectedGender === 'all' 
                ? 'Matches haven\'t started yet. Check back soon!' 
                : `No ${selectedGender}'s matches completed yet.`}
            </p>
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="p-8 pb-0">
                <div className="flex items-end justify-center space-x-4 md:space-x-8">
                  {/* 2nd Place */}
                  <div className="text-center">
                    <div className="text-4xl mb-2">🥈</div>
                    <div className="w-32 md:w-48 bg-gradient-to-t from-gray-600 to-gray-500 rounded-t-lg p-4">
                      <p className="font-bold text-lg truncate">
                        {leaderboard[1]?.short_name}
                      </p>
                      <p className="text-sm text-gray-300">
                        {leaderboard[1]?.total_points} pts
                      </p>
                    </div>
                    <div className="w-32 md:w-48 h-16 bg-gray-700 rounded-b-lg"></div>
                  </div>

                  {/* 1st Place */}
                  <div className="text-center">
                    <div className="text-5xl mb-2">🥇</div>
                    <div className="w-40 md:w-56 bg-gradient-to-t from-yellow-600 to-yellow-500 rounded-t-lg p-4">
                      <p className="font-bold text-xl truncate">
                        {leaderboard[0]?.short_name}
                      </p>
                      <p className="text-sm text-yellow-100">
                        {leaderboard[0]?.total_points} pts
                      </p>
                    </div>
                    <div className="w-40 md:w-56 h-24 bg-yellow-700 rounded-b-lg"></div>
                  </div>

                  {/* 3rd Place */}
                  <div className="text-center">
                    <div className="text-4xl mb-2">🥉</div>
                    <div className="w-28 md:w-40 bg-gradient-to-t from-orange-700 to-orange-600 rounded-t-lg p-4">
                      <p className="font-bold text-base truncate">
                        {leaderboard[2]?.short_name}
                      </p>
                      <p className="text-sm text-orange-100">
                        {leaderboard[2]?.total_points} pts
                      </p>
                    </div>
                    <div className="w-28 md:w-40 h-12 bg-orange-800 rounded-b-lg"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Table */}
            <div className="mt-8 px-4 pb-4">
              <h3 className="text-xl font-bold mb-4 text-gray-300">
                Full Standings ({leaderboard.length} colleges)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-quadra-glass">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">RANK</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">COLLEGE</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">MP</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">W</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">D</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">L</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">GF</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-quadra-cyan">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((team, index) => {
                      const rank = getRankBadge(index)
                      return (
                        <tr 
                          key={team.id} 
                          className={`border-t border-gray-800 hover:bg-white/5 transition-colors ${
                            index < 3 ? 'bg-gradient-to-r from-quadra-cyan/10 to-transparent' : ''
                          }`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rank.bg} ${rank.text}`}>
                                {rank.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-bold">{team.short_name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-xs">{team.full_name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-gray-400">{team.matches_played}</td>
                          <td className="px-4 py-4 text-center text-green-400">{team.wins}</td>
                          <td className="px-4 py-4 text-center text-yellow-400">{team.draws}</td>
                          <td className="px-4 py-4 text-center text-red-400">{team.losses}</td>
                          <td className="px-4 py-4 text-center text-gray-400">{team.total_goals}</td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-xl font-bold text-quadra-cyan neon-text-cyan">
                              {team.total_points}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="glass rounded-xl p-6 mt-8">
          <h3 className="font-bold mb-2">📋 Points System</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span><strong>Win:</strong> 3 points</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span><strong>Draw:</strong> 1 point</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span><strong>Loss:</strong> 0 points</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}