-- Thêm các cột hỗ trợ giải đấu Knockout và Round Robin vào bảng matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner_id UUID;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS bracket_position INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS next_match_id UUID REFERENCES matches(id);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'regular'; -- regular, semifinal, final, third_place
ALTER TABLE matches ADD COLUMN IF NOT EXISTS round INTEGER DEFAULT 1;

-- Thêm các cột lưu kết quả chung cuộc vào bảng tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS champion_club_id UUID;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS runner_up_id UUID;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS third_place_id UUID;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
