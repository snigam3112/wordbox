"use client";

import { useState, useEffect } from "react";
import { ScoreEntry } from "@/types";
import { getTodayDateString } from "@/lib/puzzles";

export function useLeaderboard(mode = "4x4") {
  const [dailyEntries, setDailyEntries] = useState<ScoreEntry[]>([]);
  const [weeklyEntries, setWeeklyEntries] = useState<ScoreEntry[]>([]);
  const [alltimeEntries, setAlltimeEntries] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function fetchScores() {
    setLoading(true);
    try {
      const date = getTodayDateString();
      const [daily, weekly, alltime] = await Promise.all([
        fetch(`/api/scores?period=daily&date=${date}&mode=${mode}`).then((r) => r.json()),
        fetch(`/api/scores?period=weekly&mode=${mode}`).then((r) => r.json()),
        fetch(`/api/scores?period=alltime&mode=${mode}`).then((r) => r.json()),
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
    setSubmitError(null);
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzle_date: date, username, score, elapsed_sec, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data?.error ?? "Submission failed. Try again.");
        return;
      }
      setSubmitted(true);
      await fetchScores();
    } catch {
      setSubmitError("Network error. Check your connection and try again.");
    }
  }

  useEffect(() => {
    fetchScores();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    dailyEntries,
    weeklyEntries,
    alltimeEntries,
    loading,
    submitted,
    submitError,
    submitScore,
    fetchScores,
  };
}
