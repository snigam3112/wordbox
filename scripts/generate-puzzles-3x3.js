/**
 * WordBox 3x3 Puzzle Generator
 * Generates 100 valid 3x3 word squares where all 3 rows and 3 columns
 * are distinct valid English words (6 unique words per puzzle).
 *
 * Usage: node scripts/generate-puzzles-3x3.js
 * Requires:
 *   public/enable3.txt  — full OSPD5/TWL 3-letter word list (for column validation)
 *   public/common3.txt  — common everyday 3-letter words (for generation)
 *
 * Run fetch-wordlist.js first to create both files.
 *
 * Outputs:
 *   public/puzzles-3x3.json — browser-safe puzzles (letters + hints + answer)
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
    .filter((w) => /^[a-z]{3}$/.test(w));
}

const allWords = loadWords(path.join(__dirname, "../public/enable3.txt"));
const wordSet = new Set(allWords);

const commonWords = loadWords(path.join(__dirname, "../public/common3.txt"));
const words = Array.from(new Set(commonWords));

console.log(`Loaded ${words.length} three-letter words for generation.`);

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

function solve(grid, rowIndex, usedWords, result, limit) {
  if (result.length >= limit) return;

  if (rowIndex === 3) {
    const cols = [0, 1, 2].map((c) => [0, 1, 2].map((r) => grid[r][c]).join(""));
    for (const col of cols) {
      if (!wordSet.has(col)) return;
    }
    const rows = grid.map((r) => r.join(""));
    const allW = [...rows, ...cols];
    if (new Set(allW).size !== 6) return;

    result.push(grid.map((r) => [...r]));
    return;
  }

  const shuffled = [...words].sort(() => Math.random() - 0.5);

  for (const word of shuffled) {
    if (result.length >= limit) return;
    if (usedWords.has(word)) continue;

    for (let c = 0; c < 3; c++) grid[rowIndex][c] = word[c];

    let valid = true;
    for (let c = 0; c < 3; c++) {
      const prefix = [0, 1, 2]
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

  for (let c = 0; c < 3; c++) grid[rowIndex][c] = null;
}

// ── Shuffle ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Pick 1 hint position ─────────────────────────────────────────────────────

function pickHintPosition() {
  const all = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      all.push([r, c]);
  return shuffle(all)[0];
}

// ── Generate puzzles ─────────────────────────────────────────────────────────

const TARGET = 100;
const puzzles = [];
const seen = new Set();

console.log(`Generating ${TARGET} 3×3 puzzles...`);

while (puzzles.length < TARGET) {
  const grid = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];

  const found = [];
  solve(grid, 0, new Set(), found, 3);

  for (const solution of found) {
    if (puzzles.length >= TARGET) break;

    const rows = solution.map((r) => r.join(""));
    const key = [...rows].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);

    const cols = [0, 1, 2].map((c) => [0, 1, 2].map((r) => solution[r][c]).join(""));

    const [hRow, hCol] = pickHintPosition();
    const hints = [{ row: hRow, col: hCol, letter: solution[hRow][hCol].toUpperCase() }];

    const hintKey = `${hRow},${hCol}`;
    const remainingLetters = shuffle(
      solution.flat().filter((_, idx) => {
        const r = Math.floor(idx / 3);
        const c = idx % 3;
        return `${r},${c}` !== hintKey;
      })
    ).map((l) => l.toUpperCase());

    puzzles.push({
      id: puzzles.length,
      letters: remainingLetters,
      hints,
      answer: solution,
    });
  }

  if (puzzles.length % 10 === 0 && puzzles.length > 0) {
    process.stdout.write(`\r  ${puzzles.length}/${TARGET} puzzles found...`);
  }
}

console.log(`\nDone! ${puzzles.length} 3×3 puzzles generated.`);

fs.writeFileSync(
  path.join(__dirname, "../public/puzzles-3x3.json"),
  JSON.stringify(puzzles)
);

console.log("Wrote public/puzzles-3x3.json");

const sample = puzzles[0];
console.log("\nSample puzzle #0:");
console.log("  Rows:", sample.answer.map((r) => r.join("")).join(", "));
console.log("  Letters:", sample.letters.join(" "));
