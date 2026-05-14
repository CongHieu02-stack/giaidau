-- ============================================
-- ADD TOURNAMENT MODE AND SCORING COLUMNS
-- ============================================

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS tournament_mode TEXT DEFAULT 'knockout';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS scoring_type TEXT DEFAULT 'count';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'bàn thắng';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_mode ON tournaments(tournament_mode);

COMMENT ON COLUMN tournaments.tournament_mode IS 'knockout or single_heat';
COMMENT ON COLUMN tournaments.scoring_type IS 'count (high is better), time (low is better), distance (high is better)';
COMMENT ON COLUMN tournaments.unit IS 'Display unit like goals, seconds, meters, etc.';

-- Store performance results for Single Heat mode
ALTER TABLE match_attendance ADD COLUMN IF NOT EXISTS result_value NUMERIC;
COMMENT ON COLUMN match_attendance.result_value IS 'Performance value (seconds for time, meters for distance, etc.)';
