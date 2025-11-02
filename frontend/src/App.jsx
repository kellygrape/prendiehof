import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { authAPI } from './utils/api'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Nominations from './pages/Nominations'
import NominationDetail from './pages/NominationDetail'
import AdminPanel from './pages/AdminPanel'
import Results from './pages/Results'
import './App.css'

function App() {
  const [user, setUser] = useState(authAPI.getCurrentUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated on mount
    const currentUser = authAPI.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    authAPI.logout()
    setUser(null)
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <Router>
      <div className="app">
        {user && (
          <nav className="navbar">
            <div className="nav-content">
              <h1>Hall of Fame Nominations</h1>
              <div className="nav-links">
                <a href="/dashboard">Dashboard</a>
                <a href="/nominations">Nominations</a>
                <a href="/results">Results</a>
                {user.role === 'admin' && <a href="/admin">Admin</a>}
                <div className="user-info">
                  <span>{user.username} ({user.role})</span>
                  <button onClick={handleLogout} className="btn-secondary">Logout</button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <div className="main-content">
          <Routes>
            <Route
              path="/login"
              element={
                user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
              }
            />
            <Route
              path="/dashboard"
              element={
                user ? <Dashboard user={user} /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/nominations"
              element={
                user ? <Nominations user={user} /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/nominations/:id"
              element={
                user ? <NominationDetail user={user} /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/admin"
              element={
                user && user.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" />
              }
            />
            <Route
              path="/results"
              element={
                user ? <Results user={user} /> : <Navigate to="/login" />
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
