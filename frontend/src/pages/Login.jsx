import { useState } from 'react'
import { authAPI } from '../utils/api'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showInitAdmin, setShowInitAdmin] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await authAPI.login(username, password)
      onLogin(data.user)
    } catch (err) {
      setError(err.message)
      // If login fails, might need to init admin
      if (err.message.includes('Invalid credentials')) {
        setShowInitAdmin(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInitAdmin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authAPI.initAdmin(username, password)
      // Now login with the new admin credentials
      const data = await authAPI.login(username, password)
      onLogin(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Hall of Fame Nominations</h2>
        <p className="login-subtitle">Committee Portal</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={showInitAdmin ? handleInitAdmin : handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Loading...' : showInitAdmin ? 'Create Admin Account' : 'Login'}
          </button>
        </form>

        {showInitAdmin && (
          <div className="info-message">
            No admin account exists. Create one to get started.
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
