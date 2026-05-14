-- ============================================
-- FIX INDIVIDUAL TOURNAMENT WINNERS
-- Chạy script này để cho phép lưu vận động viên vào cột champion_club_id, runner_up_id, third_place_id
-- ============================================

-- 1. Xóa các ràng buộc khóa ngoại cứng nhắc (chỉ cho phép clubs) của các cột kết quả
-- Điều này cho phép các cột này lưu ID của cả Club hoặc User (Profile) cho giải cá nhân

-- Champion
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_champion_club_id_fkey;
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS fk_champion_club;

-- Runner up
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_runner_up_id_fkey;
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS fk_runner_up;

-- Third place
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_third_place_id_fkey;
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS fk_third_place;

-- 2. Đảm bảo các cột runner_up và third_place tồn tại
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS runner_up_id UUID;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS third_place_id UUID;

-- 3. Thông báo hoàn thành
DO $$ BEGIN
    RAISE NOTICE 'Đã gỡ bỏ các ràng buộc khóa ngoại cho các cột người thắng cuộc để hỗ trợ giải cá nhân.';
END $$;

