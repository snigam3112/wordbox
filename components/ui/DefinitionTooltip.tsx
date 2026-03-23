"use client";

interface Props {
  word: string;
  definition: string | null;
  loading: boolean;
  x: number; // fixed left (centre of hovered cell)
  y: number; // fixed top (top edge of hovered cell)
}

export default function DefinitionTooltip({ word, definition, loading, x, y }: Props) {
  return (
    <div className="definition-tooltip" style={{ left: x, top: y }}>
      <span className="definition-tooltip__word">{word.toUpperCase()}</span>
      <span className="definition-tooltip__def">
        {loading ? "…" : (definition ?? "No definition found")}
      </span>
    </div>
  );
}
