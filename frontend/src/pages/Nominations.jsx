import { useState, useEffect } from 'react'
import { nominationsAPI } from '../utils/api'

function Nominations({ user }) {
  const [nominations, setNominations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, voted, unvoted

  useEffect(() => {
    loadNominations()
  }, [])

  const loadNominations = async () => {
    try {
      const data = await nominationsAPI.getAll()
      setNominations(data)
    } catch (err) {
      console.error('Failed to load nominations:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading nominations...</div>
  }

  return (
    <div className="nominations-page">
      <div className="page-header">
        <h1>All Nominations</h1>
        <p>{nominations.length} total nominations</p>
      </div>

      {nominations.length === 0 ? (
        <div className="empty-state">
          <p>No nominations yet.</p>
          {user.role === 'admin' && (
            <a href="/admin" className="btn-primary">Add Nominations</a>
          )}
        </div>
      ) : (
        <div className="nominations-grid">
          {nominations.map((nomination) => (
            <div key={nomination.id} className="nomination-card">
              <h3>
                <a href={`/nominations/${nomination.id}`}>{nomination.name}</a>
              </h3>
              {nomination.category && (
                <div className="badge">{nomination.category}</div>
              )}
              {nomination.year && (
                <p className="year">Year: {nomination.year}</p>
              )}
              {nomination.description && (
                <p className="description">{nomination.description.substring(0, 150)}...</p>
              )}
              <div className="vote-summary">
                <span className="vote-count yes">{nomination.yes_votes} Yes</span>
                <span className="vote-count no">{nomination.no_votes} No</span>
                <span className="vote-count abstain">{nomination.abstain_votes} Abstain</span>
              </div>
              <a href={`/nominations/${nomination.id}`} className="btn-primary">
                View & Vote
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Nominations
