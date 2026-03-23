const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

export async function fetchDefinition(word: string): Promise<string | null> {
  const lower = word.toLowerCase();
  if (cache.has(lower)) return cache.get(lower)!;
  if (inflight.has(lower)) return inflight.get(lower)!;

  const promise = (async () => {
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${lower}`
      );
      if (!res.ok) { cache.set(lower, null); return null; }
      const data = await res.json();
      const def: string | null =
        data[0]?.meanings?.[0]?.definitions?.[0]?.definition ?? null;
      cache.set(lower, def);
      return def;
    } catch {
      cache.set(lower, null);
      return null;
    } finally {
      inflight.delete(lower);
    }
  })();

  inflight.set(lower, promise);
  return promise;
}
