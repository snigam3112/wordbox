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
}

export default function WinOverlay({
  elapsed,
  puzzleIndex,
  streak,
  username,
  onSubmit,
  submitted,
  onClose,
}: Props) {
  const score = calculateScore(elapsed);
  const label = scoreLabel(score);

  return (
    <div className="modal-overlay">
      <div className="modal modal--win">
        <button className="modal__close" onClick={onClose} aria-label="Close">&#x2715;</button>
        <div className="modal__win-emoji">&#x1F389;</div>
        <h2 className="modal__title">{label}</h2>
        <p className="modal__score">{score} pts</p>
        <p className="modal__time">{formatTime(elapsed)}</p>
        {streak > 1 && (
          <p className="modal__streak">
            &#x1F525; {streak} day streak!
          </p>
        )}
        <div className="modal__actions">
          <ShareButton
            puzzleIndex={puzzleIndex}
            score={score}
            elapsed={elapsed}
          />
          {!submitted ? (
            <button className="btn btn--primary" onClick={onSubmit}>
              Submit to Leaderboard
            </button>
          ) : (
            <p className="modal__submitted">Score submitted!</p>
          )}
        </div>
        <p className="modal__next">Next puzzle in 24h</p>
      </div>
    </div>
  );
}
