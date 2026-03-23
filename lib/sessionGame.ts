import { HintCell, TileState } from "@/types";

export interface SessionData {
  puzzleDate: string;
  grid: (string | null)[][];
  tiles: TileState[];
  lockedCells: string[]; // serialised Set<string>
  cellToTile: Record<string, string>;
  hints: HintCell[];
  hintsRemaining: number;
  hintsUsed: number;
  elapsed: number;
  gridSize: number;
}

function sessionKey(mode: string) {
  return `wordbox_session_${mode}`;
}

export function saveSession(mode: string, data: SessionData): void {
  try {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(sessionKey(mode), JSON.stringify(data));
  } catch {
    // sessionStorage unavailable (private browsing, quota exceeded, etc.)
  }
}

export function loadSession(mode: string, todayDate: string): SessionData | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(sessionKey(mode));
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionData;
    // Invalidate if the stored session is from a different day
    if (data.puzzleDate !== todayDate) return null;
    return data;
  } catch {
    return null;
  }
}
