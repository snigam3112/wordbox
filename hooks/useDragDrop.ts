"use client";

import { useRef } from "react";
import { DragData } from "@/types";

type PlaceFn = (
  tileId: string,
  tileChar: string,
  sourceType: "tray" | "cell",
  sourceRow: number | undefined,
  sourceCol: number | undefined,
  targetRow: number,
  targetCol: number
) => void;

type ReturnFn = (sourceRow: number, sourceCol: number) => void;

export function useDragDrop(onPlace: PlaceFn, onReturnToTray: ReturnFn) {
  const dragData = useRef<DragData | null>(null);

  // ── Mouse / pointer drag ──────────────────────────────────────────────────

  function handleTileDragStart(
    e: React.DragEvent,
    tileId: string,
    tileChar: string,
    sourceType: "tray" | "cell",
    sourceRow?: number,
    sourceCol?: number
  ) {
    dragData.current = { tileId, tileChar, sourceType, sourceRow, sourceCol };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", tileId);
  }

  function handleCellDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleCellDrop(
    e: React.DragEvent,
    targetRow: number,
    targetCol: number
  ) {
    e.preventDefault();
    const d = dragData.current;
    if (!d) return;
    onPlace(d.tileId, d.tileChar, d.sourceType, d.sourceRow, d.sourceCol, targetRow, targetCol);
    dragData.current = null;
  }

  function handleTrayDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleTrayDrop(e: React.DragEvent) {
    e.preventDefault();
    const d = dragData.current;
    if (!d) return;
    // Only handle cell → tray (returning a placed tile)
    if (d.sourceType === "cell" && d.sourceRow !== undefined && d.sourceCol !== undefined) {
      onReturnToTray(d.sourceRow, d.sourceCol);
    }
    dragData.current = null;
  }

  // ── Touch drag ────────────────────────────────────────────────────────────

  function handleTileTouchStart(
    e: React.TouchEvent,
    tileId: string,
    tileChar: string,
    sourceType: "tray" | "cell",
    sourceRow?: number,
    sourceCol?: number
  ) {
    dragData.current = { tileId, tileChar, sourceType, sourceRow, sourceCol };
  }

  function handleTileTouchEnd(e: React.TouchEvent) {
    const d = dragData.current;
    if (!d) return;

    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) { dragData.current = null; return; }

    // Check if dropped on tray
    const tray = el.closest("[data-tray]") as HTMLElement | null;
    if (tray && d.sourceType === "cell" && d.sourceRow !== undefined && d.sourceCol !== undefined) {
      onReturnToTray(d.sourceRow, d.sourceCol);
      dragData.current = null;
      return;
    }

    const cell = el.closest("[data-cell]") as HTMLElement | null;
    if (!cell) { dragData.current = null; return; }

    const row = parseInt(cell.dataset.row ?? "-1", 10);
    const col = parseInt(cell.dataset.col ?? "-1", 10);
    if (row === -1 || col === -1) { dragData.current = null; return; }

    onPlace(d.tileId, d.tileChar, d.sourceType, d.sourceRow, d.sourceCol, row, col);
    dragData.current = null;
  }

  return {
    handleTileDragStart,
    handleCellDragOver,
    handleCellDrop,
    handleTrayDragOver,
    handleTrayDrop,
    handleTileTouchStart,
    handleTileTouchEnd,
  };
}
