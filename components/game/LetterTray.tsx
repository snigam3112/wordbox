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
  // Only show non-locked tiles in the tray
  const trayTiles = tiles.filter((t) => !t.locked);

  return (
    <div className="tray" data-tray onDragOver={onDragOver} onDrop={onDrop}>
      {trayTiles.map((tile) => (
        <LetterTile
          key={tile.id}
          id={tile.id}
          char={tile.char}
          placed={tile.placed}
          onDragStart={(e) => onDragStart(e, tile.id, tile.char)}
          onTouchStart={(e) => onTouchStart(e, tile.id, tile.char)}
          onTouchEnd={onTouchEnd}
        />
      ))}
    </div>
  );
}
