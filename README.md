# WordBox

A daily word puzzle game. Place 16 letters into a 4x4 grid so that every row and every column spells a valid English word. All 8 words must be distinct.

**Play:** [wordbox.vercel.app](https://wordbox.vercel.app)

## Stack

- [Next.js 14](https://nextjs.org) — frontend + API routes
- [Supabase](https://supabase.com) — daily leaderboard
- [Vercel](https://vercel.com) — hosting

## Local Setup

### Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account

### 1. Clone and install

```bash
git clone https://github.com/snigam3112/wordbox
cd wordbox
npm install
```

### 2. Set up Supabase

Create a new Supabase project, then run this SQL in the SQL Editor:

```sql
CREATE TABLE scores (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  puzzle_date  date        NOT NULL,
  username     text        NOT NULL CHECK (char_length(username) BETWEEN 1 AND 20),
  score        integer     NOT NULL CHECK (score BETWEEN 100 AND 1000),
  elapsed_sec  integer     NOT NULL CHECK (elapsed_sec >= 0),
  submitted_at timestamptz DEFAULT now()
);

CREATE INDEX idx_scores_puzzle_date ON scores (puzzle_date, score DESC);

ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read"   ON scores FOR SELECT USING (true);
CREATE POLICY "insert" ON scores FOR INSERT WITH CHECK (true);
```

### 3. Configure environment

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 4. Generate puzzles

```bash
node scripts/fetch-wordlist.js   # downloads 4-letter word list
node scripts/generate-puzzles.js # generates 100 puzzles (~1-2 min)
```

### 5. Run

```bash
npm run dev
# open http://localhost:3000
```

## Deployment (Vercel)

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Vercel dashboard
4. Deploy

## How scoring works

- Base score: **1000 pts**
- Deduct **1 pt per second**
- Minimum score: **100 pts**

## License

MIT
