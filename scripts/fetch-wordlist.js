/**
 * Downloads two word lists:
 *
 * 1. TWL06 (OSPD5-based) → public/enable4.txt
 *    Used for VALIDATION — accepts any legit Scrabble word the player places.
 *
 * 2. Google 20K most common English words, filtered to 4 letters → public/common4.txt
 *    Used for GENERATION — puzzles only use words people actually know.
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

function toWordList(raw) {
  return raw
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase().replace(/[^a-z]/g, ""))
    .filter((w) => /^[a-z]{4}$/.test(w));
}

async function main() {
  // ── 1. TWL06 — OSPD5-based Scrabble word list (validation) ────────────────
  console.log("Downloading TWL06 (OSPD5) word list...");
  let twlWords = [];
  try {
    const raw = await download(
      "https://raw.githubusercontent.com/redbo/scrabble/master/dictionary.txt"
    );
    twlWords = toWordList(raw);
    console.log(`  ${twlWords.length} four-letter TWL words`);
  } catch (e) {
    console.error("  TWL download failed:", e.message);
    // Fallback: Collins SOWPODS
    try {
      const raw = await download(
        "https://raw.githubusercontent.com/jesstess/Scrabble/master/scrabble/sowpods.txt"
      );
      twlWords = toWordList(raw);
      console.log(`  ${twlWords.length} four-letter Collins words (fallback)`);
    } catch (e2) {
      console.error("  Both sources failed. Please download a word list manually.");
      process.exit(1);
    }
  }

  fs.writeFileSync(
    path.join(__dirname, "../public/enable4.txt"),
    twlWords.join("\n")
  );
  console.log("  Wrote public/enable4.txt");

  // ── 2. Google 20K common words — for puzzle generation only ───────────────
  console.log("\nDownloading Google 20K common English words...");
  let commonWords = [];
  try {
    const raw = await download(
      "https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt"
    );
    // Only keep words that are ALSO in the Scrabble list (valid + common)
    const twlSet = new Set(twlWords);
    commonWords = toWordList(raw).filter((w) => twlSet.has(w));
    console.log(`  ${commonWords.length} common four-letter words (Scrabble-valid + everyday)`);
  } catch (e) {
    console.error("  Common words download failed:", e.message);
    // Fallback: use TWL but filter out likely obscure words
    // (words with uncommon letter combos like QJ, XZ, etc.)
    commonWords = twlWords.filter((w) => !/[qxzj]/.test(w));
    console.log(`  ${commonWords.length} words (TWL minus Q/X/Z/J words, fallback)`);
  }

  fs.writeFileSync(
    path.join(__dirname, "../public/common4.txt"),
    commonWords.join("\n")
  );
  console.log("  Wrote public/common4.txt");

  console.log("\nDone! Now run: node scripts/generate-puzzles.js");
}

main();
