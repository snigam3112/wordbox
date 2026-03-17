/**
 * WordBox Puzzle Generator
 * Generates 100 valid 4x4 word squares where all 4 rows and 4 columns
 * are distinct valid English words (8 unique words per puzzle).
 *
 * Usage: node scripts/generate-puzzles.js
 * Requires:
 *   public/enable4.txt  — full OSPD5/TWL word list (for column validation)
 *   public/common4.txt  — common everyday words only (for generation)
 *
 * Run fetch-wordlist.js first to create both files.
 *
 * Outputs:
 *   data/puzzles.json          — full puzzles with solutions (gitignored)
 *   public/puzzles-client.json — letters-only, safe to ship to browser
 */

const fs = require("fs");
const path = require("path");

// ── Load word lists ─────────────────────────────────────────────────────────

function loadWords(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing ${filePath} — run: node scripts/fetch-wordlist.js`);
    process.exit(1);
  }
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => /^[a-z]{4}$/.test(w));
}

// Full OSPD5 list — used to validate columns during generation
const allWords = loadWords(path.join(__dirname, "../public/enable4.txt"), "OSPD5");
const wordSet = new Set(allWords);

// Common everyday words — used as candidates for rows (what the player sees)
const commonWords = loadWords(path.join(__dirname, "../public/common4.txt"), "common");
const words = Array.from(new Set(commonWords));

console.log(`Loaded ${words.length} four-letter words.`);

// ── Trie ────────────────────────────────────────────────────────────────────

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

const trie = buildTrie(words);

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
 * grid[r][c] = char or null
 * Fill row by row. After each row, verify all 4 column prefixes are valid.
 */
function solve(grid, rowIndex, usedWords, result, limit) {
  if (result.length >= limit) return;

  if (rowIndex === 4) {
    // Verify all columns are complete valid words
    const cols = [0, 1, 2, 3].map((c) =>
      [0, 1, 2, 3].map((r) => grid[r][c]).join("")
    );
    for (const col of cols) {
      if (!wordSet.has(col)) return;
    }
    // Verify all 8 words are distinct
    const rows = grid.map((r) => r.join(""));
    const allWords = [...rows, ...cols];
    if (new Set(allWords).size !== 8) return;

    result.push(grid.map((r) => [...r]));
    return;
  }

  // Shuffle words for variety
  const shuffled = [...words].sort(() => Math.random() - 0.5);

  for (const word of shuffled) {
    if (result.length >= limit) return;
    if (usedWords.has(word)) continue;

    // Place word in row rowIndex
    for (let c = 0; c < 4; c++) {
      grid[rowIndex][c] = word[c];
    }

    // Check all 4 column prefixes are valid in trie
    let valid = true;
    for (let c = 0; c < 4; c++) {
      const prefix = [0, 1, 2, 3]
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
  for (let c = 0; c < 4; c++) grid[rowIndex][c] = null;
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

// ── Pick 2 hint positions (different rows AND different cols) ────────────────

function pickHintPositions() {
  const all = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
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
      if (positions.length === 2) break;
    }
  }
  return positions;
}

// ── Generate puzzles ────────────────────────────────────────────────────────

const TARGET = 100;
const puzzles = [];
const seen = new Set(); // deduplicate by row words

console.log(`Generating ${TARGET} puzzles...`);

while (puzzles.length < TARGET) {
  const grid = [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];

  const found = [];
  solve(grid, 0, new Set(), found, 3); // find up to 3 per call for variety

  for (const solution of found) {
    if (puzzles.length >= TARGET) break;

    const rows = solution.map((r) => r.join(""));
    const key = rows.sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);

    const cols = [0, 1, 2, 3].map((c) =>
      [0, 1, 2, 3].map((r) => solution[r][c]).join("")
    );

    // Pick 2 hint positions and extract their letters
    const hintPositions = pickHintPositions();
    const hints = hintPositions.map(([r, c]) => ({
      row: r,
      col: c,
      letter: solution[r][c].toUpperCase(),
    }));

    // The 14 remaining letters (all 16 minus the 2 hint letters)
    const hintSet = new Set(hintPositions.map(([r, c]) => `${r},${c}`));
    const remainingLetters = shuffle(
      solution.flat().filter((_, idx) => {
        const r = Math.floor(idx / 4);
        const c = idx % 4;
        return !hintSet.has(`${r},${c}`);
      })
    ).map((l) => l.toUpperCase());

    puzzles.push({
      id: puzzles.length,
      letters: remainingLetters,
      hints,
      solution: {
        rows,
        cols,
        grid: solution,
      },
    });
  }

  if (puzzles.length % 10 === 0 && puzzles.length > 0) {
    process.stdout.write(`\r  ${puzzles.length}/${TARGET} puzzles found...`);
  }
}

console.log(`\nDone! ${puzzles.length} puzzles generated.`);

// ── Write output ────────────────────────────────────────────────────────────

const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(
  path.join(dataDir, "puzzles.json"),
  JSON.stringify(puzzles, null, 2)
);

const clientPuzzles = puzzles.map(({ id, letters, hints }) => ({ id, letters, hints }));
fs.writeFileSync(
  path.join(__dirname, "../public/puzzles-client.json"),
  JSON.stringify(clientPuzzles)
);

console.log("Wrote data/puzzles.json");
console.log("Wrote public/puzzles-client.json");

// Show a sample
const sample = puzzles[0];
console.log("\nSample puzzle #0:");
console.log("  Rows:", sample.solution.rows.join(", "));
console.log("  Cols:", sample.solution.cols.join(", "));
console.log("  Letters:", sample.letters.join(" "));
