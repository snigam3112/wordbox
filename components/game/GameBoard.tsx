"use client";

import React from "react";
import { Grid, ValidationResult } from "@/types";
import GameCell from "./GameCell";

interface Props {
  grid: Grid;
  validation: ValidationResult;
  lockedCells: Set<string>;
  onDragOver: (e: React.DragEvent, row: number, col: number) => void;
  onDrop: (e: React.DragEvent, row: number, col: number) => void;
  onTileDragStart: (
    e: React.DragEvent,
    char: string,
    row: number,
    col: number
  ) => void;
  onTileTouchStart: (
    e: React.TouchEvent,
    char: string,
    row: number,
    col: number
  ) => void;
  onTileTouchEnd: (e: React.TouchEvent) => void;
}

export default function GameBoard({
  grid,
  validation,
  lockedCells,
  onDragOver,
  onDrop,
  onTileDragStart,
  onTileTouchStart,
  onTileTouchEnd,
}: Props) {
  return (
    <div className="board">
      {grid.map((row, r) =>
        row.map((letter, c) => (
          <GameCell
            key={`${r}-${c}`}
            letter={letter}
            row={r}
            col={c}
            isValidRow={validation.validRows[r]}
            isValidCol={validation.validCols[c]}
            isComplete={validation.isComplete}
            isLocked={lockedCells.has(`${r},${c}`)}
            onDragOver={(e) => onDragOver(e, r, c)}
            onDrop={(e) => onDrop(e, r, c)}
            onTileDragStart={(e) => onTileDragStart(e, letter ?? "", r, c)}
            onTileTouchStart={(e) => onTileTouchStart(e, letter ?? "", r, c)}
            onTileTouchEnd={onTileTouchEnd}
          />
        ))
      )}
    </div>
  );
}
