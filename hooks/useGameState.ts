"use client";

import { useState, useCallback } from "react";
import { Grid, TileState, GameStatus, ValidationResult, HintCell } from "@/types";
import { validateGrid } from "@/lib/validation";

function makeEmptyGrid(size: number): Grid {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function makeDefaultValidation(size: number): ValidationResult {
  return {
    validRows: Array(size).fill(false),
    validCols: Array(size).fill(false),
    isComplete: false,
    isWin: false,
  };
}

interface GameState {
  grid: Grid;
  tiles: TileState[];
  hints: HintCell[];
  lockedCells: Set<string>;
  cellToTile: Record<string, string>;
  status: GameStatus;
  validation: ValidationResult;
  gridSize: number;
  gaveUp: boolean;
}

function cellKey(row: number, col: number) {
  return `${row},${col}`;
}

export function useGameState(wordSet: Set<string> | null) {
  const [state, setState] = useState<GameState>({
    grid: makeEmptyGrid(4),
    tiles: [],
    hints: [],
    lockedCells: new Set(),
    cellToTile: {},
    status: "idle",
    validation: makeDefaultValidation(4),
    gridSize: 4,
    gaveUp: false,
  });

  function initGame(letters: string[], hints: HintCell[], gridSize = 4) {
    const grid = makeEmptyGrid(gridSize);
    const lockedCells = new Set<string>();
    const cellToTile: Record<string, string> = {};

    const hintTiles: TileState[] = hints.map((h, i) => {
      const id = `hint-${i}`;
      grid[h.row][h.col] = h.letter;
      lockedCells.add(cellKey(h.row, h.col));
      return { id, char: h.letter, placed: true, locked: true };
    });

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
      validation: makeDefaultValidation(gridSize),
      gridSize,
      gaveUp: false,
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
        if (prev.lockedCells.has(cellKey(targetRow, targetCol))) return prev;
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

        newGrid[targetRow][targetCol] = tileChar;
        newCellToTile[cellKey(targetRow, targetCol)] = tileId;

        if (sourceType === "tray") {
          const tile = newTiles.find((t) => t.id === tileId);
          if (tile) tile.placed = true;
          if (existingChar !== null && existingTileId) {
            const displaced = newTiles.find((t) => t.id === existingTileId);
            if (displaced) displaced.placed = false;
            delete newCellToTile[cellKey(targetRow, targetCol)];
            newCellToTile[cellKey(targetRow, targetCol)] = tileId;
          }
        } else {
          if (sourceRow !== undefined && sourceCol !== undefined) {
            if (existingChar !== null && existingTileId) {
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
          : makeDefaultValidation(prev.gridSize);

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
          : makeDefaultValidation(prev.gridSize);

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
      const newGrid = makeEmptyGrid(prev.gridSize);
      for (const h of prev.hints) {
        newGrid[h.row][h.col] = h.letter;
      }
      return {
        ...prev,
        grid: newGrid,
        tiles: prev.tiles.map((t) => ({ ...t, placed: t.locked })),
        cellToTile: {},
        status: "playing",
        validation: makeDefaultValidation(prev.gridSize),
        gaveUp: false,
      };
    });
  }

  function giveUp(answer: string[][]) {
    setState((prev) => {
      const newGrid = answer.map((r) => r.map((c) => c.toUpperCase()));
      return {
        ...prev,
        grid: newGrid,
        tiles: prev.tiles.map((t) => ({ ...t, placed: true })),
        status: "won",
        gaveUp: true,
      };
    });
  }

  function showSolved(answer: string[][]) {
    const gridSize = answer.length;
    setState((prev) => ({
      ...prev,
      grid: answer.map((r) => r.map((c) => c.toUpperCase())),
      tiles: [],
      hints: [],
      lockedCells: new Set(),
      cellToTile: {},
      status: "solved",
      validation: {
        validRows: Array(gridSize).fill(true),
        validCols: Array(gridSize).fill(true),
        isComplete: true,
        isWin: true,
      },
      gridSize,
      gaveUp: false,
    }));
  }

  return { ...state, initGame, placeTile, returnToTray, resetGame, giveUp, showSolved };
}
