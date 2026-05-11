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
      if (res.data.token) {
        authenticateAdmin(res.data.token)
        navigate('/realadmin/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>

        <div className="text-center mb-8">
          <img src="/logo.png" alt="QUADRA 5.0" className="h-20 mx-auto mb-4 object-contain" />
          <p className="text-sm t-muted">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 t-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter admin password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm px-4 py-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs t-faint">
          Government Medical College Alappuzha
        </p>
      </div>
    </div>
  )
}
