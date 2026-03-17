let wordSetCache: Set<string> | null = null;

export async function loadWordSet(): Promise<Set<string>> {
  if (wordSetCache) return wordSetCache;
  const res = await fetch("/enable4.txt");
  const text = await res.text();
  wordSetCache = new Set(
    text
      .split(/\r?\n/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length === 4)
  );
  return wordSetCache;
}
