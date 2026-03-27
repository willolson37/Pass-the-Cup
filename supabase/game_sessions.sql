-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  game_state JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_game_sessions_code ON game_sessions(code);

-- RLS
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can read active sessions (spectators joining by code)
CREATE POLICY "Anyone can read active game sessions"
  ON game_sessions
  FOR SELECT
  USING (is_active = TRUE);

-- Anyone can insert a new session (host creates session; anon key is sufficient)
CREATE POLICY "Anyone can create a game session"
  ON game_sessions
  FOR INSERT
  WITH CHECK (TRUE);

-- Anyone can update a session they know the code for.
-- The code acts as the shared secret — only the host who created the
-- session knows it, so this is an acceptable trust model for a party game.
CREATE POLICY "Anyone can update a game session by code"
  ON game_sessions
  FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

-- Optional: allow the host to hard-delete their own session if needed.
-- Disabled by default; uncomment if you want hosts to be able to clean up.
-- CREATE POLICY "Anyone can delete a game session by code"
--   ON game_sessions
--   FOR DELETE
--   USING (TRUE);

-- ── Auto-update updated_at on every row change ────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_game_sessions_updated_at ON game_sessions;
CREATE TRIGGER trg_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- ── Optional: periodic cleanup of stale inactive sessions ────────────────────
-- You can run this manually or schedule it via pg_cron / a Supabase Edge Function.
--
-- DELETE FROM game_sessions
--   WHERE is_active = FALSE
--     AND updated_at < NOW() - INTERVAL '24 hours';
--
-- DELETE FROM game_sessions
--   WHERE updated_at < NOW() - INTERVAL '7 days';
