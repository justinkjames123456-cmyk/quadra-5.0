import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import axios from 'axios'
import { useSocket } from '../context/SocketContext'

gsap.registerPlugin(ScrollTrigger)

const sports = [
  { id: 'football', name: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600' },
  { id: 'cricket', name: 'Cricket', icon: '🏏', color: 'from-blue-500 to-indigo-600' },
  { id: 'basketball', name: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600' },
  { id: 'badminton', name: 'Badminton', icon: '🏸', color: 'from-red-500 to-rose-600' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐', color: 'from-yellow-500 to-orange-500' },
  { id: 'kho-kho', name: 'Kho Kho', icon: '🏃', color: 'from-purple-500 to-violet-600' },
  { id: 'table-tennis', name: 'Table Tennis', icon: '🏓', color: 'from-pink-500 to-rose-500' },
  { id: 'chess', name: 'Chess', icon: '♟️', color: 'from-gray-600 to-gray-800' }
]

export default function Home() {
  const heroRef = useRef(null)
  const ballRef = useRef(null)
  const playerRef = useRef(null)
  const buttonsRef = useRef(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [liveMatches, setLiveMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const { socket } = useSocket()

  const fetchData = async () => {
    try {
      const [leaderboardRes, matchesRes] = await Promise.all([
        axios.get('/api/leaderboard/overall'),
        axios.get('/api/matches?status=live')
      ])
      setLeaderboard(leaderboardRes.data.slice(0, 5))
      setLiveMatches(matchesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [])

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return

    // score-updated: update the matching live match score in place
    const onScoreUpdated = (updatedMatch) => {
      setLiveMatches(prev =>
        prev.map(m => m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m)
      )
    }

    // status-updated: a match changed status — re-fetch live matches list
    // (a match may have gone live or completed)
    const onMatchesUpdated = () => {
      fetchData()
    }

    // leaderboard changed
    const onLeaderboardUpdate = async () => {
      try {
        const res = await axios.get('/api/leaderboard/overall')
        setLeaderboard(res.data.slice(0, 5))
      } catch (e) { /* ignore */ }
    }

    socket.on('score-updated', onScoreUpdated)
    socket.on('status-updated', onMatchesUpdated)
    socket.on('matches-updated', onMatchesUpdated)
    socket.on('leaderboard-update', onLeaderboardUpdate)

    return () => {
      socket.off('score-updated', onScoreUpdated)
      socket.off('status-updated', onMatchesUpdated)
      socket.off('matches-updated', onMatchesUpdated)
      socket.off('leaderboard-update', onLeaderboardUpdate)
    }
  }, [socket])

  // Hero Animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create timeline for scroll-triggered animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      })

      // Player runs in
      tl.from(playerRef.current, {
        x: -200,
        opacity: 0,
        duration: 1,
        ease: 'power2.out'
      })

      // Ball appears and gets kicked
      tl.to(ballRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.3
      })

      // Ball travels across screen
      tl.to(ballRef.current, {
        x: window.innerWidth * 0.6,
        y: -100,
        rotation: 720,
        scale: 0.5,
        duration: 2,
        ease: 'power2.inOut'
      })

      // Ball explodes into particles (simplified as fade out)
      tl.to(ballRef.current, {
        opacity: 0,
        scale: 2,
        duration: 0.5
      })

      // Buttons appear
      tl.to(buttonsRef.current, {
        opacity: 1,
        y: 0,
        stagger: 0.2,
        duration: 0.5,
        ease: 'back.out(1.7)'
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-quadra-dark via-[#1a1a3e] to-quadra-dark">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-quadra-cyan rounded-full filter blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-quadra-purple rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-quadra-orange rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4">
          <h1 className="text-6xl md:text-8xl font-black font-display mb-4">
            <span className="gradient-text">QUADRA 5.0</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-2 font-semibold">
            Intercollegiate Sports Tournament
          </p>
          <p className="text-lg text-gray-400 mb-8">
            Government Medical College Alappuzha
          </p>
          <p className="text-sm md:text-base text-quadra-cyan font-mono mb-12">
            IGNITE · INSPIRE
          </p>

          {/* Football Player Animation */}
          <div className="relative h-32 mb-8">
            {/* Player Silhouette */}
            <div 
              ref={playerRef}
              className="absolute left-1/4 bottom-0 text-8xl opacity-0"
              style={{ transform: 'translateX(-100%)' }}
            >
              🏃
            </div>

            {/* Ball */}
            <div 
              ref={ballRef}
              className="absolute left-1/4 bottom-8 text-4xl opacity-0"
              style={{ left: '30%' }}
            >
              ⚽
            </div>

            {/* CTA Buttons (appear after animation) */}
            <div ref={buttonsRef} className="absolute inset-0 flex items-center justify-center space-x-4 opacity-0" style={{ top: '50%', transform: 'translateY(20px)' }}>
              <Link to="/sports" className="btn-primary">
                🏆 Live Scores
              </Link>
              <Link to="/leaderboard" className="btn-secondary">
                📊 Leaderboard
              </Link>
              <Link to="/sports" className="btn-secondary">
                📅 Schedule
              </Link>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-quadra-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Live Matches Section */}
      {liveMatches.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-8 text-center">
              <span className="text-quadra-cyan">🔴</span> LIVE NOW
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveMatches.map(match => (
                <Link key={match.id} to={`/match/${match.id}`} className="glass rounded-xl p-6 card-hover">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-quadra-cyan font-semibold uppercase">{match.sport}</span>
                    <span className="text-xs bg-red-600 px-2 py-1 rounded-full animate-pulse">LIVE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="font-bold text-lg">{match.team_a_name || 'TBD'}</p>
                    </div>
                    <div className="mx-4 px-4 py-2 bg-quadra-glass rounded-lg">
                      <span className="text-3xl font-bold text-quadra-cyan">{match.score_a}</span>
                      <span className="text-gray-500 mx-2">:</span>
                      <span className="text-3xl font-bold text-quadra-purple">{match.score_b}</span>
                    </div>
                    <div className="text-center flex-1">
                      <p className="font-bold text-lg">{match.team_b_name || 'TBD'}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sports Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-8 text-center gradient-text">
            SPORTS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {sports.map((sport) => (
              <Link 
                key={sport.id}
                to={`/sports/${sport.id}`}
                className="glass rounded-xl p-6 text-center card-hover group"
              >
                <div className={`text-5xl mb-4 bg-gradient-to-br ${sport.color} w-20 h-20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                  {sport.icon}
                </div>
                <h3 className="font-bold text-lg">{sport.name}</h3>
                <p className="text-sm text-gray-400 mt-1">View Results</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bold font-display gradient-text">
              OVERALL STANDINGS
            </h2>
            <Link to="/leaderboard" className="text-quadra-cyan hover:underline">View All →</Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-quadra-glass">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">RANK</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">COLLEGE</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">W</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">D</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">L</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-quadra-cyan">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((team, index) => (
                    <tr key={team.id} className="border-t border-gray-800 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-500 text-black' :
                          'bg-gray-700 text-white'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">{team.short_name}</td>
                      <td className="px-6 py-4 text-center text-gray-400">{team.wins}</td>
                      <td className="px-6 py-4 text-center text-gray-400">{team.draws}</td>
                      <td className="px-6 py-4 text-center text-gray-400">{team.losses}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xl font-bold text-quadra-cyan">{team.total_points}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Event Info */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="glass rounded-xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">
              <span className="gradient-text">QUADRA 5.0</span>
            </h2>
            <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
              The premier intercollegiate multi-sports tournament featuring 8 exciting sports. 
              Watch live scores, track your favorite teams, and experience the thrill of competition.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-6 py-3 bg-quadra-glass rounded-lg">
                <p className="text-2xl font-bold text-quadra-cyan">8</p>
                <p className="text-sm text-gray-400">Sports</p>
              </div>
              <div className="px-6 py-3 bg-quadra-glass rounded-lg">
                <p className="text-2xl font-bold text-quadra-purple">50+</p>
                <p className="text-sm text-gray-400">Matches</p>
              </div>
              <div className="px-6 py-3 bg-quadra-glass rounded-lg">
                <p className="text-2xl font-bold text-quadra-orange">₹35,000</p>
                <p className="text-sm text-gray-400">Prize Pool</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}