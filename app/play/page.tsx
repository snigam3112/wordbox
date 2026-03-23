"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GameBoard from "@/components/game/GameBoard";
import LetterTray from "@/components/game/LetterTray";
import Timer from "@/components/ui/Timer";
import ScoreDisplay from "@/components/ui/ScoreDisplay";
import StreakBadge from "@/components/ui/StreakBadge";
import UsernameModal from "@/components/ui/UsernameModal";
import WinOverlay from "@/components/ui/WinOverlay";
import HowToPlayModal from "@/components/ui/HowToPlayModal";
import LeaderboardTable from "@/components/ui/LeaderboardTable";
import DefinitionTooltip from "@/components/ui/DefinitionTooltip";
import { useGameState } from "@/hooks/useGameState";
import { useDragDrop } from "@/hooks/useDragDrop";
import { useTimer } from "@/hooks/useTimer";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { loadWordSet } from "@/lib/wordlist";
import { getDailyPuzzle, getPuzzleIndex, getTodayDateString } from "@/lib/puzzles";
import { getStreak, recordWin, hasWonToday } from "@/lib/streak";
import { calculateScore } from "@/lib/scoring";
import { getPersonalBest, recordPersonalBest } from "@/lib/personal-best";
import { isSoundEnabled, toggleSound, playPlaceSound, playWinSound } from "@/lib/sounds";
import { saveSession, loadSession } from "@/lib/sessionGame";
import { fetchDefinition } from "@/lib/definitions";
import { Puzzle, HintCell } from "@/types";

// Derive extra pre-placed hints deterministically using puzzle.id as seed.
// Also removes the extra letters from the tray so the counts stay correct.
function deriveHints(
  puzzle: Puzzle,
  targetCount: number
): { hints: HintCell[]; letters: string[] } {
  const hints = [...(puzzle.hints ?? [])];
  const letters = [...puzzle.letters];
  if (!puzzle.answer || hints.length >= targetCount) return { hints, letters };

  const gridSize = puzzle.answer.length;
  const hintedKeys = new Set(hints.map((h) => `${h.row},${h.col}`));
  const available: [number, number][] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!hintedKeys.has(`${r},${c}`)) available.push([r, c]);
    }
  }

  let seed = puzzle.id;
  while (hints.length < targetCount && available.length > 0) {
    const rand = ((seed * 1664525 + 1013904223) >>> 0) % available.length;
    const [r, c] = available[rand];
    const letter = puzzle.answer[r][c].toUpperCase();
    hints.push({ row: r, col: c, letter });
    const trayIdx = letters.indexOf(letter);
    if (trayIdx !== -1) letters.splice(trayIdx, 1);
    available.splice(rand, 1);
    seed = rand + 1;
  }
  return { hints, letters };
}

