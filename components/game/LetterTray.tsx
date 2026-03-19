"use client";

import React from "react";
import { TileState } from "@/types";
import LetterTile from "./LetterTile";

interface Props {
  tiles: TileState[];
  onDragStart: (e: React.DragEvent, tileId: string, tileChar: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onTouchStart: (e: React.TouchEvent, tileId: string, tileChar: string) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export default function LetterTray({
  tiles,
  onDragStart,
  onDragOver,
  onDrop,
  onTouchStart,
  onTouchEnd,
}: Props) {
  // Only show non-locked tiles — locked ones live permanently in the grid
  const trayTiles = tiles.filter((t) => !t.locked);

  // Always exactly 2 rows: ceil(total / 2) columns
  const columns = Math.ceil(trayTiles.length / 2);

  return (
    <div
      className="tray"
      style={{ gridTemplateColumns: `repeat(${columns}, var(--tile-size))` }}
      data-tray
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {trayTiles.map((tile) => (
        <LetterTile
          key={tile.id}
          id={tile.id}
          char={tile.char}
          placed={tile.placed}
          onDragStart={(e) => onDragStart(e, tile.id, tile.char)}
          onDragOver={onDragOver}   // forward to tray — fixes drops-on-tile bug
          onDrop={onDrop}           // forward to tray — fixes drops-on-tile bug
          onTouchStart={(e) => onTouchStart(e, tile.id, tile.char)}
          onTouchEnd={onTouchEnd}
        />
      ))}
    </div>
  );
}
