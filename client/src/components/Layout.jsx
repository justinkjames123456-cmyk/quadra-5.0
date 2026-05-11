import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

function ThemeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={dark ? 'Switch to Navy mode' : 'Switch to Space mode'}
      className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}
    >
      {dark
        ? /* moon → switch to navy */
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
        : /* sun → switch to space */
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" strokeLinecap="round"/>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
      }
    </button>
  )
}

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { path: '/',            label: 'Home' },
    { path: '/sports',      label: 'Sports' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/gallery',     label: 'Gallery' },
  ]

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <div className="min-h-screen t-bg t-text">

      {/* ── Navbar ── */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-[60px] sm:h-[80px]">

            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0">
              <img src="/logo.png" alt="QUADRA 5.0"
                className="w-auto object-contain"
                style={{
                  height: 'clamp(40px, 8vw, 64px)',
                  filter: 'drop-shadow(0 0 12px color-mix(in srgb, var(--accent) 50%, transparent))',
                }}
              />
            </Link>

            {/* Desktop links + toggle */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(l => (
                <Link key={l.path} to={l.path}
                  className="relative px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    color: isActive(l.path) ? 'var(--accent)' : 'var(--text-muted)',
                    background: isActive(l.path) ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                  }}
                >
                  {l.label}
                  {isActive(l.path) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                      style={{ background: 'var(--accent)' }} />
                  )}
                </Link>
              ))}
              <div className="ml-3 pl-3" style={{ borderLeft: '1px solid var(--border)' }}>
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile: toggle + hamburger */}
            <div className="md:hidden flex items-center gap-3">
              <ThemeToggle />
              <button onClick={() => setMenuOpen(o => !o)} aria-label="Menu"
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)', background: menuOpen ? 'var(--bg-card)' : 'transparent' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden glass-nav" style={{ borderTop: '1px solid var(--border-nav)' }}>
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map(l => (
                <Link key={l.path} to={l.path} onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-base font-semibold transition-all"
                  style={{
                    color: isActive(l.path) ? 'var(--accent)' : 'var(--text-muted)',
                    background: isActive(l.path) ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ── Content ── */}
      <main>{children}</main>

      {/* ── Footer ── */}
      <footer className="glass-nav mt-16 py-10" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <img src="/logo.png" alt="QUADRA 5.0"
                className="h-14 w-auto object-contain mb-3 mx-auto md:mx-0" />
              <p className="text-sm t-muted">May 15–17, 2026</p>
              <p className="text-sm t-muted">Government Medical College Alappuzha</p>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--accent2)' }}>Quick Links</h3>
              <div className="flex flex-col gap-2">
                <Link to="/sports"      className="text-sm t-muted hover:t-text transition-colors">Sports</Link>
                <Link to="/leaderboard" className="text-sm t-muted hover:t-text transition-colors">Leaderboard</Link>
                <Link to="/gallery"     className="text-sm t-muted hover:t-text transition-colors">Gallery</Link>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--accent3)' }}>Contact</h3>
              <p className="text-sm t-muted mb-1">Sports Secretary: Lal Krishnan AR</p>
              <p className="text-sm t-muted mb-1">Phone: 7025760870</p>
              <p className="text-sm t-muted mb-2">General Secretary: +91 94964 75272</p>
              <a href="https://instagram.com/quadra.tdmc" target="_blank" rel="noopener noreferrer"
                className="text-sm t-muted inline-flex items-center gap-2 transition-colors hover:t-accent">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                @quadra.tdmc
              </a>
            </div>
          </div>
          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs t-faint">© 2026 QUADRA 5.0 • SATTVA College Union • Government Medical College Alappuzha</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
