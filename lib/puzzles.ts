import { Puzzle } from "@/types";

const LAUNCH_DATE = process.env.NEXT_PUBLIC_LAUNCH_DATE ?? "2026-03-16";

export function getPuzzleIndex(): number {
  const launch = new Date(LAUNCH_DATE).getTime();
  const now = new Date();
  const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.floor((utcNow - launch) / 86400000);
  return Math.max(0, days) % 100;
}

export async function getDailyPuzzle(): Promise<Puzzle> {
  const res = await fetch("/puzzles-client.json");
  const puzzles: Puzzle[] = await res.json();
  return { ...puzzles[getPuzzleIndex()], gridSize: 4 };
}

export async function getDailyPuzzle3x3(): Promise<Puzzle> {
  const res = await fetch("/puzzles-3x3.json");
  const puzzles: Puzzle[] = await res.json();
  return { ...puzzles[getPuzzleIndex()], gridSize: 3 };
}

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}
