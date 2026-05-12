-- Thêm cột cho vận động viên cá nhân vào bảng matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_user_id UUID REFERENCES profiles(id);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_user_id UUID REFERENCES profiles(id);

-- Thêm comment để dễ nhận biết
COMMENT ON COLUMN matches.home_user_id IS 'ID của người dùng nếu là giải cá nhân';
COMMENT ON COLUMN matches.away_user_id IS 'ID của người dùng nếu là giải cá nhân';

-- Cập nhật RLS nếu cần (thường đã có quyền cho bảng matches)
NOTIFY pgrst, 'reload schema';
