const cache: Record<number, Set<string>> = {};

export async function loadWordSet(size = 4): Promise<Set<string>> {
  if (cache[size]) return cache[size];
  const file = size === 3 ? "/enable3.txt" : "/enable4.txt";
  const res = await fetch(file);
  const text = await res.text();
  cache[size] = new Set(
    text
      .split(/\r?\n/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length === size)
  );
  return cache[size];
}
