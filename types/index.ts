export interface HintCell {
  row: number;
  col: number;
  letter: string;
}

export interface Puzzle {
  id: number;
  letters: string[]; // 14 letters (16 minus 2 pre-filled hints)
  hints: HintCell[]; // 2 pre-filled locked cells
}

export interface TileState {
  id: string;
  char: string;
  placed: boolean;
  locked: boolean; // true = hint tile, stays in grid, not in tray
}

export type Grid = (string | null)[][];

export interface ValidationResult {
  validRows: boolean[];
  validCols: boolean[];
  isComplete: boolean;
  isWin: boolean;
}

export interface ScoreEntry {
  rank: number;
  username: string;
  score: number;
  elapsed_sec: number;
}

export type GameStatus = "idle" | "playing" | "won";

export interface DragData {
  tileId: string;
  tileChar: string;
  sourceType: "tray" | "cell";
  sourceRow?: number;
  sourceCol?: number;
}
