import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("scores")
    .select("username, score, elapsed_sec")
    .eq("puzzle_date", date)
    .order("score", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const entries = (data ?? []).map((row, i) => ({
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

  // Basic validation
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