export default function PlayPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [wordSet, setWordSet] = useState<Set<string> | null>(null);
  const [streak, setStreak] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [yesterdayMode, setYesterdayMode] = useState(false);
  const [tooltipWord, setTooltipWord] = useState<string | null>(null);
  const [tooltipDef, setTooltipDef] = useState<string | null>(null);
  const [tooltipLoading, setTooltipLoading] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const game = useGameState(wordSet);
  const { elapsed, setElapsed } = useTimer(game.status === "playing");
  const { dailyEntries, weeklyEntries, alltimeEntries, submitted, submitError, submitScore } = useLeaderboard("4x4");
  const puzzleIndex = getPuzzleIndex();

  useEffect(() => {
    const stored = localStorage.getItem("wordbox_username");
    if (stored) setUsername(stored);
    else setShowModal(true);
    setStreak(getStreak());
    setSoundOn(isSoundEnabled());
    if (!localStorage.getItem("wordbox_seen_howto")) setShowHowTo(true);

    async function setup() {
      const today = getTodayDateString();
      const [ws, puzzle] = await Promise.all([loadWordSet(4), getDailyPuzzle()]);
      setWordSet(ws);
      setCurrentPuzzle(puzzle);

      if (hasWonToday("4x4") && puzzle.answer) {
        game.showSolved(puzzle.answer);
        return;
      }

      // Resume in-progress session if it exists for today
      const session = loadSession("4x4", today);
      if (session) {
        game.restoreGame(session, ws);
        setElapsed(session.elapsed);
        return;
      }

      // Fresh start — 4×4 gets 3 pre-placed tiles
      const { hints, letters } = deriveHints(puzzle, 3);
      game.initGame(letters, hints, 4);
    }
    setup();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist session on every meaningful state change while playing
  useEffect(() => {
    if (game.status !== "playing" || !currentPuzzle) return;
    saveSession("4x4", {
      puzzleDate: getTodayDateString(),
      grid: game.grid,
      tiles: game.tiles,
      lockedCells: Array.from(game.lockedCells),
      cellToTile: game.cellToTile,
      hints: game.hints,
      hintsRemaining: game.hintsRemaining,
      hintsUsed: game.hintsUsed,
      elapsed,
      gridSize: 4,
    });
  }, [game.grid, game.hintsRemaining, game.hintsUsed, elapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (game.status === "won") {
      if (!game.gaveUp && !yesterdayMode) {
        const newStreak = recordWin("4x4");
        setStreak(newStreak);
        const newRecord = recordPersonalBest("4x4", elapsed);
        setIsNewRecord(newRecord);
        playWinSound();
      }
      setShowWinOverlay(true);
    }
  }, [game.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const dnd = useDragDrop(game.placeTile, game.returnToTray);

  function handleCellDrop(e: React.DragEvent, r: number, c: number) {
    dnd.handleCellDrop(e, r, c);
    playPlaceSound();
  }

  function handleTileTouchEnd(e: React.TouchEvent) {
    dnd.handleTileTouchEnd(e);
    playPlaceSound();
  }

  function handleConfirmUsername(name: string) {
    setUsername(name);
    setShowModal(false);
  }

  function handleReset() { game.resetGame(); }

  function handleGiveUp() {
    if (!currentPuzzle?.answer) return;
    game.giveUp(currentPuzzle.answer);
  }

  async function handleSubmitScore() {
    if (!username) return;
    const score = calculateScore(elapsed, game.hintsUsed);
    await submitScore(username, score, elapsed);
  }

  function handleToggleSound() {
    const next = toggleSound();
    setSoundOn(next);
  }

  async function loadYesterday() {
    if (!wordSet) return;
    const puzzle = await getDailyPuzzle(1);
    setCurrentPuzzle(puzzle);
    const { hints, letters } = deriveHints(puzzle, 3);
    game.initGame(letters, hints, 4);
    setYesterdayMode(true);
    setShowWinOverlay(false);
  }

  async function handleWordHover(word: string, x: number, y: number) {
    setTooltipWord(word);
    setTooltipPos({ x, y });
    setTooltipLoading(true);
    setTooltipDef(null);
    const def = await fetchDefinition(word);
    setTooltipDef(def);
    setTooltipLoading(false);
  }

  function handleWordLeave() {
    setTooltipWord(null);
    setTooltipDef(null);
  }

  return (
    <main className="play-page">
      {showModal && <UsernameModal onConfirm={handleConfirmUsername} />}
      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}

      {tooltipWord && (
        <DefinitionTooltip
          word={tooltipWord}
          definition={tooltipDef}
          loading={tooltipLoading}
          x={tooltipPos.x}
          y={tooltipPos.y}
        />
      )}

      {game.status === "won" && showWinOverlay && username && (
        <WinOverlay
          elapsed={elapsed}
          puzzleIndex={puzzleIndex}
          streak={streak}
          username={username}
          onSubmit={handleSubmitScore}
          submitted={submitted}
          submitError={submitError}
          onClose={() => setShowWinOverlay(false)}
          gaveUp={game.gaveUp}
          gridSize={4}
          personalBest={getPersonalBest("4x4")}
          isNewRecord={isNewRecord}
          hintsUsed={game.hintsUsed}
          hideSubmit={yesterdayMode}
        />
      )}

      <header className="play-header">
        <div className="play-header__left">
          <h1 className="logo">WordBox</h1>
          <Link href="/play/3x3" className="mode-link">Try 3×3 →</Link>
          {username && <span className="username-chip">👤 {username}</span>}
        </div>
        <div className="play-header__right">
          <button className="btn--icon" onClick={() => setShowHowTo(true)} aria-label="How to play">❓</button>
          <button className="sound-toggle" onClick={handleToggleSound} aria-label={soundOn ? "Mute" : "Unmute"}>
            {soundOn ? "🔊" : "🔇"}
          </button>
          <StreakBadge streak={streak} />
          <Timer elapsed={elapsed} />
          <ScoreDisplay elapsed={elapsed} />
        </div>
      </header>

      {yesterdayMode && (
        <div className="yesterday-banner">Playing yesterday&apos;s puzzle — scores not submitted</div>
      )}
      {game.status === "solved" && (
        <div className="already-won-banner">
          You already solved today&apos;s puzzle! Here&apos;s your solution. Come back tomorrow.
        </div>
      )}

      <section className="game-area">
        {game.status !== "solved" && (
          <p className="instructions">
            Fill every row <strong>and</strong> column with a valid word — 8 words total, all different.
          </p>
        )}

        <div className="progress">
          <div className="progress__group">
            <span className="progress__label">Rows</span>
            {game.validation.validRows.map((v, i) => (
              <span key={i} className={`progress__pip ${v ? "progress__pip--valid" : game.grid[i]?.every(Boolean) ? "progress__pip--invalid" : ""}`} />
            ))}
          </div>
          <div className="progress__group">
            <span className="progress__label">Cols</span>
            {game.validation.validCols.map((v, i) => (
              <span key={i} className={`progress__pip ${v ? "progress__pip--valid" : game.grid.every((r) => r[i]) ? "progress__pip--invalid" : ""}`} />
            ))}
          </div>
        </div>

        <GameBoard
          grid={game.grid}
          validation={game.validation}
          lockedCells={game.lockedCells}
          gridSize={4}
          readonly={game.status === "solved"}
          hintMode={game.hintMode}
          onHintReveal={(r, c) => currentPuzzle?.answer && game.applyHint(currentPuzzle.answer, r, c)}
          onDragOver={(e, r, c) => dnd.handleCellDragOver(e)}
          onDrop={handleCellDrop}
          onTileDragStart={(e, char, r, c) =>
            dnd.handleTileDragStart(e, game.cellToTile[`${r},${c}`] ?? `cell-${r}-${c}`, char, "cell", r, c)
          }
          onTileTouchStart={(e, char, r, c) =>
            dnd.handleTileTouchStart(e, game.cellToTile[`${r},${c}`] ?? `cell-${r}-${c}`, char, "cell", r, c)
          }
          onTileTouchEnd={handleTileTouchEnd}
          onWordHover={handleWordHover}
          onWordLeave={handleWordLeave}
        />

        {game.status !== "solved" && (
          <>
            <LetterTray
              tiles={game.tiles}
              onDragStart={(e, id, char) => dnd.handleTileDragStart(e, id, char, "tray")}
              onDragOver={dnd.handleTrayDragOver}
              onDrop={dnd.handleTrayDrop}
              onTouchStart={(e, id, char) => dnd.handleTileTouchStart(e, id, char, "tray")}
              onTouchEnd={dnd.handleTileTouchEnd}
            />
            <div className="game-buttons">
              <button className="btn btn--reset" onClick={handleReset}>Reset</button>
              {game.status === "playing" && game.hintsRemaining > 0 && (
                <button className={`btn btn--hint${game.hintMode ? " active" : ""}`} onClick={game.activateHint}>
                  💡 {game.hintsRemaining}
                </button>
              )}
              {game.status === "playing" && (
                <button className="btn btn--giveup" onClick={handleGiveUp}>I Give Up</button>
              )}
            </div>
          </>
        )}
      </section>

      <section className="leaderboard-section">
        <h2 className="leaderboard-section__title">Leaderboard</h2>
        <LeaderboardTable dailyEntries={dailyEntries} weeklyEntries={weeklyEntries} alltimeEntries={alltimeEntries} currentUsername={username} />
        {!yesterdayMode && (
          <button className="btn--yesterday" onClick={loadYesterday}>← Yesterday&apos;s puzzle</button>
        )}
      </section>
    </main>
  );
}
