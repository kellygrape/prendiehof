import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { nominationsAPI, votesAPI } from '../utils/api'

function NominationDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [nomination, setNomination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [selectedVote, setSelectedVote] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadNomination()
  }, [id])

  const loadNomination = async () => {
    try {
      const data = await nominationsAPI.getById(id)
      setNomination(data)
      if (data.userVote) {
        setSelectedVote(data.userVote.vote)
        setComment(data.userVote.comment || '')
      }
    } catch (err) {
      setError('Failed to load nomination')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (e) => {
    e.preventDefault()
    if (!selectedVote) {
      setError('Please select a vote')
      return
    }

    setVoting(true)
    setError('')
    setSuccess('')

    try {
      await votesAPI.submit(id, selectedVote, comment)
      setSuccess('Vote recorded successfully!')
      // Reload to get updated vote counts
      await loadNomination()
    } catch (err) {
      setError(err.message)
    } finally {
      setVoting(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading nomination...</div>
  }

  if (!nomination) {
    return <div className="error-message">Nomination not found</div>
  }

  return (
    <div className="nomination-detail">
      <button onClick={() => navigate('/nominations')} className="btn-back">
        ← Back to Nominations
      </button>

      <div className="nomination-header">
        <h1>{nomination.name}</h1>
        {nomination.category && <div className="badge large">{nomination.category}</div>}
        {nomination.year && <p className="year">Year: {nomination.year}</p>}
      </div>

      <div className="nomination-content">
        {nomination.description && (
          <div className="section">
            <h2>Description</h2>
            <p>{nomination.description}</p>
          </div>
        )}

        {nomination.achievements && (
          <div className="section">
            <h2>Achievements</h2>
            <p className="achievements">{nomination.achievements}</p>
          </div>
        )}

        {nomination.additional_info && (
          <div className="section">
            <h2>Additional Information</h2>
            <p>{nomination.additional_info}</p>
          </div>
        )}
      </div>

      <div className="voting-section">
        <h2>Your Vote</h2>
        {nomination.userVote && (
          <p className="info-message">
            You have already voted. You can change your vote below.
          </p>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleVote} className="vote-form">
          <div className="vote-options">
            <label className={`vote-option ${selectedVote === 'yes' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="vote"
                value="yes"
                checked={selectedVote === 'yes'}
                onChange={(e) => setSelectedVote(e.target.value)}
              />
              <span className="vote-label yes">Yes - Support</span>
            </label>

            <label className={`vote-option ${selectedVote === 'no' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="vote"
                value="no"
                checked={selectedVote === 'no'}
                onChange={(e) => setSelectedVote(e.target.value)}
              />
              <span className="vote-label no">No - Do Not Support</span>
            </label>

            <label className={`vote-option ${selectedVote === 'abstain' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="vote"
                value="abstain"
                checked={selectedVote === 'abstain'}
                onChange={(e) => setSelectedVote(e.target.value)}
              />
              <span className="vote-label abstain">Abstain</span>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="comment">Comment (optional)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              placeholder="Add any comments about your vote..."
            />
          </div>

          <button type="submit" className="btn-primary" disabled={voting || !selectedVote}>
            {voting ? 'Submitting...' : nomination.userVote ? 'Update Vote' : 'Submit Vote'}
          </button>
        </form>
      </div>

      <div className="vote-summary-detail">
        <h2>Current Vote Tally</h2>
        <div className="vote-stats">
          <div className="vote-stat yes">
            <span className="count">{nomination.yes_votes}</span>
            <span className="label">Yes</span>
          </div>
          <div className="vote-stat no">
            <span className="count">{nomination.no_votes}</span>
            <span className="label">No</span>
          </div>
          <div className="vote-stat abstain">
            <span className="count">{nomination.abstain_votes}</span>
            <span className="label">Abstain</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NominationDetail
