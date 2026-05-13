import React, { useState, useEffect } from 'react'
import axios from 'axios'

const AdminCollegePoints = () => {
  const [colleges, setColleges] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatePoints, setUpdatePoints] = useState({})
  const [addPoints, setAddPoints] = useState({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchColleges()
  }, [])

  const fetchColleges = async () => {
    try {
      const response = await axios.get('/api/colleges')
      setColleges(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching colleges:', error)
      setLoading(false)
    }
  }

  const handleSetPoints = async (collegeId, points) => {
    try {
      const response = await axios.post(`/api/admin/colleges/${collegeId}/points`, { points: parseInt(points) })
      setMessage(`✓ Points set to ${points} for ${response.data.college.short_name}`)
      fetchColleges()
      setUpdatePoints({ ...updatePoints, [collegeId]: '' })
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(`✗ Error: ${error.response?.data?.error || error.message}`)
    }
  }

  const handleAddPoints = async (collegeId, points) => {
    try {
      const response = await axios.post(`/api/admin/colleges/${collegeId}/points/add`, { points: parseInt(points) })
      setMessage(`✓ Added ${points} points to ${response.data.college.short_name}. Total: ${response.data.college.manual_points}`)
      fetchColleges()
      setAddPoints({ ...addPoints, [collegeId]: '' })
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(`✗ Error: ${error.response?.data?.error || error.message}`)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading colleges...</div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Manage College Points</h2>

      {message && (
        <div className={`p-4 mb-6 rounded ${message.includes('✓') ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'}`}>
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-gray-900 dark:text-white">College</th>
              <th className="px-4 py-3 text-gray-900 dark:text-white">Current Points</th>
              <th className="px-4 py-3 text-gray-900 dark:text-white">Set Points</th>
              <th className="px-4 py-3 text-gray-900 dark:text-white">Add Points</th>
              <th className="px-4 py-3 text-gray-900 dark:text-white">Action</th>
            </tr>
          </thead>
          <tbody>
            {colleges.map((college) => (
              <tr key={college.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-gray-900 dark:text-white">
                  <div>
                    <div className="font-semibold">{college.short_name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{college.full_name}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-lg font-bold text-blue-600 dark:text-blue-400">
                  {college.manual_points || 0}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={updatePoints[college.id] || ''}
                      onChange={(e) => setUpdatePoints({ ...updatePoints, [college.id]: e.target.value })}
                      placeholder="Enter points"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white dark:bg-gray-700 w-24"
                      min="0"
                    />
                    <button
                      onClick={() => handleSetPoints(college.id, updatePoints[college.id] || 0)}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Set
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={addPoints[college.id] || ''}
                      onChange={(e) => setAddPoints({ ...addPoints, [college.id]: e.target.value })}
                      placeholder="Points to add"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white dark:bg-gray-700 w-24"
                    />
                    <button
                      onClick={() => handleAddPoints(college.id, addPoints[college.id] || 0)}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSetPoints(college.id, 0)}
                    className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reset
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminCollegePoints
