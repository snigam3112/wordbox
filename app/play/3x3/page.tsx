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
import LeaderboardTable from "@/components/ui/LeaderboardTable";
import { useGameState } from "@/hooks/useGameState";
import { useDragDrop } from "@/hooks/useDragDrop";
import { useTimer } from "@/hooks/useTimer";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { loadWordSet } from "@/lib/wordlist";
import { getDailyPuzzle3x3, getPuzzleIndex } from "@/lib/puzzles";
import { getStreak, recordWin, hasWonToday } from "@/lib/streak";
import { calculateScore } from "@/lib/scoring";
import { Puzzle } from "@/types";

export default function Play3x3Page() {
  const [username, setUsername] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [wordSet, setWordSet] = useState<Set<string> | null>(null);
  const [streak, setStreak] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);

  const game = useGameState(wordSet);
  const { elapsed } = useTimer(game.status === "playing");
  const { dailyEntries, weeklyEntries, alltimeEntries, submitted, submitScore } = useLeaderboard();
  const puzzleIndex = getPuzzleIndex();

  useEffect(() => {
    const stored = localStorage.getItem("wordbox_username");
    if (stored) setUsername(stored);
    else setShowModal(true);
    setStreak(getStreak());

    async function setup() {
      const [ws, puzzle] = await Promise.all([loadWordSet(3), getDailyPuzzle3x3()]);
      setWordSet(ws);
      setCurrentPuzzle(puzzle);
      if (hasWonToday() && puzzle.answer) {
        game.showSolved(puzzle.answer);
      } else {
        game.initGame(puzzle.letters, puzzle.hints, 3);
      }
    }
    setup();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (game.status === "won") {
      if (!game.gaveUp) {
        const newStreak = recordWin();
        setStreak(newStreak);
      }
      setShowWinOverlay(true);
    }
    // "solved" = already-completed view — no overlay, no streak update
  }, [game.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const dnd = useDragDrop(game.placeTile, game.returnToTray);

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
    const score = calculateScore(elapsed);
    await submitScore(username, score, elapsed);
  }

  return (
    <main className="play-page">
      {showModal && <UsernameModal onConfirm={handleConfirmUsername} />}

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
        />
      )}

      <header className="play-header">
        <div className="play-header__left">
          <h1 className="logo">WordBox <span style={{ fontSize: "1rem", opacity: 0.7 }}>3×3</span></h1>
          <Link href="/play" className="mode-link">← 4×4</Link>
        </div>
        <div className="play-header__right">
          <StreakBadge streak={streak} />
          <Timer elapsed={elapsed} />
          <ScoreDisplay elapsed={elapsed} />
        </div>
      </header>

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
          onDragOver={(e, r, c) => dnd.handleCellDragOver(e)}
          onDrop={(e, r, c) => dnd.handleCellDrop(e, r, c)}
          onTileDragStart={(e, char, r, c) =>
            dnd.handleTileDragStart(e, `cell-${r}-${c}`, char, "cell", r, c)
          }
          onTileTouchStart={(e, char, r, c) =>
            dnd.handleTileTouchStart(e, `cell-${r}-${c}`, char, "cell", r, c)
          }
          onTileTouchEnd={dnd.handleTileTouchEnd}
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
      </section>
    </main>
  );
}
