import { useState, useEffect, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { nominationsAPI } from "../utils/api";
import type { User, Nomination } from "../types";

interface NominationDetailProps {
  user: User;
}

function NominationDetail({ user }: NominationDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [nomination, setNomination] = useState<Nomination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNomination();
  }, [id]);

  const loadNomination = async () => {
    if (!id) return;

    try {
      const data = await nominationsAPI.getById(parseInt(id));
      setNomination(data);
    } catch (err) {
      setError("Failed to load nomination");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading nomination...</div>;
  }

  if (!nomination) {
    return <div className="error-message">Nomination not found</div>;
  }

  return (
    <div className="nomination-detail">
      <button onClick={() => navigate(-1)} className="btn-back">
        ← Back
      </button>

      <div className="nomination-header">
        <h1>{nomination.name}</h1>
        {nomination.year && <p className="year">Class of {nomination.year}</p>}
      </div>

      <div className="nomination-content">
        {nomination.career_position && (
          <div className="section">
            <h2>Career Position</h2>
            <p>{nomination.career_position}</p>
          </div>
        )}

        {nomination.professional_achievements && (
          <div className="section">
            <h2>Professional Achievements</h2>
            <p>{nomination.professional_achievements}</p>
          </div>
        )}

        {nomination.professional_awards && (
          <div className="section">
            <h2>Professional Awards</h2>
            <p>{nomination.professional_awards}</p>
          </div>
        )}

        {nomination.educational_achievements && (
          <div className="section">
            <h2>Educational Achievements</h2>
            <p>{nomination.educational_achievements}</p>
          </div>
        )}

        {nomination.merit_awards && (
          <div className="section">
            <h2>Merit Awards</h2>
            <p>{nomination.merit_awards}</p>
          </div>
        )}

        {nomination.service_church_community && (
          <div className="section">
            <h2>Service to Church/Community</h2>
            <p>{nomination.service_church_community}</p>
          </div>
        )}

        {nomination.service_mbaphs && (
          <div className="section">
            <h2>Service to MBAPHS</h2>
            <p>{nomination.service_mbaphs}</p>
          </div>
        )}

        {nomination.nomination_summary && (
          <div className="section">
            <h2>Nomination Summary</h2>
            <p>{nomination.nomination_summary}</p>
          </div>
        )}

        {nomination.nominator_name && (
          <div className="section">
            <h3>Nominated By</h3>
            <p>{nomination.nominator_name}</p>
            {nomination.nominator_email && <p>Email: {nomination.nominator_email}</p>}
            {nomination.nominator_phone && <p>Phone: {nomination.nominator_phone}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default NominationDetail;
