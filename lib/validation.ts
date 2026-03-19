import { Grid, ValidationResult } from "@/types";

export function validateGrid(
  grid: Grid,
  wordSet: Set<string>
): ValidationResult {
  const size = grid.length;
  const rows = grid.map((r) => r.join("").toLowerCase());
  const cols = Array.from({ length: size }, (_, c) =>
    grid.map((r) => r[c] ?? "").join("").toLowerCase()
  );

  const validRows = rows.map((w) => w.length === size && wordSet.has(w));
  const validCols = cols.map((w) => w.length === size && wordSet.has(w));

  const isComplete =
    grid.every((row) => row.every((cell) => cell !== null)) &&
    rows.every((w) => w.length === size) &&
    cols.every((w) => w.length === size);

  if (!isComplete) {
    return { validRows, validCols, isComplete: false, isWin: false };
  }

  const allValid = validRows.every(Boolean) && validCols.every(Boolean);
  const allDistinct = new Set([...rows, ...cols]).size === size * 2;
  const isWin = allValid && allDistinct;

  return { validRows, validCols, isComplete, isWin };
}
