"use client";

import { useState, useCallback } from "react";
import { Grid, TileState, GameStatus, ValidationResult, HintCell } from "@/types";
import { validateGrid } from "@/lib/validation";

const EMPTY_GRID: Grid = [
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
];

interface GameState {
  grid: Grid;
  tiles: TileState[];
  hints: HintCell[];
  lockedCells: Set<string>;        // "row,col" keys
  cellToTile: Record<string, string>; // "row,col" → tileId (for non-locked cells)
  status: GameStatus;
  validation: ValidationResult;
}

const DEFAULT_VALIDATION: ValidationResult = {
  validRows: [false, false, false, false],
  validCols: [false, false, false, false],
  isComplete: false,
  isWin: false,
};

function cellKey(row: number, col: number) {
  return `${row},${col}`;
}

export function useGameState(wordSet: Set<string> | null) {
  const [state, setState] = useState<GameState>({
    grid: EMPTY_GRID.map((r) => [...r]),
    tiles: [],
    hints: [],
    lockedCells: new Set(),
    cellToTile: {},
    status: "idle",
    validation: DEFAULT_VALIDATION,
  });

  function initGame(letters: string[], hints: HintCell[]) {
    const grid: Grid = EMPTY_GRID.map((r) => [...r]);
    const lockedCells = new Set<string>();
    const cellToTile: Record<string, string> = {};

    // Place hint tiles into the grid
    const hintTiles: TileState[] = hints.map((h, i) => {
      const id = `hint-${i}`;
      grid[h.row][h.col] = h.letter;
      lockedCells.add(cellKey(h.row, h.col));
      return { id, char: h.letter, placed: true, locked: true };
    });

    // Regular tiles from the 14 remaining letters
    const regularTiles: TileState[] = letters.map((char, i) => ({
      id: `tile-${i}`,
      char,
      placed: false,
      locked: false,
    }));

    setState({
      grid,
      tiles: [...hintTiles, ...regularTiles],
      hints,
      lockedCells,
      cellToTile,
      status: "playing",
      validation: DEFAULT_VALIDATION,
    });
  }

  const placeTile = useCallback(
    (
      tileId: string,
      tileChar: string,
      sourceType: "tray" | "cell",
      sourceRow: number | undefined,
      sourceCol: number | undefined,
      targetRow: number,
      targetCol: number
    ) => {
      setState((prev) => {
        if (prev.status !== "playing") return prev;

        // Don't allow placing onto a locked cell
        if (prev.lockedCells.has(cellKey(targetRow, targetCol))) return prev;
        // Don't allow moving a locked cell
        if (
          sourceType === "cell" &&
          sourceRow !== undefined &&
          sourceCol !== undefined &&
          prev.lockedCells.has(cellKey(sourceRow, sourceCol))
        ) return prev;

        const newGrid = prev.grid.map((r) => [...r]);
        const newTiles = prev.tiles.map((t) => ({ ...t }));
        const newCellToTile = { ...prev.cellToTile };

        const existingChar = newGrid[targetRow][targetCol];
        const existingTileId = newCellToTile[cellKey(targetRow, targetCol)];

        // Place tile in target cell
        newGrid[targetRow][targetCol] = tileChar;
        newCellToTile[cellKey(targetRow, targetCol)] = tileId;

        if (sourceType === "tray") {
          const tile = newTiles.find((t) => t.id === tileId);
          if (tile) tile.placed = true;

          // Return displaced tile (if any) to tray
          if (existingChar !== null && existingTileId) {
            const displaced = newTiles.find((t) => t.id === existingTileId);
            if (displaced) displaced.placed = false;
            delete newCellToTile[cellKey(targetRow, targetCol)];
            newCellToTile[cellKey(targetRow, targetCol)] = tileId;
          }
        } else {
          // Cell → Cell
          if (sourceRow !== undefined && sourceCol !== undefined) {
            if (existingChar !== null && existingTileId) {
              // Swap: put displaced tile into source cell
              newGrid[sourceRow][sourceCol] = existingChar;
              newCellToTile[cellKey(sourceRow, sourceCol)] = existingTileId;
            } else {
              newGrid[sourceRow][sourceCol] = null;
              delete newCellToTile[cellKey(sourceRow, sourceCol)];
            }
            newCellToTile[cellKey(targetRow, targetCol)] = tileId;
          }
        }

        const validation = wordSet
          ? validateGrid(newGrid, wordSet)
          : DEFAULT_VALIDATION;

        return {
          ...prev,
          grid: newGrid,
          tiles: newTiles,
          cellToTile: newCellToTile,
          validation,
          status: validation.isWin ? "won" : "playing",
        };
      });
    },
    [wordSet]
  );

  const returnToTray = useCallback(
    (sourceRow: number, sourceCol: number) => {
      setState((prev) => {
        if (prev.status !== "playing") return prev;
        if (prev.lockedCells.has(cellKey(sourceRow, sourceCol))) return prev;

        const tileId = prev.cellToTile[cellKey(sourceRow, sourceCol)];
        if (!tileId) return prev;

        const newGrid = prev.grid.map((r) => [...r]);
        const newTiles = prev.tiles.map((t) => ({ ...t }));
        const newCellToTile = { ...prev.cellToTile };

        newGrid[sourceRow][sourceCol] = null;
        delete newCellToTile[cellKey(sourceRow, sourceCol)];

        const tile = newTiles.find((t) => t.id === tileId);
        if (tile) tile.placed = false;

        const validation = wordSet
          ? validateGrid(newGrid, wordSet)
          : DEFAULT_VALIDATION;

        return {
          ...prev,
          grid: newGrid,
          tiles: newTiles,
          cellToTile: newCellToTile,
          validation,
        };
      });
    },
    [wordSet]
  );

  function resetGame() {
    setState((prev) => {
      const newGrid: Grid = EMPTY_GRID.map((r) => [...r]);
      // Re-place hint cells
      for (const h of prev.hints) {
        newGrid[h.row][h.col] = h.letter;
      }
      return {
        ...prev,
        grid: newGrid,
        tiles: prev.tiles.map((t) => ({ ...t, placed: t.locked })),
        cellToTile: {},
        status: "playing",
        validation: DEFAULT_VALIDATION,
      };
    });
  }

  return { ...state, initGame, placeTile, returnToTray, resetGame };
}
