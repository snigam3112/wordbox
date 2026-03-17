"use client";

import { useState } from "react";

interface Props {
  onConfirm: (username: string) => void;
}

export default function UsernameModal({ onConfirm }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < 1) {
      setError("Please enter a name.");
      return;
    }
    if (trimmed.length > 20) {
      setError("Max 20 characters.");
      return;
    }
    localStorage.setItem("wordbox_username", trimmed);
    onConfirm(trimmed);
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal__title">Welcome to WordBox</h2>
        <p className="modal__subtitle">
          Arrange all 16 letters so every row and column spells a valid word.
        </p>
        <form onSubmit={handleSubmit} className="modal__form">
          <input
            className="modal__input"
            type="text"
            placeholder="Your display name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={20}
            autoFocus
          />
          {error && <p className="modal__error">{error}</p>}
          <button className="btn btn--primary" type="submit">
            Play
          </button>
        </form>
      </div>
    </div>
  );
}
