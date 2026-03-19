"use client";

import { useEffect } from "react";

interface Props {
  onClose: () => void;
}

const STEPS = [
  {
    title: "Drag tiles onto the board",
    desc: "Pick up letter tiles from the tray and drop them into the grid cells.",
  },
  {
    title: "Fill every row AND column with a word",
    desc: "Every row reads left-to-right as a valid word. Every column reads top-to-bottom as a valid word.",
  },
  {
    title: "All words must be different",
    desc: "No word can appear twice — rows and columns all need to be unique valid words.",
  },
  {
    title: "Gold tiles are pre-filled hints",
    desc: "Locked gold tiles show you one letter in the correct position. They can't be moved.",
  },
  {
    title: "Score is based on speed",
    desc: "You start with 1000 points. Every second that passes costs 1 point. Using hints costs 100 pts each. Fastest wins!",
  },
];

export default function HowToPlayModal({ onClose }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleDismiss() {
    localStorage.setItem("wordbox_seen_howto", "1");
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleDismiss}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={handleDismiss} aria-label="Close">
          &#x2715;
        </button>
        <h2 className="modal__title">How to Play</h2>
        <div className="howto__steps">
          {STEPS.map((step, i) => (
            <div key={i} className="howto__step">
              <div className="howto__num">{i + 1}</div>
              <p>
                <strong>{step.title}</strong>
                <br />
                {step.desc}
              </p>
            </div>
          ))}
        </div>
        <button className="btn btn--primary" onClick={handleDismiss}>
          Let&apos;s Play!
        </button>
      </div>
    </div>
  );
}
