import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function getWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day;
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
  return weekStart.toISOString().split("T")[0];
}

function dedupByUsername(
  rows: { username: string; score: number; elapsed_sec: number }[]
): { username: string; score: number; elapsed_sec: number }[] {
  const best: Record<string, (typeof rows)[0]> = {};
  for (const row of rows) {
    if (!best[row.username] || row.score > best[row.username].score) {
      best[row.username] = row;
    }
  }
  return Object.values(best)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") ?? "daily";
  const date = req.nextUrl.searchParams.get("date");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("scores")
    .select("username, score, elapsed_sec")
    .order("score", { ascending: false });

  if (period === "daily") {
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
    query = query.eq("puzzle_date", date).limit(10);
  } else if (period === "weekly") {
    query = query.gte("puzzle_date", getWeekStart()).limit(200);
  } else {
    query = query.limit(500);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let rows = (data ?? []) as { username: string; score: number; elapsed_sec: number }[];
  if (period !== "daily") {
    rows = dedupByUsername(rows);
  }

  const entries = rows.map((row, i) => ({
    rank: i + 1,
    username: row.username,
    score: row.score,
    elapsed_sec: row.elapsed_sec,
  }));

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { puzzle_date, username, score, elapsed_sec } = body;

  if (!puzzle_date || !username || score == null || elapsed_sec == null) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (username.length < 1 || username.length > 20) {
    return NextResponse.json({ error: "invalid username" }, { status: 400 });
  }
  if (score < 100 || score > 1000) {
    return NextResponse.json({ error: "invalid score" }, { status: 400 });
  }

  const { error } = await supabase.from("scores").insert({
    puzzle_date,
    username,
    score,
    elapsed_sec,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
