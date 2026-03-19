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
  readonly?: boolean;
  hintMode?: boolean;
  onHintClick?: () => void;
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
  readonly = false,
  hintMode = false,
  onHintClick,
  onDragOver,
  onDrop,
  onTileDragStart,
  onTileTouchStart,
  onTileTouchEnd,
}: Props) {
  const blocked = isLocked || readonly;
  const classes = ["cell"];
  if (isLocked) classes.push("cell--locked");
  if (letter && !isLocked) {
    if (isValidRow) classes.push("cell--row-valid");
    else classes.push("cell--row-invalid");
    if (isValidCol) classes.push("cell--col-valid");
    else classes.push("cell--col-invalid");
    if (isValidRow && isValidCol) classes.push("cell--win");
  }
  if (hintMode && !letter && !blocked) {
    classes.push("cell--hintable");
  }

  return (
    <div
      className={classes.join(" ")}
      data-cell
      data-row={row}
      data-col={col}
      onDragOver={blocked ? undefined : onDragOver}
      onDrop={blocked ? undefined : onDrop}
      onClick={hintMode && !letter && !blocked ? onHintClick : undefined}
    >
      {letter && (
        <LetterTile
          key={letter ?? "_"}
          id={`cell-${row}-${col}`}
          char={letter}
          placed={false}
          inCell
          locked={blocked}
          onDragStart={blocked ? (e) => e.preventDefault() : onTileDragStart}
          onTouchStart={blocked ? () => {} : onTileTouchStart}
          onTouchEnd={blocked ? () => {} : onTileTouchEnd}
        />
      )}
    </div>
  );
}
