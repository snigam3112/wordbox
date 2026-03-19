/**
 * WordBox 5x5 Puzzle Generator
 * Generates 100 valid 5x5 word squares where all 5 rows and 5 columns
 * are distinct valid English words (10 unique words per puzzle).
 *
 * Usage: node scripts/generate-puzzles-5x5.js
 * Requires:
 *   public/enable5.txt  — full TWL 5-letter word list (for column validation)
 *   public/common5.txt  — common everyday 5-letter words (for generation)
 *
 * Run fetch-wordlist.js first to create both files.
 *
 * Outputs:
 *   public/puzzles-5x5.json — browser-safe puzzles (letters + hints + answer)
 */

const fs = require("fs");
const path = require("path");

// ── Load word lists ─────────────────────────────────────────────────────────

function loadWords(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing ${filePath} — run: node scripts/fetch-wordlist.js`);
    process.exit(1);
  }
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => /^[a-z]{5}$/.test(w));
}

// Full TWL list — used to validate columns during generation
const allWords = loadWords(path.join(__dirname, "../public/enable5.txt"));
const wordSet = new Set(allWords);

// Common everyday words — used as candidates for rows (what the player sees)
const commonWords = loadWords(path.join(__dirname, "../public/common5.txt"));
const words = Array.from(new Set(commonWords));

console.log(`Loaded ${words.length} five-letter words for generation.`);

if (words.length < 50) {
  console.error("Too few common 5-letter words. Make sure common5.txt was generated correctly.");
  process.exit(1);
}

// ── Trie built from ALL 5-letter words (for column prefix checking) ──────────

class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

function buildTrie(wordList) {
  const root = new TrieNode();
  for (const word of wordList) {
    let node = root;
    for (const ch of word) {
      if (!node.children[ch]) node.children[ch] = new TrieNode();
      node = node.children[ch];
    }
    node.isEnd = true;
  }
  return root;
}

// Use all valid 5-letter words for the trie so columns can be any valid word
const trie = buildTrie(allWords);

function hasPrefix(prefix) {
  let node = trie;
  for (const ch of prefix) {
    if (!node.children[ch]) return false;
    node = node.children[ch];
  }
  return true;
}

// ── Backtracking solver ─────────────────────────────────────────────────────

/**
 * Fill row by row (5 rows). After each row, verify all 5 column prefixes
 * are valid in the trie. At rowIndex===5, verify all 5 columns are complete
 * valid words, and all 10 words are distinct.
 */
function solve(grid, rowIndex, usedWords, result, limit) {
  if (result.length >= limit) return;

  if (rowIndex === 5) {
    // Verify all columns are complete valid words
    const cols = [0, 1, 2, 3, 4].map((c) =>
      [0, 1, 2, 3, 4].map((r) => grid[r][c]).join("")
    );
    for (const col of cols) {
      if (!wordSet.has(col)) return;
    }
    // Verify all 10 words are distinct
    const rows = grid.map((r) => r.join(""));
    const allW = [...rows, ...cols];
    if (new Set(allW).size !== 10) return;

    result.push(grid.map((r) => [...r]));
    return;
  }

  // Shuffle words for variety
  const shuffled = [...words].sort(() => Math.random() - 0.5);

  for (const word of shuffled) {
    if (result.length >= limit) return;
    if (usedWords.has(word)) continue;

    // Place word in row rowIndex
    for (let c = 0; c < 5; c++) {
      grid[rowIndex][c] = word[c];
    }

    // Check all 5 column prefixes are valid in trie
    let valid = true;
    for (let c = 0; c < 5; c++) {
      const prefix = [0, 1, 2, 3, 4]
        .slice(0, rowIndex + 1)
        .map((r) => grid[r][c])
        .join("");
      if (!hasPrefix(prefix)) {
        valid = false;
        break;
      }
    }

    if (valid) {
      usedWords.add(word);
      solve(grid, rowIndex + 1, usedWords, result, limit);
      usedWords.delete(word);
    }
  }

  // Clear row
  for (let c = 0; c < 5; c++) grid[rowIndex][c] = null;
}

// ── Fisher-Yates shuffle ────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Pick 3 hint positions (different rows AND different cols) ────────────────

function pickHintPositions() {
  const all = [];
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 5; c++)
      all.push([r, c]);

  const shuffled = shuffle(all);
  const positions = [];
  const usedRows = new Set();
  const usedCols = new Set();

  for (const [r, c] of shuffled) {
    if (!usedRows.has(r) && !usedCols.has(c)) {
      positions.push([r, c]);
      usedRows.add(r);
      usedCols.add(c);
      if (positions.length === 3) break;
    }
  }
  return positions;
}

// ── Generate puzzles ────────────────────────────────────────────────────────

const TARGET = 100;
const puzzles = [];
const seen = new Set(); // deduplicate by row words

console.log(`Generating ${TARGET} 5×5 puzzles... (this may take a few minutes)`);

let attempts = 0;
const MAX_ATTEMPTS = 50000;

while (puzzles.length < TARGET && attempts < MAX_ATTEMPTS) {
  attempts++;
  const grid = [
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
  ];

  const found = [];
  solve(grid, 0, new Set(), found, 2); // find up to 2 per call for variety

  for (const solution of found) {
    if (puzzles.length >= TARGET) break;

    const rows = solution.map((r) => r.join(""));
    const key = [...rows].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);

    const cols = [0, 1, 2, 3, 4].map((c) =>
      [0, 1, 2, 3, 4].map((r) => solution[r][c]).join("")
    );

    // Pick 3 hint positions and extract their letters
    const hintPositions = pickHintPositions();
    const hints = hintPositions.map(([r, c]) => ({
      row: r,
      col: c,
      letter: solution[r][c].toUpperCase(),
    }));

    // The 22 remaining letters (all 25 minus the 3 hint letters)
    const hintSet = new Set(hintPositions.map(([r, c]) => `${r},${c}`));
    const remainingLetters = shuffle(
      solution.flat().filter((_, idx) => {
        const r = Math.floor(idx / 5);
        const c = idx % 5;
        return !hintSet.has(`${r},${c}`);
      })
    ).map((l) => l.toUpperCase());

    puzzles.push({
      id: puzzles.length,
      letters: remainingLetters,
      hints,
      answer: solution,
    });
  }

  if (puzzles.length % 10 === 0 && puzzles.length > 0 && found.length > 0) {
    process.stdout.write(`\r  ${puzzles.length}/${TARGET} puzzles found (attempt ${attempts})...`);
  }
}

if (puzzles.length < TARGET) {
  console.log(`\nWarning: Only found ${puzzles.length} puzzles after ${attempts} attempts.`);
  if (puzzles.length === 0) {
    console.error("No puzzles generated. Check that common5.txt has enough words.");
    process.exit(1);
  }
} else {
  console.log(`\nDone! ${puzzles.length} puzzles generated in ${attempts} attempts.`);
}

// ── Write output ────────────────────────────────────────────────────────────

fs.writeFileSync(
  path.join(__dirname, "../public/puzzles-5x5.json"),
  JSON.stringify(puzzles)
);

console.log("Wrote public/puzzles-5x5.json");

const sample = puzzles[0];
console.log("\nSample puzzle #0:");
console.log("  Rows:", sample.answer.map((r) => r.join("")).join(", "));
console.log("  Cols:", [0, 1, 2, 3, 4].map((c) => [0, 1, 2, 3, 4].map((r) => sample.answer[r][c]).join("")).join(", "));
console.log("  Letters:", sample.letters.join(" "));
