import { formatTime } from "./scoring";

export function generateShareText(
  puzzleIndex: number,
  score: number,
  elapsedSeconds: number
): string {
  const time = formatTime(elapsedSeconds);
  const grid = "🟩🟩🟩🟩\n🟩🟩🟩🟩\n🟩🟩🟩🟩\n🟩🟩🟩🟩";
  return `WordBox #${puzzleIndex}  ✓ ${score}pts  ⏱ ${time}\n\n${grid}\n\nwordbox.vercel.app`;
}
