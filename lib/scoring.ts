export function calculateScore(elapsedSeconds: number): number {
  return Math.max(1000 - elapsedSeconds, 100);
}

export function scoreLabel(score: number): string {
  if (score >= 850) return "Blazing!";
  if (score >= 550) return "Solid";
  if (score >= 300) return "Steady";
  return "You made it!";
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}
