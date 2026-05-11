import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'

const sportsList = [
  { id: 'football', name: 'Football', icon: '⚽' },
  { id: 'cricket', name: 'Cricket', icon: '🏏' },
  { id: 'basketball', name: 'Basketball', icon: '🏀' },
  { id: 'badminton', name: 'Badminton', icon: '🏸' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
  { id: 'kho-kho', name: 'Kho Kho', icon: '🏃' },
  { id: 'table-tennis', name: 'Table Tennis', icon: '🏓' },
  { id: 'chess', name: 'Chess', icon: '♟️' }
]

const statusColors = {
  upcoming: 'bg-blue-600',
  live: 'bg-red-600 animate-pulse',
  completed: 'bg-green-600'
}

const statusLabels = {
  upcoming: 'UPCOMING',
  live: 'LIVE',
  completed: 'COMPLETED'
}

export default function Sports() {
  const { sport, gender } = useParams()
  const [selectedGender, setSelectedGender] = useState(gender || null)
  const [selectedSport, setSelectedSport] = useState(sport || null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (sport) setSelectedSport(sport)
    if (gender) setSelectedGender(gender)
  }, [sport, gender])

  useEffect(() => {
    if (selectedSport && selectedGender) {
      fetchMatches()
    }
  }, [selectedSport, selectedGender])

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/matches?sport=${selectedSport}&gender=${selectedGender}`)
      setMatches(res.data)
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentSport = sportsList.find(s => s.id === selectedSport)

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4 gradient-text">
            SPORTS
          </h1>
          <p className="text-gray-400">Select a sport and category to view matches</p>
        </div>

        {/* Sport Selection */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-gray-300">Select Sport</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {sportsList.map((sportItem) => (
              <button
                key={sportItem.id}
                onClick={() => {
                  setSelectedSport(sportItem.id)
                  setMatches([])
                }}
                className={`p-3 rounded-lg glass transition-all ${
                  selectedSport === sportItem.id 
                    ? 'border-2 border-quadra-cyan bg-quadra-cyan/20' 
                    : 'hover:border-quadra-cyan/50'
                }`}
              >
                <div className="text-2xl mb-1">{sportItem.icon}</div>
                <div className="text-xs font-semibold truncate">{sportItem.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Gender Selection */}
        {selectedSport && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4 text-gray-300">
              {currentSport?.icon} {currentSport?.name} - Select Category
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedGender('men')}
                className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                  selectedGender === 'men'
                    ? 'btn-primary'
                    : 'glass hover:border-quadra-cyan'
                }`}
              >
                👨 MEN
              </button>
              <button
                onClick={() => setSelectedGender('women')}
                className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                  selectedGender === 'women'
                    ? 'btn-primary'
                    : 'glass hover:border-quadra-purple'
                }`}
              >
                👩 WOMEN
              </button>
            </div>
          </div>
        )}

        {/* Matches List */}
        {selectedSport && selectedGender && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {currentSport?.name} - {selectedGender === 'men' ? "Men's" : "Women's"}
              </h2>
              <span className="text-gray-400">
                {matches.length} match{matches.length !== 1 ? 'es' : ''}
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : matches.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center">
                <p className="text-xl text-gray-400 mb-4">No matches found</p>
                <p className="text-sm text-gray-500">
                  Matches will be added by the admin before the tournament starts.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => (
                  <Link
                    key={match.id}
                    to={`/match/${match.id}`}
                    className="glass rounded-xl p-6 block card-hover"
                  >
                    <div className="flex items-center justify-between">
                      {/* Status Badge */}
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[match.status]}`}>
                          {statusLabels[match.status]}
                        </span>
                        {match.scheduled_time && (
                          <span className="text-sm text-gray-400">
                            {format(new Date(match.scheduled_time), 'MMM dd, yyyy • hh:mm a')}
                          </span>
                        )}
                      </div>

                      {/* Teams & Score */}
                      <div className="flex items-center space-x-6 flex-1 justify-center">
                        <div className="text-right flex-1">
                          <p className="font-bold text-lg">{match.team_a_name || 'TBD'}</p>
                        </div>
                        <div className="px-4 py-2 bg-quadra-glass rounded-lg min-w-24 text-center">
                          {match.status === 'upcoming' ? (
                            <span className="text-gray-500">VS</span>
                          ) : (
                            <>
                              <span className="text-2xl font-bold text-quadra-cyan">{match.score_a}</span>
                              <span className="text-gray-500 mx-1">-</span>
                              <span className="text-2xl font-bold text-quadra-purple">{match.score_b}</span>
                            </>
                          )}
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-bold text-lg">{match.team_b_name || 'TBD'}</p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {match.status === 'completed' && match.winner_id && (
                      <div className="mt-3 pt-3 border-t border-gray-700 text-center">
                        <span className="text-sm text-green-400 font-semibold">
                          🏆 Winner: {match.winner_id === match.team_a_id ? match.team_a_name : match.team_b_name}
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!selectedSport && (
          <div className="glass rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🏟️</div>
            <h3 className="text-2xl font-bold mb-2">Welcome to QUADRA 5.0</h3>
            <p className="text-gray-400">Select a sport above to view matches and live scores</p>
          </div>
        )}
      </div>
    </div>
  )
}