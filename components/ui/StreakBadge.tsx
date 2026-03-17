"use client";

export default function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null;
  return (
    <div className="streak">
      <span className="streak__flame">&#x1F525;</span>
      <span>{streak}</span>
    </div>
  );
}
