import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { SocketProvider } from './context/SocketContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Sports from './pages/Sports'
import MatchDetail from './pages/MatchDetail'
import Leaderboard from './pages/Leaderboard'
import CollegeDetail from './pages/CollegeDetail'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminColleges from './pages/admin/AdminColleges'
import AdminMatches from './pages/admin/AdminMatches'
import AdminLiveScore from './pages/admin/AdminLiveScore'
import Gallery from './pages/Gallery'
import AdminSports from './pages/admin/AdminSports'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/sports" element={<Layout><Sports /></Layout>} />
            <Route path="/sports/:sportId" element={<Layout><Sports /></Layout>} />
            <Route path="/match/:id" element={<Layout><MatchDetail /></Layout>} />
            <Route path="/leaderboard" element={<Layout><Leaderboard /></Layout>} />
            <Route path="/college/:id" element={<Layout><CollegeDetail /></Layout>} />
            <Route path="/gallery"     element={<Layout><Gallery /></Layout>} />
            <Route path="/realadmin" element={<AdminLogin />} />
            <Route path="/realadmin/dashboard" element={<AdminDashboard />} />
            <Route path="/realadmin/colleges" element={<AdminColleges />} />
            <Route path="/realadmin/matches" element={<AdminMatches />} />
            <Route path="/realadmin/sports" element={<AdminSports />} />
            <Route path="/realadmin/live/:id" element={<AdminLiveScore />} />
          </Routes>
        </Router>
      </SocketProvider>
    </ThemeProvider>
  )
}

export default App