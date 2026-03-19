"use client";

import React from "react";

interface Props {
  id: string;
  char: string;
  placed: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  inCell?: boolean;
  locked?: boolean;
}

export default function LetterTile({
  char,
  placed,
  onDragStart,
  onDragOver,
  onDrop,
  onTouchStart,
  onTouchEnd,
  inCell = false,
  locked = false,
}: Props) {
  // Placed-but-not-in-cell = ghost slot in tray.
  // Still needs drag handlers so drops ON the ghost bubble correctly to the tray.
  if (placed && !inCell) {
    return (
      <div
        className="tile tile--ghost"
        onDragOver={onDragOver}
        onDrop={onDrop}
      />
    );
  }

  const classes = ["tile"];
  if (inCell) classes.push("tile--in-cell");
  if (locked) classes.push("tile--locked");

  return (
    <div
      className={classes.join(" ")}
      draggable={!locked}
      onDragStart={locked ? undefined : onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onTouchStart={locked ? undefined : onTouchStart}
      onTouchEnd={locked ? undefined : onTouchEnd}
    >
      {char}
    </div>
  );
}
