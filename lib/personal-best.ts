export function getPersonalBest(mode: string): number | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(`wordbox_best_${mode}`);
  return v ? parseInt(v, 10) : null;
}

/** Returns true if this is a new personal best */
export function recordPersonalBest(mode: string, seconds: number): boolean {
  if (typeof window === "undefined") return false;
  const current = getPersonalBest(mode);
  if (current === null || seconds < current) {
    localStorage.setItem(`wordbox_best_${mode}`, String(seconds));
    return true;
  }
  return false;
}
