import { useState, useEffect } from "react";
import { statsAPI, resultsAPI } from "../utils/api";
import type { User, Stats, ResultPerson } from "../types";

interface DashboardProps {
  user: User;
}

function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topPeople, setTopPeople] = useState<ResultPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, resultsData] = await Promise.all([statsAPI.get(), resultsAPI.get()]);
      setStats(statsData);
      setTopPeople(resultsData.slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const hasSubmittedBallot = (stats?.mySelections || 0) > 0;

  return (
    <div className="dashboard">
      <h1>Welcome, {user.username}!</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Nominees</h3>
          <p className="stat-number">{stats?.totalPeople || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Nominations</h3>
          <p className="stat-number">{stats?.totalNominations || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Your Ballot</h3>
          <p className="stat-number">{stats?.mySelections || 0} / 8</p>
        </div>
      </div>

      {!hasSubmittedBallot && (
        <div className="info-message" style={{ marginBottom: "2rem" }}>
          You haven't submitted your ballot yet. Select up to 8 people to induct into the Hall of
          Fame!
        </div>
      )}

      <div className="recent-section">
        <h2>Current Top 5</h2>
        {topPeople.length === 0 ? (
          <p>No votes yet.</p>
        ) : (
          <div className="nominations-list">
            {topPeople.map((person, index) => (
              <div key={`${person.name}|${person.year}`} className="nomination-card">
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div className="rank-badge">{index + 1}</div>
                  <div>
                    <h3>{person.name}</h3>
                    <p className="category">Class of {person.year}</p>
                    <div className="vote-summary">
                      <span className="vote-count yes">{person.selection_count} selections</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <a href="/ballot" className="btn-primary">
          {hasSubmittedBallot ? "Update My Ballot" : "Submit My Ballot"}
        </a>
        <a href="/results" className="btn-secondary">
          View Full Results
        </a>
        {user.role === "admin" && (
          <a href="/admin" className="btn-secondary">
            Admin Panel
          </a>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
