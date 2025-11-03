import { useState, useEffect, FormEvent } from "react";
import { nominationsAPI, usersAPI, authAPI } from "../utils/api";
import type { Nomination, NominationInput, User } from "../types";

type ActiveTab = "nominations" | "users";

interface NominationFormData {
  name: string;
  year: string;
  career_position: string;
  professional_achievements: string;
  professional_awards: string;
  educational_achievements: string;
  merit_awards: string;
  service_church_community: string;
  service_mbaphs: string;
  nomination_summary: string;
  nominator_name: string;
  nominator_email: string;
  nominator_phone: string;
}

interface UserFormData {
  username: string;
  password: string;
  role: "admin" | "committee";
}

function AdminPanel() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("nominations");
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [showNominationForm, setShowNominationForm] = useState(false);
  const [editingNomination, setEditingNomination] = useState<Nomination | null>(null);
  const [nominationForm, setNominationForm] = useState<NominationFormData>({
    name: "",
    year: "",
    career_position: "",
    professional_achievements: "",
    professional_awards: "",
    educational_achievements: "",
    merit_awards: "",
    service_church_community: "",
    service_mbaphs: "",
    nomination_summary: "",
    nominator_name: "",
    nominator_email: "",
    nominator_phone: "",
  });

  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState<UserFormData>({
    username: "",
    password: "",
    role: "committee",
  });

  useEffect(() => {
    if (activeTab === "nominations") {
      loadNominations();
    } else if (activeTab === "users") {
      loadUsers();
    }
  }, [activeTab]);

  const loadNominations = async () => {
    setLoading(true);
    try {
      const data = await nominationsAPI.getAll();
      setNominations(data);
    } catch (err) {
      setError("Failed to load nominations");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleNominationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const payload: NominationInput = {
        name: nominationForm.name,
        year: parseInt(nominationForm.year) || 0,
        career_position: nominationForm.career_position,
        professional_achievements: nominationForm.professional_achievements,
        professional_awards: nominationForm.professional_awards,
        educational_achievements: nominationForm.educational_achievements,
        merit_awards: nominationForm.merit_awards,
        service_church_community: nominationForm.service_church_community,
        service_mbaphs: nominationForm.service_mbaphs,
        nomination_summary: nominationForm.nomination_summary,
        nominator_name: nominationForm.nominator_name,
        nominator_email: nominationForm.nominator_email,
        nominator_phone: nominationForm.nominator_phone,
      };

      if (editingNomination) {
        await nominationsAPI.update(editingNomination.id, payload);
        setSuccess("Nomination updated successfully!");
      } else {
        await nominationsAPI.create(payload);
        setSuccess("Nomination created successfully!");
      }
      setShowNominationForm(false);
      setEditingNomination(null);
      setNominationForm({
        name: "",
        year: "",
        career_position: "",
        professional_achievements: "",
        professional_awards: "",
        educational_achievements: "",
        merit_awards: "",
        service_church_community: "",
        service_mbaphs: "",
        nomination_summary: "",
        nominator_name: "",
        nominator_email: "",
        nominator_phone: "",
      });
      loadNominations();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    }
  };

  const handleEditNomination = (nomination: Nomination) => {
    setEditingNomination(nomination);
    setNominationForm({
      name: nomination.name,
      year: nomination.year?.toString() || "",
      career_position: nomination.career_position || "",
      professional_achievements: nomination.professional_achievements || "",
      professional_awards: nomination.professional_awards || "",
      educational_achievements: nomination.educational_achievements || "",
      merit_awards: nomination.merit_awards || "",
      service_church_community: nomination.service_church_community || "",
      service_mbaphs: nomination.service_mbaphs || "",
      nomination_summary: nomination.nomination_summary || "",
      nominator_name: nomination.nominator_name || "",
      nominator_email: nomination.nominator_email || "",
      nominator_phone: nomination.nominator_phone || "",
    });
    setShowNominationForm(true);
  };

  const handleDeleteNomination = async (id: number) => {
    if (!confirm("Are you sure you want to delete this nomination?")) {
      return;
    }

    try {
      await nominationsAPI.delete(id);
      setSuccess("Nomination deleted successfully!");
      loadNominations();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    }
  };

  const handleUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await authAPI.register(userForm.username, userForm.password, userForm.role);
      setSuccess("User created successfully!");
      setShowUserForm(false);
      setUserForm({
        username: "",
        password: "",
        role: "committee",
      });
      loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await usersAPI.delete(id);
      setSuccess("User deleted successfully!");
      loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    }
  };

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === "nominations" ? "active" : ""}`}
          onClick={() => setActiveTab("nominations")}
        >
          Manage Nominations
        </button>
        <button
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Manage Users
        </button>
      </div>

      {activeTab === "nominations" && (
        <div className="tab-content">
          <div className="tab-header">
            <h2>Nominations</h2>
            <button
              onClick={() => {
                setShowNominationForm(!showNominationForm);
                setEditingNomination(null);
                setNominationForm({
                  name: "",
                  year: "",
                  career_position: "",
                  professional_achievements: "",
                  professional_awards: "",
                  educational_achievements: "",
                  merit_awards: "",
                  service_church_community: "",
                  service_mbaphs: "",
                  nomination_summary: "",
                  nominator_name: "",
                  nominator_email: "",
                  nominator_phone: "",
                });
              }}
              className="btn-primary"
            >
              {showNominationForm ? "Cancel" : "Add Nomination"}
            </button>
          </div>

          {showNominationForm && (
            <form onSubmit={handleNominationSubmit} className="admin-form">
              <h3>{editingNomination ? "Edit Nomination" : "Add New Nomination"}</h3>

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
                <label htmlFor="year">Class Year</label>
                <input
                  type="number"
                  id="year"
                  value={nominationForm.year}
                  onChange={(e) => setNominationForm({ ...nominationForm, year: e.target.value })}
                  placeholder="e.g., 1998"
                />
              </div>

              <div className="form-group">
                <label htmlFor="career_position">Career Position</label>
                <input
                  type="text"
                  id="career_position"
                  value={nominationForm.career_position}
                  onChange={(e) =>
                    setNominationForm({ ...nominationForm, career_position: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="professional_achievements">Professional Achievements</label>
                <textarea
                  id="professional_achievements"
                  value={nominationForm.professional_achievements}
                  onChange={(e) =>
                    setNominationForm({
                      ...nominationForm,
                      professional_achievements: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="nomination_summary">Nomination Summary</label>
                <textarea
                  id="nomination_summary"
                  value={nominationForm.nomination_summary}
                  onChange={(e) =>
                    setNominationForm({ ...nominationForm, nomination_summary: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <button type="submit" className="btn-primary">
                {editingNomination ? "Update Nomination" : "Create Nomination"}
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
                    {nomination.year && <span className="badge">Class of {nomination.year}</span>}
                  </div>
                  <div className="item-actions">
                    <button
                      onClick={() => handleEditNomination(nomination)}
                      className="btn-secondary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteNomination(nomination.id)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="tab-content">
          <div className="tab-header">
            <h2>Committee Members</h2>
            <button onClick={() => setShowUserForm(!showUserForm)} className="btn-primary">
              {showUserForm ? "Cancel" : "Add User"}
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
                  onChange={(e) =>
                    setUserForm({ ...userForm, role: e.target.value as "admin" | "committee" })
                  }
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
  );
}

export default AdminPanel;
