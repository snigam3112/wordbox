"use client";

import React from "react";

interface Props {
  id: string;
  char: string;
  placed: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  inCell?: boolean;
  locked?: boolean;
}

export default function LetterTile({
  char,
  placed,
  onDragStart,
  onTouchStart,
  onTouchEnd,
  inCell = false,
  locked = false,
}: Props) {
  if (placed && !inCell) {
    return <div className="tile tile--ghost" />;
  }

  const classes = ["tile"];
  if (inCell) classes.push("tile--in-cell");
  if (locked) classes.push("tile--locked");

  return (
    <div
      className={classes.join(" ")}
      draggable={!locked}
      onDragStart={locked ? undefined : onDragStart}
      onTouchStart={locked ? undefined : onTouchStart}
      onTouchEnd={locked ? undefined : onTouchEnd}
    >
      {char}
    </div>
  );
}
