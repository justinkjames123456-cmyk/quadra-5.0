import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useSocket } from '../../context/SocketContext'
import AdminHeader from '../../components/AdminHeader'

const EMOJI_SUGGESTIONS = ['⚽','🏏','🏀','🏸','🏐','🏃','🏓','♟️','🥊','🏊','🎾','🏋️','🤸','🏑','🏒','🥋','🎯','🏹']

export default function AdminSports() {
  const navigate = useNavigate()
  const { adminToken, logoutAdmin } = useSocket()
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ id: '', name: '', icon: '🏆', description: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!adminToken) { navigate('/realadmin'); return }
    fetchSports()
  }, [adminToken])

  const fetchSports = async () => {
    try {
      const res = await axios.get('/api/sports')
      setSports(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ id: '', name: '', icon: '🏆', description: '' })
    setError('')
    setShowForm(true)
  }

  const openEdit = (sport) => {
    setEditing(sport)
    setForm({ id: sport.id, name: sport.name, icon: sport.icon, description: sport.description || '' })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await axios.put(`/api/sports/${editing.id}`, form)
      } else {
        await axios.post('/api/sports', form)
      }
      fetchSports()
      setShowForm(false)
    } catch (e) {
      setError(e.response?.data?.error || 'Error saving sport')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete "${id}"? This won't delete existing matches.`)) return
    await axios.delete(`/api/sports/${id}`)
    fetchSports()
  }

  if (!adminToken) return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <AdminHeader
        title="Manage Sports"
        subtitle="Add, edit or remove sports events"
        backTo="/realadmin/dashboard"
        backLabel="Dashboard"
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Add button */}
        <div className="mb-6">
          <button onClick={openAdd}
            className="btn-primary flex items-center gap-2 text-base px-6 py-3">
            <span className="text-xl">+</span> Add Sport
          </button>
        </div>

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="rounded-xl p-6 w-full max-w-md" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <h2 className="text-xl font-bold mb-5">{editing ? 'Edit Sport' : 'Add New Sport'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ID — only for new */}
                {!editing && (
                  <div>
                    <label className="block text-sm font-semibold mb-1 t-muted">Sport ID (slug)</label>
                    <input value={form.id}
                      onChange={e => setForm({ ...form, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      className="input-field" placeholder="e.g. kabaddi" required />
                    <p className="text-xs t-faint mt-1">Lowercase, hyphens only. Used in URLs.</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold mb-1 t-muted">Name</label>
                  <input value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="input-field" placeholder="e.g. Kabaddi" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 t-muted">Icon (emoji)</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {EMOJI_SUGGESTIONS.map(em => (
                      <button key={em} type="button"
                        onClick={() => setForm({ ...form, icon: em })}
                        className={`text-2xl p-1 rounded transition-all ${form.icon === em ? 'ring-2 ring-[var(--accent)] scale-110' : 'opacity-60 hover:opacity-100'}`}>
                        {em}
                      </button>
                    ))}
                  </div>
                  <input value={form.icon}
                    onChange={e => setForm({ ...form, icon: e.target.value })}
                    className="input-field" placeholder="Or type any emoji" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 t-muted">Description</label>
                  <input value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="input-field" placeholder="e.g. 7v7 standard rules" />
                </div>
                {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">{error}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="submit" className="btn-primary flex-1 py-3 text-base">
                    {editing ? 'Update' : 'Add'} Sport
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-5 py-3 rounded-lg t-muted transition-colors"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sports list */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner"></div></div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {sports.length === 0 ? (
              <div className="p-12 text-center t-muted">No sports yet. Click "Add Sport" to get started.</div>
            ) : (
              <table className="w-full">
                <thead style={{ background: 'var(--bg-card)' }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold t-muted">SPORT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold t-muted hidden md:table-cell">DESCRIPTION</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold t-muted">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {sports.map(sport => (
                    <tr key={sport.id} className="border-t transition-colors hover:bg-white/5"
                      style={{ borderColor: 'var(--border)' }}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{sport.icon}</span>
                          <div>
                            <p className="font-bold">{sport.name}</p>
                            <p className="text-xs t-faint font-mono">{sport.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm t-muted hidden md:table-cell">{sport.description}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(sport)}
                            className="px-3 py-1 rounded text-sm text-blue-400 bg-blue-600/10 border border-blue-600/30 hover:bg-blue-600/20 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(sport.id)}
                            className="px-3 py-1 rounded text-sm text-red-400 bg-red-600/10 border border-red-600/30 hover:bg-red-600/20 transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
