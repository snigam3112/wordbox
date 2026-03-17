"use client";

import { useState, useEffect } from "react";
import { ScoreEntry } from "@/types";
import { getTodayDateString } from "@/lib/puzzles";

export function useLeaderboard() {
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function fetchScores() {
    setLoading(true);
    try {
      const date = getTodayDateString();
      const res = await fetch(`/api/scores?date=${date}`);
      const data = await res.json();
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }

  async function submitScore(
    username: string,
    score: number,
    elapsed_sec: number
  ) {
    const date = getTodayDateString();
    await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzle_date: date, username, score, elapsed_sec }),
    });
    setSubmitted(true);
    await fetchScores();
  }

  useEffect(() => {
    fetchScores();
  }, []);

  return { entries, loading, submitted, submitScore, fetchScores };
}
