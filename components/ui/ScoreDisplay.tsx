"use client";

import { calculateScore } from "@/lib/scoring";

export default function ScoreDisplay({ elapsed }: { elapsed: number }) {
  const score = calculateScore(elapsed);
  return <span className="score">{score} pts</span>;
}
