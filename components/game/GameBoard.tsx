"use client";

import React, { useRef } from "react";
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
  onWordHover?: (word: string, x: number, y: number) => void;
  onWordLeave?: () => void;
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
  onWordHover,
  onWordLeave,
}: Props) {
  const boardClass =
    gridSize === 3 ? "board board--3x3" : gridSize === 5 ? "board board--5x5" : "board";

  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function getWordAtCell(r: number, c: number): string | null {
    if (validation.validRows[r] && grid[r].every(Boolean)) {
      return grid[r].join("") as string;
    }
    if (validation.validCols[c] && grid.every((row) => row[c])) {
      return grid.map((row) => row[c]).join("") as string;
    }
    return null;
  }

  function handleBoardMouseOver(e: React.MouseEvent) {
    if (!onWordHover) return;
    const cell = (e.target as HTMLElement).closest("[data-cell]") as HTMLElement | null;
    if (!cell) { onWordLeave?.(); return; }
    const r = parseInt(cell.dataset.row ?? "-1");
    const c = parseInt(cell.dataset.col ?? "-1");
    const word = getWordAtCell(r, c);
    if (word) {
      const rect = cell.getBoundingClientRect();
      onWordHover(word, rect.left + rect.width / 2, rect.top);
    } else {
      onWordLeave?.();
    }
  }

  function cancelLongPress() {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  function handleBoardTouchStart(e: React.TouchEvent) {
    if (!onWordHover) return;
    // Only trigger on the cell background, not on a tile (tile touches start drag)
    if ((e.target as HTMLElement).closest(".tile")) return;
    const cell = (e.target as HTMLElement).closest("[data-cell]") as HTMLElement | null;
    if (!cell) return;
    const r = parseInt(cell.dataset.row ?? "-1");
    const c = parseInt(cell.dataset.col ?? "-1");
    const word = getWordAtCell(r, c);
    if (!word) return;
    longPressRef.current = setTimeout(() => {
      const rect = cell.getBoundingClientRect();
      onWordHover!(word, rect.left + rect.width / 2, rect.top);
    }, 500);
  }

  return (
    <div
      className={boardClass}
      onMouseOver={onWordHover ? handleBoardMouseOver : undefined}
      onMouseLeave={onWordLeave}
      onTouchStart={onWordHover ? handleBoardTouchStart : undefined}
      onTouchMove={cancelLongPress}
      onTouchEnd={cancelLongPress}
    >
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
