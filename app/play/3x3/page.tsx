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
import { useGameState } from "@/hooks/useGameState";
import { useDragDrop } from "@/hooks/useDragDrop";
import { useTimer } from "@/hooks/useTimer";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { loadWordSet } from "@/lib/wordlist";
import { getDailyPuzzle3x3, getPuzzleIndex } from "@/lib/puzzles";
import { getStreak, recordWin, hasWonToday } from "@/lib/streak";
import { calculateScore } from "@/lib/scoring";
import { getPersonalBest, recordPersonalBest } from "@/lib/personal-best";
import { isSoundEnabled, toggleSound, playPlaceSound, playWinSound } from "@/lib/sounds";
import { Puzzle } from "@/types";

export default function Play3x3Page() {
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

  const game = useGameState(wordSet);
  const { elapsed } = useTimer(game.status === "playing");
  const { dailyEntries, weeklyEntries, alltimeEntries, submitted, submitScore } = useLeaderboard("3x3");
  const puzzleIndex = getPuzzleIndex();

  useEffect(() => {
    const stored = localStorage.getItem("wordbox_username");
    if (stored) setUsername(stored);
    else setShowModal(true);
    setStreak(getStreak());
    setSoundOn(isSoundEnabled());

    if (!localStorage.getItem("wordbox_seen_howto")) {
      setShowHowTo(true);
    }

    async function setup() {
      const [ws, puzzle] = await Promise.all([loadWordSet(3), getDailyPuzzle3x3()]);
      setWordSet(ws);
      setCurrentPuzzle(puzzle);
      if (hasWonToday("3x3") && puzzle.answer) {
        game.showSolved(puzzle.answer);
      } else {
        game.initGame(puzzle.letters, puzzle.hints, 3);
      }
    }
    setup();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (game.status === "won") {
      if (!game.gaveUp && !yesterdayMode) {
        const newStreak = recordWin("3x3");
        setStreak(newStreak);
        const newRecord = recordPersonalBest("3x3", elapsed);
        setIsNewRecord(newRecord);
        playWinSound();
      }
      setShowWinOverlay(true);
    }
    // "solved" = already-completed view — no overlay, no streak update
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

  function handleReset() {
    game.resetGame();
  }

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
    const puzzle = await getDailyPuzzle3x3(1);
    setCurrentPuzzle(puzzle);
    game.initGame(puzzle.letters, puzzle.hints, 3);
    setYesterdayMode(true);
    setShowWinOverlay(false);
  }

  return (
    <main className="play-page">
      {showModal && <UsernameModal onConfirm={handleConfirmUsername} />}
      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}

      {game.status === "won" && showWinOverlay && username && (
        <WinOverlay
          elapsed={elapsed}
          puzzleIndex={puzzleIndex}
          streak={streak}
          username={username}
          onSubmit={handleSubmitScore}
          submitted={submitted}
          onClose={() => setShowWinOverlay(false)}
          gaveUp={game.gaveUp}
          gridSize={3}
          personalBest={getPersonalBest("3x3")}
          isNewRecord={isNewRecord}
          hintsUsed={game.hintsUsed}
          hideSubmit={yesterdayMode}
        />
      )}

      <header className="play-header">
        <div className="play-header__left">
          <h1 className="logo">WordBox <span style={{ fontSize: "1rem", opacity: 0.7 }}>3×3</span></h1>
          <Link href="/play" className="mode-link">← 4×4</Link>
        </div>
        <div className="play-header__right">
          <button
            className="btn--icon"
            onClick={() => setShowHowTo(true)}
            aria-label="How to play"
          >
            ❓
          </button>
          <button
            className="sound-toggle"
            onClick={handleToggleSound}
            aria-label={soundOn ? "Mute sounds" : "Enable sounds"}
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <StreakBadge streak={streak} />
          <Timer elapsed={elapsed} />
          <ScoreDisplay elapsed={elapsed} />
        </div>
      </header>

      {yesterdayMode && (
        <div className="yesterday-banner">
          Playing yesterday&apos;s puzzle — scores not submitted
        </div>
      )}

      {game.status === "solved" && (
        <div className="already-won-banner">
          You already solved today&apos;s puzzle! Here&apos;s your solution. Come back tomorrow.
        </div>
      )}

      <section className="game-area">
        {game.status !== "solved" && (
          <p className="instructions">
            Fill every row <strong>and</strong> column with a valid word — 6 words total, all different.
          </p>
        )}

        <div className="progress">
          <div className="progress__group">
            <span className="progress__label">Rows</span>
            {game.validation.validRows.map((v, i) => (
              <span
                key={i}
                className={`progress__pip ${v ? "progress__pip--valid" : game.grid[i]?.every(Boolean) ? "progress__pip--invalid" : ""}`}
              />
            ))}
          </div>
          <div className="progress__group">
            <span className="progress__label">Cols</span>
            {game.validation.validCols.map((v, i) => (
              <span
                key={i}
                className={`progress__pip ${v ? "progress__pip--valid" : game.grid.every((r) => r[i]) ? "progress__pip--invalid" : ""}`}
              />
            ))}
          </div>
        </div>

        <GameBoard
          grid={game.grid}
          validation={game.validation}
          lockedCells={game.lockedCells}
          gridSize={3}
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
              <button className="btn btn--reset" onClick={handleReset}>
                Reset
              </button>
              {game.status === "playing" && game.hintsRemaining > 0 && (
                <button
                  className={`btn btn--hint${game.hintMode ? " active" : ""}`}
                  onClick={game.activateHint}
                >
                  💡 {game.hintsRemaining}
                </button>
              )}
              {game.status === "playing" && (
                <button className="btn btn--giveup" onClick={handleGiveUp}>
                  I Give Up
                </button>
              )}
            </div>
          </>
        )}
      </section>

      <section className="leaderboard-section">
        <h2 className="leaderboard-section__title">Leaderboard</h2>
        <LeaderboardTable
          dailyEntries={dailyEntries}
          weeklyEntries={weeklyEntries}
          alltimeEntries={alltimeEntries}
          currentUsername={username}
        />
        {!yesterdayMode && (
          <button className="btn--yesterday" onClick={loadYesterday}>
            ← Yesterday&apos;s puzzle
          </button>
        )}
      </section>
    </main>
  );
}
