"use client";

import { ScoreEntry } from "@/types";
import { formatTime } from "@/lib/scoring";

interface Props {
  entries: ScoreEntry[];
  currentUsername: string | null;
}

export default function LeaderboardTable({
  entries,
  currentUsername,
}: Props) {
  if (entries.length === 0) {
    return <p className="leaderboard__empty">No scores yet today. Be first!</p>;
  }

  return (
    <table className="leaderboard">
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Score</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr
            key={i}
            className={
              e.username === currentUsername ? "leaderboard__row--you" : ""
            }
          >
            <td>{i + 1}</td>
            <td>{e.username}</td>
            <td>{e.score}</td>
            <td>{formatTime(e.elapsed_sec)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
