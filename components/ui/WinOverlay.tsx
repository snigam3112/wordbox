"use client";

import { calculateScore, scoreLabel, formatTime } from "@/lib/scoring";
import ShareButton from "./ShareButton";
import Confetti from "./Confetti";

interface Props {
  elapsed: number;
  puzzleIndex: number;
  streak: number;
  username: string;
  onSubmit: () => void;
  submitted: boolean;
  submitError?: string | null;
  onClose: () => void;
  gaveUp: boolean;
  gridSize?: number;
  personalBest?: number | null;
  isNewRecord?: boolean;
  hintsUsed?: number;
  hideSubmit?: boolean;
}

export default function WinOverlay({
  elapsed,
  puzzleIndex,
  streak,
  username,
  onSubmit,
  submitted,
  submitError = null,
  onClose,
  gaveUp,
  gridSize = 4,
  personalBest = null,
  isNewRecord = false,
  hintsUsed = 0,
  hideSubmit = false,
}: Props) {
  const score = gaveUp ? 0 : calculateScore(elapsed, hintsUsed);
  const label = gaveUp ? "Better luck tomorrow!" : scoreLabel(score);

  return (
    <>
      {!gaveUp && <Confetti />}
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
              {isNewRecord && (
                <p className="modal__new-record">⭐ New personal best!</p>
              )}
              {!isNewRecord && personalBest !== null && (
                <p className="modal__best-time">🏆 Your best: {formatTime(personalBest)}</p>
              )}
              {hintsUsed > 0 && (
                <p className="modal__hints-used">
                  💡 {hintsUsed} hint{hintsUsed > 1 ? "s" : ""} used (−{hintsUsed * 100} pts)
                </p>
              )}
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
                {!hideSubmit && (
                  submitted ? (
                    <p className="modal__submitted">Score submitted! ✓</p>
                  ) : (
                    <>
                      <button className="btn btn--primary" onClick={onSubmit}>
                        Submit to Leaderboard
                      </button>
                      {submitError && (
                        <p className="modal__submit-error">{submitError}</p>
                      )}
                    </>
                  )
                )}
              </div>
            </>
          )}

          <p className="modal__next">Next puzzle in 24h</p>
        </div>
      </div>
    </>
  );
}
