import { useState, useEffect } from 'react'
import { votesAPI } from '../utils/api'

function Results({ user }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('votes') // votes, name

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      const data = await votesAPI.getResults()
      setResults(data)
    } catch (err) {
      console.error('Failed to load results:', err)
    } finally {
      setLoading(false)
    }
  }

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'votes') {
      // Sort by yes votes descending
      return b.yes_votes - a.yes_votes
    } else {
      // Sort by name alphabetically
      return a.name.localeCompare(b.name)
    }
  })

  const getVotePercentage = (votes, total) => {
    if (total === 0) return 0
    return Math.round((votes / total) * 100)
  }

  if (loading) {
    return <div className="loading">Loading results...</div>
  }

  return (
    <div className="results-page">
      <div className="page-header">
        <h1>Voting Results</h1>
        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="votes">Most Votes</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="empty-state">
          <p>No results yet. Start voting on nominations!</p>
        </div>
      ) : (
        <div className="results-list">
          {sortedResults.map((result, index) => {
            const totalVotes = result.total_votes
            const yesPercent = getVotePercentage(result.yes_votes, totalVotes)
            const noPercent = getVotePercentage(result.no_votes, totalVotes)
            const abstainPercent = getVotePercentage(result.abstain_votes, totalVotes)
            const participationPercent = result.total_committee_members > 0
              ? Math.round((totalVotes / result.total_committee_members) * 100)
              : 0

            return (
              <div key={result.id} className="result-card">
                <div className="result-header">
                  <div className="result-rank">{index + 1}</div>
                  <div className="result-info">
                    <h3>{result.name}</h3>
                    {result.category && <span className="badge">{result.category}</span>}
                  </div>
                </div>

                <div className="result-stats">
                  <div className="stat-row">
                    <span className="stat-label">Participation:</span>
                    <span className="stat-value">
                      {totalVotes} of {result.total_committee_members} members ({participationPercent}%)
                    </span>
                  </div>
                </div>

                <div className="vote-breakdown">
                  <div className="vote-bar">
                    <div className="bar-segment yes" style={{ width: `${yesPercent}%` }}></div>
                    <div className="bar-segment no" style={{ width: `${noPercent}%` }}></div>
                    <div className="bar-segment abstain" style={{ width: `${abstainPercent}%` }}></div>
                  </div>

                  <div className="vote-details">
                    <div className="vote-detail yes">
                      <span className="count">{result.yes_votes}</span>
                      <span className="label">Yes ({yesPercent}%)</span>
                    </div>
                    <div className="vote-detail no">
                      <span className="count">{result.no_votes}</span>
                      <span className="label">No ({noPercent}%)</span>
                    </div>
                    <div className="vote-detail abstain">
                      <span className="count">{result.abstain_votes}</span>
                      <span className="label">Abstain ({abstainPercent}%)</span>
                    </div>
                  </div>
                </div>

                <a href={`/nominations/${result.id}`} className="btn-secondary">
                  View Details
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Results
