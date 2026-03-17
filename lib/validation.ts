import { Grid, ValidationResult } from "@/types";

export function validateGrid(
  grid: Grid,
  wordSet: Set<string>
): ValidationResult {
  const rows = grid.map((r) => r.join("").toLowerCase());
  const cols = [0, 1, 2, 3].map((c) =>
    grid.map((r) => r[c] ?? "").join("").toLowerCase()
  );

  const validRows = rows.map((w) => w.length === 4 && wordSet.has(w));
  const validCols = cols.map((w) => w.length === 4 && wordSet.has(w));

  const isComplete =
    grid.every((row) => row.every((cell) => cell !== null)) &&
    rows.every((w) => w.length === 4) &&
    cols.every((w) => w.length === 4);

  if (!isComplete) {
    return { validRows, validCols, isComplete: false, isWin: false };
  }

  const allValid =
    validRows.every(Boolean) && validCols.every(Boolean);
  const allDistinct = new Set([...rows, ...cols]).size === 8;
  const isWin = allValid && allDistinct;

  return { validRows, validCols, isComplete, isWin };
}
