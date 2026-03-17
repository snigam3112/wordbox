"use client";

import { useState } from "react";
import { generateShareText } from "@/lib/share";

interface Props {
  puzzleIndex: number;
  score: number;
  elapsed: number;
}

export default function ShareButton({ puzzleIndex, score, elapsed }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = generateShareText(puzzleIndex, score, elapsed);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback for browsers without clipboard API
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button className="btn btn--share" onClick={handleShare}>
      {copied ? "Copied!" : "Share Result"}
    </button>
  );
}
