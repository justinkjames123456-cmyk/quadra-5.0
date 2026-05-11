import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useSocket } from '../../context/SocketContext'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { authenticateAdmin } = useSocket()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await axios.post('/api/admin/login', { password })
      if (res.data.success) {
        authenticateAdmin(res.data.token)
        navigate('/realadmin/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-quadra-dark flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-display gradient-text mb-2">QUADRA 5.0</h1>
          <p className="text-gray-400">Admin Panel</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-quadra-glass border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quadra-cyan transition-colors"
              placeholder="Enter admin password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-500">
          <p>Government Medical College Alappuzha</p>
          <p className="mt-1">IGNITE · INSPIRE</p>
        </div>
      </div>
    </div>
  )
}