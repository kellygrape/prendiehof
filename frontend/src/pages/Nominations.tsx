import { useState, useEffect } from "react";
import { nominationsAPI } from "../utils/api";
import type { User, Nomination } from "../types";

interface NominationsProps {
  user: User;
}

function Nominations({ user }: NominationsProps) {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNominations();
  }, []);

  const loadNominations = async () => {
    try {
      const data = await nominationsAPI.getAll();
      setNominations(data);
    } catch (err) {
      console.error("Failed to load nominations:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading nominations...</div>;
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
          {user.role === "admin" && (
            <a href="/admin" className="btn-primary">
              Add Nominations
            </a>
          )}
        </div>
      ) : (
        <div className="nominations-grid">
          {nominations.map((nomination) => (
            <div key={nomination.id} className="nomination-card">
              <h3>
                <a href={`/nominations/${nomination.id}`}>{nomination.name}</a>
              </h3>
              {nomination.year && <p className="year">Year: {nomination.year}</p>}
              <a href={`/nominations/${nomination.id}`} className="btn-primary">
                View Details
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Nominations;
