import { useState, useEffect } from "react";
import { resultsAPI } from "../utils/api";
import type { User, ResultPerson } from "../types";

interface ResultsProps {
  user: User;
}

function Results({ user }: ResultsProps) {
  const [results, setResults] = useState<ResultPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"selections" | "name">("selections");

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const data = await resultsAPI.get();
      setResults(data);
    } catch (err) {
      console.error("Failed to load results:", err);
    } finally {
      setLoading(false);
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "selections") {
      // Sort by selection count descending
      return b.selection_count - a.selection_count;
    } else {
      // Sort by name alphabetically
      return a.name.localeCompare(b.name);
    }
  });

  const getPercentage = (count: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  return (
    <div className="results-page">
      <div className="page-header">
        <h1>Voting Results</h1>
        <div className="sort-controls">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "selections" | "name")}
          >
            <option value="selections">Most Selections</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="empty-state">
          <p>No results yet. Committee members need to submit their ballots!</p>
        </div>
      ) : (
        <div className="results-list">
          {sortedResults.map((result, index) => {
            const selectionPercent = getPercentage(result.selection_count, result.total_committee);
            const isTopEight = index < 8;

            return (
              <div
                key={`${result.name}|${result.year}`}
                className={`result-card ${isTopEight ? "top-eight" : ""}`}
              >
                <div className="result-header">
                  <div className={`result-rank ${isTopEight ? "top-rank" : ""}`}>{index + 1}</div>
                  <div className="result-info">
                    <h3>{result.name}</h3>
                    <p className="person-year">Class of {result.year}</p>
                  </div>
                </div>

                <div className="result-stats">
                  <div className="stat-row">
                    <span className="stat-label">Committee Selections:</span>
                    <span className="stat-value">
                      {result.selection_count} of {result.total_committee} members (
                      {selectionPercent}%)
                    </span>
                  </div>
                </div>

                <div className="selection-bar-container">
                  <div className="selection-bar">
                    <div
                      className="selection-bar-fill"
                      style={{ width: `${selectionPercent}%` }}
                    ></div>
                  </div>
                  <div className="selection-count-large">
                    {result.selection_count}{" "}
                    {result.selection_count === 1 ? "selection" : "selections"}
                  </div>
                </div>

                {isTopEight && <div className="top-eight-badge">Top 8</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Results;
