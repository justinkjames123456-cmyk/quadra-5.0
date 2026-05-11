import { Outlet, Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

const sports = [
  { id: 'football', name: 'Football', icon: '⚽' },
  { id: 'cricket', name: 'Cricket', icon: '🏏' },
  { id: 'basketball', name: 'Basketball', icon: '🏀' },
  { id: 'badminton', name: 'Badminton', icon: '🏸' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
  { id: 'kho-kho', name: 'Kho Kho', icon: '🏃' },
  { id: 'table-tennis', name: 'Table Tennis', icon: '🏓' },
  { id: 'chess', name: 'Chess', icon: '♟️' }
]

export default function Layout() {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-quadra-dark">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass py-2' : 'py-4'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold font-display gradient-text">QUADRA 5.0</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className={`text-sm font-semibold transition-colors ${isActive('/') ? 'text-quadra-cyan' : 'text-gray-300 hover:text-white'}`}
              >
                HOME
              </Link>
              <Link 
                to="/leaderboard" 
                className={`text-sm font-semibold transition-colors ${isActive('/leaderboard') ? 'text-quadra-cyan' : 'text-gray-300 hover:text-white'}`}
              >
                LEADERBOARD
              </Link>
              <Link 
                to="/sports" 
                className={`text-sm font-semibold transition-colors ${isActive('/sports') ? 'text-quadra-cyan' : 'text-gray-300 hover:text-white'}`}
              >
                SPORTS
              </Link>

              {/* Sports Quick Links */}
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-700">
                {sports.slice(0, 4).map(sport => (
                  <Link 
                    key={sport.id}
                    to={`/sports/${sport.id}`}
                    className="text-xl hover:scale-125 transition-transform"
                    title={sport.name}
                  >
                    {sport.icon}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 glass rounded-lg p-4">
              <div className="flex flex-col space-y-4">
                <Link to="/" className="text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>Home</Link>
                <Link to="/leaderboard" className="text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>Leaderboard</Link>
                <Link to="/sports" className="text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>Sports</Link>
                <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-700">
                  {sports.map(sport => (
                    <Link 
                      key={sport.id}
                      to={`/sports/${sport.id}`}
                      className="text-2xl"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {sport.icon}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="glass mt-20 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold font-display gradient-text mb-2">QUADRA 5.0</h3>
              <p className="text-gray-400 text-sm">Government Medical College Alappuzha</p>
              <p className="text-gray-400 text-sm mt-1">IGNITE · INSPIRE</p>
            </div>
            
            <div className="flex space-x-6">
              <a href="https://instagram.com/quadra.tdmc" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-quadra-purple transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
            <p>Contact: Lal Krishnan AR (Sports Secretary) - 7025760870</p>
            <p className="mt-2">© 2026 QUADRA 5.0. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}