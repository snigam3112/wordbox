"use client";

import { formatTime } from "@/lib/scoring";

export default function Timer({ elapsed }: { elapsed: number }) {
  return <span className="timer">{formatTime(elapsed)}</span>;
}
