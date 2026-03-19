import { formatTime } from "./scoring";

export function generateShareText(
  puzzleIndex: number,
  score: number,
  elapsedSeconds: number,
  gridSize = 4
): string {
  const time = formatTime(elapsedSeconds);
  const row = "🟩".repeat(gridSize);
  const grid = Array(gridSize).fill(row).join("\n");
  const mode = gridSize === 3 ? " 3×3" : "";
  return `WordBox${mode} #${puzzleIndex}  ✓ ${score}pts  ⏱ ${time}\n\n${grid}\n\nwordbox.vercel.app`;
}
