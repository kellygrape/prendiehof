import { useState, useEffect } from 'react'
import { nominationsAPI, usersAPI, authAPI } from '../utils/api'

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('nominations')
  const [nominations, setNominations] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [showNominationForm, setShowNominationForm] = useState(false)
  const [editingNomination, setEditingNomination] = useState(null)
  const [nominationForm, setNominationForm] = useState({
    name: '',
    category: '',
    description: '',
    achievements: '',
    year: '',
    additional_info: ''
  })

  const [showUserForm, setShowUserForm] = useState(false)
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'committee'
  })

  useEffect(() => {
    if (activeTab === 'nominations') {
      loadNominations()
    } else if (activeTab === 'users') {
      loadUsers()
    }
  }, [activeTab])

  const loadNominations = async () => {
    setLoading(true)
    try {
      const data = await nominationsAPI.getAll()
      setNominations(data)
    } catch (err) {
      setError('Failed to load nominations')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await usersAPI.getAll()
      setUsers(data)
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleNominationSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (editingNomination) {
        await nominationsAPI.update(editingNomination.id, nominationForm)
        setSuccess('Nomination updated successfully!')
      } else {
        await nominationsAPI.create(nominationForm)
        setSuccess('Nomination created successfully!')
      }
      setShowNominationForm(false)
      setEditingNomination(null)
      setNominationForm({
        name: '',
        category: '',
        description: '',
        achievements: '',
        year: '',
        additional_info: ''
      })
      loadNominations()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEditNomination = (nomination) => {
    setEditingNomination(nomination)
    setNominationForm({
      name: nomination.name,
      category: nomination.category || '',
      description: nomination.description || '',
      achievements: nomination.achievements || '',
      year: nomination.year || '',
      additional_info: nomination.additional_info || ''
    })
    setShowNominationForm(true)
  }

  const handleDeleteNomination = async (id) => {
    if (!confirm('Are you sure you want to delete this nomination? All votes will be lost.')) {
      return
    }

    try {
      await nominationsAPI.delete(id)
      setSuccess('Nomination deleted successfully!')
      loadNominations()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await authAPI.register(userForm.username, userForm.password, userForm.role)
      setSuccess('User created successfully!')
      setShowUserForm(false)
      setUserForm({
        username: '',
        password: '',
        role: 'committee'
      })
      loadUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      await usersAPI.delete(id)
      setSuccess('User deleted successfully!')
      loadUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'nominations' ? 'active' : ''}`}
          onClick={() => setActiveTab('nominations')}
        >
          Manage Nominations
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Manage Users
        </button>
      </div>

      {activeTab === 'nominations' && (
        <div className="tab-content">
          <div className="tab-header">
            <h2>Nominations</h2>
            <button
              onClick={() => {
                setShowNominationForm(!showNominationForm)
                setEditingNomination(null)
                setNominationForm({
                  name: '',
                  category: '',
                  description: '',
                  achievements: '',
                  year: '',
                  additional_info: ''
                })
              }}
              className="btn-primary"
            >
              {showNominationForm ? 'Cancel' : 'Add Nomination'}
            </button>
          </div>

          {showNominationForm && (
            <form onSubmit={handleNominationSubmit} className="admin-form">
              <h3>{editingNomination ? 'Edit Nomination' : 'Add New Nomination'}</h3>

              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  value={nominationForm.name}
                  onChange={(e) => setNominationForm({ ...nominationForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  value={nominationForm.category}
                  onChange={(e) => setNominationForm({ ...nominationForm, category: e.target.value })}
                  placeholder="e.g., Sports, Arts, Community Service"
                />
              </div>

              <div className="form-group">
                <label htmlFor="year">Year</label>
                <input
                  type="number"
                  id="year"
                  value={nominationForm.year}
                  onChange={(e) => setNominationForm({ ...nominationForm, year: e.target.value })}
                  placeholder="e.g., 2024"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={nominationForm.description}
                  onChange={(e) => setNominationForm({ ...nominationForm, description: e.target.value })}
                  rows="4"
                  placeholder="Brief description of the nominee..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="achievements">Achievements</label>
                <textarea
                  id="achievements"
                  value={nominationForm.achievements}
                  onChange={(e) => setNominationForm({ ...nominationForm, achievements: e.target.value })}
                  rows="4"
                  placeholder="List of achievements and accomplishments..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="additional_info">Additional Information</label>
                <textarea
                  id="additional_info"
                  value={nominationForm.additional_info}
                  onChange={(e) => setNominationForm({ ...nominationForm, additional_info: e.target.value })}
                  rows="3"
                  placeholder="Any other relevant information..."
                />
              </div>

              <button type="submit" className="btn-primary">
                {editingNomination ? 'Update Nomination' : 'Create Nomination'}
              </button>
            </form>
          )}

          <div className="admin-list">
            {loading ? (
              <p>Loading...</p>
            ) : nominations.length === 0 ? (
              <p>No nominations yet.</p>
            ) : (
              nominations.map((nomination) => (
                <div key={nomination.id} className="admin-list-item">
                  <div className="item-info">
                    <h3>{nomination.name}</h3>
                    {nomination.category && <span className="badge">{nomination.category}</span>}
                    <p className="meta">
                      Votes: {nomination.yes_votes} Yes, {nomination.no_votes} No, {nomination.abstain_votes} Abstain
                    </p>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => handleEditNomination(nomination)} className="btn-secondary">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteNomination(nomination.id)} className="btn-danger">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="tab-content">
          <div className="tab-header">
            <h2>Committee Members</h2>
            <button
              onClick={() => setShowUserForm(!showUserForm)}
              className="btn-primary"
            >
              {showUserForm ? 'Cancel' : 'Add User'}
            </button>
          </div>

          {showUserForm && (
            <form onSubmit={handleUserSubmit} className="admin-form">
              <h3>Add New User</h3>

              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  required
                >
                  <option value="committee">Committee Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button type="submit" className="btn-primary">
                Create User
              </button>
            </form>
          )}

          <div className="admin-list">
            {loading ? (
              <p>Loading...</p>
            ) : users.length === 0 ? (
              <p>No users yet.</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="admin-list-item">
                  <div className="item-info">
                    <h3>{user.username}</h3>
                    <span className={`badge ${user.role}`}>{user.role}</span>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => handleDeleteUser(user.id)} className="btn-danger">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
