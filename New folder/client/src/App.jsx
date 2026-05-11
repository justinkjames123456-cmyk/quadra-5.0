import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Sports from './pages/Sports'
import MatchDetail from './pages/MatchDetail'
import Leaderboard from './pages/Leaderboard'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminColleges from './pages/admin/AdminColleges'
import AdminMatches from './pages/admin/AdminMatches'
import AdminLiveScore from './pages/admin/AdminLiveScore'
import { SocketProvider } from './context/SocketContext'

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="sports" element={<Sports />} />
            <Route path="sports/:sport/:gender" element={<Sports />} />
            <Route path="match/:id" element={<MatchDetail />} />
            <Route path="leaderboard" element={<Leaderboard />} />
          </Route>

          {/* Admin Routes */}
          <Route path="realadmin" element={<AdminLogin />} />
          <Route path="realadmin/dashboard" element={<AdminDashboard />} />
          <Route path="realadmin/colleges" element={<AdminColleges />} />
          <Route path="realadmin/matches" element={<AdminMatches />} />
          <Route path="realadmin/live/:id" element={<AdminLiveScore />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SocketProvider>
  )
}

export default App