"use client";

import React from "react";
import { Grid, ValidationResult } from "@/types";
import GameCell from "./GameCell";

interface Props {
  grid: Grid;
  validation: ValidationResult;
  lockedCells: Set<string>;
  gridSize?: number;
  readonly?: boolean;
  hintMode?: boolean;
  onHintReveal?: (r: number, c: number) => void;
  onDragOver: (e: React.DragEvent, row: number, col: number) => void;
  onDrop: (e: React.DragEvent, row: number, col: number) => void;
  onTileDragStart: (e: React.DragEvent, char: string, row: number, col: number) => void;
  onTileTouchStart: (e: React.TouchEvent, char: string, row: number, col: number) => void;
  onTileTouchEnd: (e: React.TouchEvent) => void;
}

export default function GameBoard({
  grid,
  validation,
  lockedCells,
  gridSize = 4,
  readonly = false,
  hintMode = false,
  onHintReveal,
  onDragOver,
  onDrop,
  onTileDragStart,
  onTileTouchStart,
  onTileTouchEnd,
}: Props) {
  const boardClass =
    gridSize === 3 ? "board board--3x3" : gridSize === 5 ? "board board--5x5" : "board";

  return (
    <div className={boardClass}>
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
            readonly={readonly}
            hintMode={hintMode}
            onHintClick={() => onHintReveal?.(r, c)}
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
