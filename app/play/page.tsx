"use client";

import { useEffect, useState } from "react";
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
import { getDailyPuzzle, getPuzzleIndex } from "@/lib/puzzles";
import { getStreak, recordWin, hasWonToday } from "@/lib/streak";
import { calculateScore } from "@/lib/scoring";

export default function PlayPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [wordSet, setWordSet] = useState<Set<string> | null>(null);
  const [streak, setStreak] = useState(0);
  const [alreadyWon, setAlreadyWon] = useState(false);

  const game = useGameState(wordSet);
  const { elapsed, reset: resetTimer } = useTimer(game.status === "playing");
  const { entries, submitted, submitScore } = useLeaderboard();
  const puzzleIndex = getPuzzleIndex();

  // Init
  useEffect(() => {
    const stored = localStorage.getItem("wordbox_username");
    if (stored) {
      setUsername(stored);
    } else {
      setShowModal(true);
    }
    setStreak(getStreak());
    setAlreadyWon(hasWonToday());

    async function setup() {
      const [ws, puzzle] = await Promise.all([loadWordSet(), getDailyPuzzle()]);
      setWordSet(ws);
      game.initGame(puzzle.letters, puzzle.hints);
    }
    setup();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle win
  useEffect(() => {
    if (game.status === "won") {
      const newStreak = recordWin();
      setStreak(newStreak);
      setShowWinOverlay(true);
    }
  }, [game.status]);

  const dnd = useDragDrop(game.placeTile, game.returnToTray);

  function handleConfirmUsername(name: string) {
    setUsername(name);
    setShowModal(false);
  }

  function handleReset() {
    game.resetGame();
    resetTimer();
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
        />
      )}

      <header className="play-header">
        <h1 className="logo">WordBox</h1>
        <div className="play-header__right">
          <StreakBadge streak={streak} />
          <Timer elapsed={elapsed} />
          <ScoreDisplay elapsed={elapsed} />
        </div>
      </header>

      {alreadyWon && game.status !== "won" && (
        <div className="already-won-banner">
          You already completed today&apos;s puzzle! Come back tomorrow.
        </div>
      )}

      <section className="game-area">
        <p className="instructions">
          Fill every row <strong>and</strong> column with a valid word — 8 words total, all different.
        </p>

        <div className="progress">
          <div className="progress__group">
            <span className="progress__label">Rows</span>
            {game.validation.validRows.map((v, i) => (
              <span key={i} className={`progress__pip ${v ? "progress__pip--valid" : game.grid[i].every(Boolean) ? "progress__pip--invalid" : ""}`} />
            ))}
          </div>
          <div className="progress__group">
            <span className="progress__label">Cols</span>
            {game.validation.validCols.map((v, i) => (
              <span key={i} className={`progress__pip ${v ? "progress__pip--valid" : game.grid.every(r => r[i]) ? "progress__pip--invalid" : ""}`} />
            ))}
          </div>
        </div>

        <GameBoard
          grid={game.grid}
          validation={game.validation}
          lockedCells={game.lockedCells}
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

        <LetterTray
          tiles={game.tiles}
          onDragStart={(e, id, char) =>
            dnd.handleTileDragStart(e, id, char, "tray")
          }
          onDragOver={dnd.handleTrayDragOver}
          onDrop={dnd.handleTrayDrop}
          onTouchStart={(e, id, char) =>
            dnd.handleTileTouchStart(e, id, char, "tray")
          }
          onTouchEnd={dnd.handleTileTouchEnd}
        />

        <button className="btn btn--reset" onClick={handleReset}>
          Reset
        </button>
      </section>

      <section className="leaderboard-section">
        <h2 className="leaderboard-section__title">Today&apos;s Leaderboard</h2>
        <LeaderboardTable entries={entries} currentUsername={username} />
      </section>
    </main>
  );
}
