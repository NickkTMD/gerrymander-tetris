import { useState, useEffect } from 'react';
import { getLeaderboard } from '../leaderboard';
import type { LeaderboardEntry } from '../leaderboard';

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    getLeaderboard().then(setEntries);
  }, []);

  return (
    <div className="leaderboard-page">
      <h1>Leaderboard</h1>
      {entries.length === 0 ? (
        <p className="leaderboard-empty">No scores yet</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>
                  <span className="leaderboard-name">{entry.name}</span>
                  <span className="leaderboard-date">{entry.date}</span>
                </td>
                <td>{entry.score.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
