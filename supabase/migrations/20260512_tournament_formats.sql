-- ==============================================
-- Migration: Nâng cấp Thể thức Giải đấu
-- Ngày: 2026-05-12
-- ==============================================

-- 1. Thêm cột vinh danh Top 3 và vòng hiện tại vào tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS runner_up_id UUID;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS third_place_id UUID;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1;

-- 2. Thêm cột cho bracket knockout vào matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS bracket_position INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS next_match_id UUID REFERENCES matches(id);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner_id UUID;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'regular';
-- match_type: 'regular', 'semifinal', 'final', 'third_place'

-- 3. Reload schema cho PostgREST
NOTIFY pgrst, 'reload schema';
