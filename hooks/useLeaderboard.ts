"use client";

import { useState, useEffect } from "react";
import { ScoreEntry } from "@/types";
import { getTodayDateString } from "@/lib/puzzles";

export function useLeaderboard() {
  const [dailyEntries, setDailyEntries] = useState<ScoreEntry[]>([]);
  const [weeklyEntries, setWeeklyEntries] = useState<ScoreEntry[]>([]);
  const [alltimeEntries, setAlltimeEntries] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function fetchScores() {
    setLoading(true);
    try {
      const date = getTodayDateString();
      const [daily, weekly, alltime] = await Promise.all([
        fetch(`/api/scores?period=daily&date=${date}`).then((r) => r.json()),
        fetch(`/api/scores?period=weekly`).then((r) => r.json()),
        fetch(`/api/scores?period=alltime`).then((r) => r.json()),
      ]);
      setDailyEntries(Array.isArray(daily) ? daily : []);
      setWeeklyEntries(Array.isArray(weekly) ? weekly : []);
      setAlltimeEntries(Array.isArray(alltime) ? alltime : []);
    } finally {
      setLoading(false);
    }
  }

  async function submitScore(username: string, score: number, elapsed_sec: number) {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { dailyEntries, weeklyEntries, alltimeEntries, loading, submitted, submitScore, fetchScores };
}
