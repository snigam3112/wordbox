"use client";

import React from "react";
import LetterTile from "./LetterTile";

interface Props {
  letter: string | null;
  row: number;
  col: number;
  isValidRow: boolean;
  isValidCol: boolean;
  isComplete: boolean;
  isLocked: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onTileDragStart: (e: React.DragEvent) => void;
  onTileTouchStart: (e: React.TouchEvent) => void;
  onTileTouchEnd: (e: React.TouchEvent) => void;
}

export default function GameCell({
  letter,
  row,
  col,
  isValidRow,
  isValidCol,
  isLocked,
  onDragOver,
  onDrop,
  onTileDragStart,
  onTileTouchStart,
  onTileTouchEnd,
}: Props) {
  const classes = ["cell"];
  if (isLocked) classes.push("cell--locked");
  if (letter && !isLocked) {
    if (isValidRow) classes.push("cell--row-valid");
    else classes.push("cell--row-invalid");
    if (isValidCol) classes.push("cell--col-valid");
    else classes.push("cell--col-invalid");
    if (isValidRow && isValidCol) classes.push("cell--win");
  }

  return (
    <div
      className={classes.join(" ")}
      data-cell
      data-row={row}
      data-col={col}
      onDragOver={isLocked ? undefined : onDragOver}
      onDrop={isLocked ? undefined : onDrop}
    >
      {letter && (
        <LetterTile
          id={`cell-${row}-${col}`}
          char={letter}
          placed={false}
          inCell
          locked={isLocked}
          onDragStart={isLocked ? (e) => e.preventDefault() : onTileDragStart}
          onTouchStart={isLocked ? () => {} : onTileTouchStart}
          onTouchEnd={isLocked ? () => {} : onTileTouchEnd}
        />
      )}
    </div>
  );
}
