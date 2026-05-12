import { useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'

export default function AdminHeader({ title, subtitle, backTo, backLabel }) {
  const navigate = useNavigate()
  const { logoutAdmin, supabaseSyncStatus } = useSocket()

  const handleLogout = () => {
    logoutAdmin()
    navigate('/realadmin')
  }

  return (
    <header className="glass border-b border-gray-800 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: back + title */}
          <div className="flex items-center gap-3 min-w-0">
            {backTo && (
              <button onClick={() => navigate(backTo)}
                className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                <span className="hidden sm:inline">{backLabel || 'Back'}</span>
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold gradient-text truncate">{title}</h1>
              {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            {backTo !== '/realadmin/dashboard' && (
              <button onClick={() => navigate('/realadmin/dashboard')}
                className="px-3 py-1.5 glass border border-gray-600 text-gray-300 rounded-lg hover:bg-white/5 transition-colors text-xs font-semibold">
                Dashboard
              </button>
            )}
            <button onClick={handleLogout}
              className="px-3 py-1.5 bg-red-600/20 border border-red-600 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-xs font-semibold">
              Logout
            </button>
          </div>
        </div>
      </div>
      {supabaseSyncStatus && (
        <div className="border-t border-gray-800 py-2 px-4 bg-black/40 text-sm text-gray-200">
          <strong className={supabaseSyncStatus.success ? 'text-green-300' : 'text-red-300'}>
            {supabaseSyncStatus.success ? 'Supabase sync' : 'Supabase sync error'}:
          </strong>
          <span className="ml-2">{supabaseSyncStatus.message || 'No details available'}</span>
        </div>
      )}
    </header>
  )
}
