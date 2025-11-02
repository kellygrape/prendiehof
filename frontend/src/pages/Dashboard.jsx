import { useState, useEffect } from 'react'
import { statsAPI, nominationsAPI } from '../utils/api'

function Dashboard({ user }) {
  const [stats, setStats] = useState(null)
  const [recentNominations, setRecentNominations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [statsData, nominationsData] = await Promise.all([
        statsAPI.get(),
        nominationsAPI.getAll()
      ])
      setStats(statsData)
      setRecentNominations(nominationsData.slice(0, 5))
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div className="dashboard">
      <h1>Welcome, {user.username}!</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Nominations</h3>
          <p className="stat-number">{stats?.totalNominations || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Committee Members</h3>
          <p className="stat-number">{stats?.totalCommitteeMembers || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Your Votes</h3>
          <p className="stat-number">{stats?.myVotesCount || 0}</p>
        </div>
      </div>

      <div className="recent-section">
        <h2>Recent Nominations</h2>
        {recentNominations.length === 0 ? (
          <p>No nominations yet.</p>
        ) : (
          <div className="nominations-list">
            {recentNominations.map((nomination) => (
              <div key={nomination.id} className="nomination-card">
                <h3>
                  <a href={`/nominations/${nomination.id}`}>{nomination.name}</a>
                </h3>
                {nomination.category && <p className="category">{nomination.category}</p>}
                <div className="vote-summary">
                  <span className="vote-count yes">{nomination.yes_votes} Yes</span>
                  <span className="vote-count no">{nomination.no_votes} No</span>
                  <span className="vote-count abstain">{nomination.abstain_votes} Abstain</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <a href="/nominations" className="btn-primary">View All Nominations</a>
        <a href="/results" className="btn-secondary">View Results</a>
        {user.role === 'admin' && (
          <a href="/admin" className="btn-secondary">Admin Panel</a>
        )}
      </div>
    </div>
  )
}

export default Dashboard
