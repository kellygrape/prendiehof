import { useState, useEffect } from 'react'
import { peopleAPI, ballotAPI } from '../utils/api'

function Ballot({ user }) {
  const [people, setPeople] = useState([])
  const [selectedPeople, setSelectedPeople] = useState(new Set())
  const [viewingNominations, setViewingNominations] = useState(null)
  const [nominations, setNominations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loadingNominations, setLoadingNominations] = useState(false)

  const MAX_SELECTIONS = 8

  useEffect(() => {
    loadBallotData()
  }, [])

  const loadBallotData = async () => {
    try {
      const [peopleData, selectionsData] = await Promise.all([
        peopleAPI.getAll(),
        ballotAPI.getMySelections()
      ])

      setPeople(peopleData)

      // Convert selections to Set for easier checking
      const selected = new Set(
        selectionsData.map(s => `${s.person_name}|${s.person_year}`)
      )
      setSelectedPeople(selected)
    } catch (err) {
      setError('Failed to load ballot data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSelection = (person) => {
    const key = `${person.name}|${person.year}`
    const newSelected = new Set(selectedPeople)

    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      if (newSelected.size >= MAX_SELECTIONS) {
        setError(`You can only select up to ${MAX_SELECTIONS} people`)
        setTimeout(() => setError(''), 3000)
        return
      }
      newSelected.add(key)
    }

    setSelectedPeople(newSelected)
    setSuccess('') // Clear success message when making changes
  }

  const handleViewNominations = async (person) => {
    setLoadingNominations(true)
    setViewingNominations(person)
    try {
      const noms = await peopleAPI.getNominations(person.name, person.year)
      setNominations(noms)
    } catch (err) {
      setError('Failed to load nominations')
      console.error(err)
    } finally {
      setLoadingNominations(false)
    }
  }

  const handleSubmitBallot = async () => {
    if (selectedPeople.size === 0) {
      setError('Please select at least one person')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Convert Set back to array of objects
      const selections = Array.from(selectedPeople).map(key => {
        const [person_name, person_year] = key.split('|')
        return { person_name, person_year }
      })

      await ballotAPI.saveSelections(selections)
      setSuccess(`Ballot saved! You selected ${selections.length} of ${MAX_SELECTIONS} people.`)
    } catch (err) {
      setError(err.message || 'Failed to save ballot')
    } finally {
      setSaving(false)
    }
  }

  const isSelected = (person) => {
    return selectedPeople.has(`${person.name}|${person.year}`)
  }

  if (loading) {
    return <div className="loading">Loading ballot...</div>
  }

  return (
    <div className="ballot-page">
      <div className="ballot-header">
        <div>
          <h1>Your Ballot</h1>
          <p className="ballot-instructions">
            Select up to {MAX_SELECTIONS} people to induct into the Hall of Fame.
            You can read their nominations before deciding.
          </p>
        </div>
        <div className="ballot-counter">
          <span className="counter-number">{selectedPeople.size}</span>
          <span className="counter-label">of {MAX_SELECTIONS} selected</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="ballot-actions">
        <button
          onClick={handleSubmitBallot}
          disabled={saving || selectedPeople.size === 0}
          className="btn-primary btn-large"
        >
          {saving ? 'Saving...' : 'Submit Ballot'}
        </button>
      </div>

      <div className="ballot-container">
        <div className="ballot-list">
          {people.map((person) => (
            <div
              key={`${person.name}|${person.year}`}
              className={`ballot-item ${isSelected(person) ? 'selected' : ''}`}
            >
              <label className="ballot-checkbox-label">
                <input
                  type="checkbox"
                  checked={isSelected(person)}
                  onChange={() => handleToggleSelection(person)}
                  className="ballot-checkbox"
                />
                <div className="ballot-person-info">
                  <h3>{person.name}</h3>
                  <p className="person-year">Class of {person.year}</p>
                  <p className="nomination-count">
                    {person.nomination_count} nomination{person.nomination_count > 1 ? 's' : ''}
                  </p>
                </div>
              </label>
              <button
                onClick={() => handleViewNominations(person)}
                className="btn-secondary btn-view-nominations"
              >
                View Nomination{person.nomination_count > 1 ? 's' : ''}
              </button>
            </div>
          ))}
        </div>

        {/* Side Panel for Viewing Nominations */}
        {viewingNominations && (
          <div className="nominations-panel-overlay" onClick={() => setViewingNominations(null)}>
            <div className="nominations-panel" onClick={(e) => e.stopPropagation()}>
              <div className="panel-header">
                <div>
                  <h2>{viewingNominations.name}</h2>
                  <p className="panel-subtitle">
                    Class of {viewingNominations.year} • {viewingNominations.nomination_count} nomination{viewingNominations.nomination_count > 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setViewingNominations(null)}
                  className="panel-close"
                >
                  ×
                </button>
              </div>

              <div className="panel-content">
                {loadingNominations ? (
                  <div className="loading">Loading nominations...</div>
                ) : (
                  nominations.map((nom, index) => (
                    <div key={nom.id} className="nomination-detail">
                      <h3>Nomination {index + 1}</h3>

                      {nom.description && (
                        <div className="nom-section">
                          <h4>Summary</h4>
                          <p>{nom.description}</p>
                        </div>
                      )}

                      {nom.achievements && (
                        <div className="nom-section">
                          <h4>Achievements</h4>
                          <p className="whitespace-pre-wrap">{nom.achievements}</p>
                        </div>
                      )}

                      {nom.additional_info && (
                        <div className="nom-section">
                          <h4>Additional Information</h4>
                          <p className="whitespace-pre-wrap">{nom.additional_info}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Ballot
