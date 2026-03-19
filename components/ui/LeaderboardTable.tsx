"use client";

import { useState } from "react";
import { ScoreEntry } from "@/types";
import { formatTime } from "@/lib/scoring";

interface Props {
  dailyEntries: ScoreEntry[];
  weeklyEntries: ScoreEntry[];
  alltimeEntries: ScoreEntry[];
  currentUsername: string | null;
}

type Period = "daily" | "weekly" | "alltime";

const LABELS: Record<Period, string> = {
  daily: "Today",
  weekly: "This Week",
  alltime: "All Time",
};

export default function LeaderboardTable({
  dailyEntries,
  weeklyEntries,
  alltimeEntries,
  currentUsername,
}: Props) {
  const [period, setPeriod] = useState<Period>("daily");

  const entries =
    period === "daily"
      ? dailyEntries
      : period === "weekly"
      ? weeklyEntries
      : alltimeEntries;

  return (
    <div className="leaderboard-wrapper">
      <div className="leaderboard-tabs">
        {(["daily", "weekly", "alltime"] as Period[]).map((p) => (
          <button
            key={p}
            className={`leaderboard-tab${period === p ? " leaderboard-tab--active" : ""}`}
            onClick={() => setPeriod(p)}
          >
            {LABELS[p]}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="leaderboard__empty">No scores yet. Be first!</p>
      ) : (
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
                className={e.username === currentUsername ? "leaderboard__row--you" : ""}
              >
                <td>{i + 1}</td>
                <td>{e.username}</td>
                <td>{e.score}</td>
                <td>{formatTime(e.elapsed_sec)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
