import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WordBox — Daily Word Puzzle",
  description:
    "Place 16 letters into a 4x4 grid so every row and column spells a valid word. New puzzle every day.",
  openGraph: {
    title: "WordBox — Daily Word Puzzle",
    description: "Can you solve today's WordBox?",
    url: "https://wordbox.vercel.app",
    siteName: "WordBox",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
