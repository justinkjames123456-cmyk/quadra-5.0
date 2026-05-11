import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useSocket } from '../../context/SocketContext'

export default function AdminColleges() {
  const navigate = useNavigate()
  const { adminToken, logoutAdmin } = useSocket()
  const [colleges, setColleges] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCollege, setEditingCollege] = useState(null)
  const [formData, setFormData] = useState({ full_name: '', short_name: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!adminToken) {
      navigate('/realadmin')
      return
    }
    fetchColleges()
  }, [adminToken, navigate])

  const fetchColleges = async () => {
    try {
      const res = await axios.get('/api/colleges')
      setColleges(res.data)
    } catch (error) {
      console.error('Error fetching colleges:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.full_name || !formData.short_name) {
      setError('Both fields are required')
      return
    }

    try {
      if (editingCollege) {
        await axios.put(`/api/colleges/${editingCollege.id}`, formData)
      } else {
        await axios.post('/api/colleges', formData)
      }
      fetchColleges()
      setShowForm(false)
      setEditingCollege(null)
      setFormData({ full_name: '', short_name: '' })
    } catch (error) {
      setError(error.response?.data?.error || 'Error saving college')
    }
  }

  const handleEdit = (college) => {
    setEditingCollege(college)
    setFormData({ full_name: college.full_name, short_name: college.short_name })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this college?')) return

    try {
      await axios.delete(`/api/colleges/${id}`)
      fetchColleges()
    } catch (error) {
      console.error('Error deleting college:', error)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCollege(null)
    setFormData({ full_name: '', short_name: '' })
    setError('')
  }

  const handleLogout = () => {
    logoutAdmin()
    navigate('/realadmin')
  }

  if (!adminToken) return null

  return (
    <div className="min-h-screen bg-quadra-dark">
      {/* Header */}
      <header className="glass border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display gradient-text">Manage Colleges</h1>
              <p className="text-sm text-gray-400">Add, edit, or remove participating colleges</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/realadmin/dashboard')}
                className="px-4 py-2 glass border border-gray-600 text-gray-300 rounded-lg hover:bg-white/5 transition-colors text-sm font-semibold"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600/20 border border-red-600 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Add College Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <span className="text-xl">+</span>
            <span>Add College</span>
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingCollege ? 'Edit College' : 'Add New College'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-quadra-glass border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quadra-cyan transition-colors"
                    placeholder="e.g., Government Medical College Alappuzha"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    Short Name
                  </label>
                  <input
                    type="text"
                    value={formData.short_name}
                    onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                    className="w-full px-4 py-3 bg-quadra-glass border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quadra-cyan transition-colors"
                    placeholder="e.g., GMC Alappuzha"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be displayed on scoreboards and leaderboards
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary flex-1">
                    {editingCollege ? 'Update' : 'Add'} College
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-3 glass border border-gray-600 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Colleges List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-quadra-glass">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Short Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Full Name</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {colleges.map((college) => (
                  <tr key={college.id} className="border-t border-gray-800 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-quadra-cyan">{college.short_name}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{college.full_name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(college)}
                          className="px-3 py-1 bg-blue-600/20 border border-blue-600 text-blue-400 rounded text-sm hover:bg-blue-600/30 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(college.id)}
                          className="px-3 py-1 bg-red-600/20 border border-red-600 text-red-400 rounded text-sm hover:bg-red-600/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {colleges.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-gray-400">
                      No colleges added yet. Click "Add College" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}