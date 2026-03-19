"use client";

import { calculateScore, scoreLabel, formatTime } from "@/lib/scoring";
import ShareButton from "./ShareButton";

interface Props {
  elapsed: number;
  puzzleIndex: number;
  streak: number;
  username: string;
  onSubmit: () => void;
  submitted: boolean;
  onClose: () => void;
  gaveUp: boolean;
  gridSize?: number;
}

export default function WinOverlay({
  elapsed,
  puzzleIndex,
  streak,
  username,
  onSubmit,
  submitted,
  onClose,
  gaveUp,
  gridSize = 4,
}: Props) {
  const score = gaveUp ? 0 : calculateScore(elapsed);
  const label = gaveUp ? "Better luck tomorrow!" : scoreLabel(score);

  return (
    <div className="modal-overlay">
      <div className="modal modal--win">
        <button className="modal__close" onClick={onClose} aria-label="Close">
          &#x2715;
        </button>
        <div className="modal__win-emoji">{gaveUp ? "🏳️" : "🎉"}</div>
        <h2 className="modal__title">{label}</h2>

        {gaveUp ? (
          <p className="modal__subtitle">
            The solution has been filled in. Come back tomorrow for a new puzzle!
          </p>
        ) : (
          <>
            <p className="modal__score">{score} pts</p>
            <p className="modal__time">{formatTime(elapsed)}</p>
            {streak > 1 && (
              <p className="modal__streak">🔥 {streak} day streak!</p>
            )}
            <div className="modal__actions">
              <ShareButton
                puzzleIndex={puzzleIndex}
                score={score}
                elapsed={elapsed}
                gridSize={gridSize}
              />
              {!submitted ? (
                <button className="btn btn--primary" onClick={onSubmit}>
                  Submit to Leaderboard
                </button>
              ) : (
                <p className="modal__submitted">Score submitted! ✓</p>
              )}
            </div>
          </>
        )}

        <p className="modal__next">Next puzzle in 24h</p>
      </div>
    </div>
  );
}
