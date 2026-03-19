/**
 * Downloads word lists for both 4x4 and 3x3 modes:
 *
 * 4-letter words:
 *   public/enable4.txt  — TWL06/OSPD5 (validation)
 *   public/common4.txt  — Google 20K intersection (generation)
 *
 * 3-letter words:
 *   public/enable3.txt  — TWL06/OSPD5 (validation)
 *   public/common3.txt  — Google 20K intersection (generation)
 *
 * Usage: node scripts/fetch-wordlist.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function filterWords(raw, size) {
  const regex = new RegExp(`^[a-z]{${size}}$`);
  return raw
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase().replace(/[^a-z]/g, ""))
    .filter((w) => regex.test(w));
}

async function main() {
  // ── 1. TWL06 — OSPD5-based Scrabble word list ─────────────────────────────
  console.log("Downloading TWL06 (OSPD5) word list...");
  let twlRaw = "";
  try {
    twlRaw = await download(
      "https://raw.githubusercontent.com/redbo/scrabble/master/dictionary.txt"
    );
    console.log("  Downloaded TWL06");
  } catch (e) {
    console.error("  TWL download failed:", e.message);
    try {
      twlRaw = await download(
        "https://raw.githubusercontent.com/jesstess/Scrabble/master/scrabble/sowpods.txt"
      );
      console.log("  Downloaded Collins SOWPODS (fallback)");
    } catch (e2) {
      console.error("  Both sources failed.");
      process.exit(1);
    }
  }

  const twl4 = filterWords(twlRaw, 4);
  const twl3 = filterWords(twlRaw, 3);
  fs.writeFileSync(path.join(__dirname, "../public/enable4.txt"), twl4.join("\n"));
  fs.writeFileSync(path.join(__dirname, "../public/enable3.txt"), twl3.join("\n"));
  console.log(`  Wrote enable4.txt (${twl4.length} words), enable3.txt (${twl3.length} words)`);

  // ── 2. Google 20K common words ─────────────────────────────────────────────
  console.log("\nDownloading Google 20K common English words...");
  let googleRaw = "";
  try {
    googleRaw = await download(
      "https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt"
    );
    console.log("  Downloaded Google 20K");
  } catch (e) {
    console.error("  Common words download failed:", e.message);
    googleRaw = "";
  }

  const twl4Set = new Set(twl4);
  const twl3Set = new Set(twl3);

  let common4, common3;

  if (googleRaw) {
    const google4 = filterWords(googleRaw, 4);
    const google3 = filterWords(googleRaw, 3);
    common4 = google4.filter((w) => twl4Set.has(w));
    common3 = google3.filter((w) => twl3Set.has(w));
  } else {
    // Fallback: TWL minus rare-letter words
    common4 = twl4.filter((w) => !/[qxzj]/.test(w));
    common3 = twl3.filter((w) => !/[qxzj]/.test(w));
  }

  fs.writeFileSync(path.join(__dirname, "../public/common4.txt"), common4.join("\n"));
  fs.writeFileSync(path.join(__dirname, "../public/common3.txt"), common3.join("\n"));
  console.log(`  Wrote common4.txt (${common4.length} words), common3.txt (${common3.length} words)`);

  console.log("\nDone! Now run:");
  console.log("  node scripts/generate-puzzles.js");
  console.log("  node scripts/generate-puzzles-3x3.js");
}

main();
