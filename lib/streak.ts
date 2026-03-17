const STREAK_KEY = "wordbox_streak";
const LAST_WIN_KEY = "wordbox_last_win";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function getStreak(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(STREAK_KEY) ?? "0", 10);
}

export function recordWin(): number {
  if (typeof window === "undefined") return 0;
  const today = todayStr();
  const lastWin = localStorage.getItem(LAST_WIN_KEY);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let streak = parseInt(localStorage.getItem(STREAK_KEY) ?? "0", 10);

  if (lastWin === today) {
    // already won today, don't increment
    return streak;
  } else if (lastWin === yesterdayStr) {
    // consecutive day
    streak += 1;
  } else {
    // streak broken or first win
    streak = 1;
  }

  localStorage.setItem(STREAK_KEY, String(streak));
  localStorage.setItem(LAST_WIN_KEY, today);
  return streak;
}

export function hasWonToday(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LAST_WIN_KEY) === todayStr();
}
