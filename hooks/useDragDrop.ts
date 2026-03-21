"use client";

import { useRef } from "react";
import { DragData } from "@/types";

function createGhost(char: string, x: number, y: number): HTMLDivElement {
  const ghost = document.createElement("div");
  ghost.className = "tile tile--drag-ghost";
  ghost.textContent = char;
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
  document.body.appendChild(ghost);
  return ghost;
}

function moveGhost(ghost: HTMLDivElement, x: number, y: number) {
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
}

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
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const touchMoveHandlerRef = useRef<((e: TouchEvent) => void) | null>(null);
  const lastHighlightedCellRef = useRef<Element | null>(null);
  const sourceCellRef = useRef<Element | null>(null);

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

  function highlightDropCell(el: Element | null) {
    if (lastHighlightedCellRef.current === el) return;
    lastHighlightedCellRef.current?.classList.remove("cell--drop-target");
    if (el) el.classList.add("cell--drop-target");
    lastHighlightedCellRef.current = el;
  }

  function handleTileTouchStart(
    e: React.TouchEvent,
    tileId: string,
    tileChar: string,
    sourceType: "tray" | "cell",
    sourceRow?: number,
    sourceCol?: number
  ) {
    dragData.current = { tileId, tileChar, sourceType, sourceRow, sourceCol };

    const touch = e.touches[0];
    const ghost = createGhost(tileChar, touch.clientX, touch.clientY);
    ghostRef.current = ghost;

    // Dim the source cell so the player can see the tile is "in hand"
    const sourceCellEl = (e.target as HTMLElement).closest("[data-cell]");
    if (sourceCellEl) {
      sourceCellEl.classList.add("cell--lifting");
      sourceCellRef.current = sourceCellEl;
    }

    // Subtle haptic on pick-up
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(8);
    }

    const onMove = (ev: TouchEvent) => {
      ev.preventDefault();
      const t = ev.touches[0];
      moveGhost(ghost, t.clientX, t.clientY);

      // Highlight the cell currently under the finger.
      // Ghost has pointer-events: none so elementFromPoint finds the real target.
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const cell = el?.closest("[data-cell]") ?? null;
      highlightDropCell(cell);
    };

    touchMoveHandlerRef.current = onMove;
    document.addEventListener("touchmove", onMove, { passive: false });
  }

  function removeGhost() {
    if (touchMoveHandlerRef.current) {
      document.removeEventListener("touchmove", touchMoveHandlerRef.current);
      touchMoveHandlerRef.current = null;
    }
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }
    // Clear cell highlights
    lastHighlightedCellRef.current?.classList.remove("cell--drop-target");
    lastHighlightedCellRef.current = null;
    sourceCellRef.current?.classList.remove("cell--lifting");
    sourceCellRef.current = null;
  }

  function handleTileTouchEnd(e: React.TouchEvent) {
    const d = dragData.current;
    if (!d) return;

    const touch = e.changedTouches[0];

    // Remove ghost BEFORE elementFromPoint so it doesn't block target detection
    removeGhost();

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
