import { Puzzle } from "@/types";

const LAUNCH_DATE = process.env.NEXT_PUBLIC_LAUNCH_DATE ?? "2026-03-16";

export function getPuzzleIndex(offset = 0): number {
  const launch = new Date(LAUNCH_DATE).getTime();
  const now = new Date();
  const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.floor((utcNow - launch) / 86400000);
  return ((Math.max(0, days) - offset) % 100 + 100) % 100;
}

export async function getDailyPuzzle(offset = 0): Promise<Puzzle> {
  const res = await fetch("/puzzles-client.json");
  const puzzles: Puzzle[] = await res.json();
  return { ...puzzles[getPuzzleIndex(offset)], gridSize: 4 };
}

export async function getDailyPuzzle3x3(offset = 0): Promise<Puzzle> {
  const res = await fetch("/puzzles-3x3.json");
  const puzzles: Puzzle[] = await res.json();
  return { ...puzzles[getPuzzleIndex(offset)], gridSize: 3 };
}

export async function getDailyPuzzle5x5(offset = 0): Promise<Puzzle> {
  try {
    const res = await fetch("/puzzles-5x5.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const puzzles: Puzzle[] = await res.json();
    return { ...puzzles[getPuzzleIndex(offset)], gridSize: 5 };
  } catch (err) {
    console.error("Failed to load 5x5 puzzles:", err);
    throw new Error(
      "5×5 puzzles not generated yet. Run: node scripts/generate-puzzles-5x5.js"
    );
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}
