-- ============================================
-- FIX INDIVIDUAL TOURNAMENT WINNERS
-- Chạy script này để cho phép lưu vận động viên vào cột champion_club_id
-- ============================================

-- 1. Xóa ràng buộc khóa ngoại cứng nhắc (chỉ cho phép clubs) của champion_club_id
-- Điều này cho phép cột này lưu ID của cả Club hoặc User (Profile)
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_champion_club_id_fkey;

-- 2. Đảm bảo các cột runner_up và third_place tồn tại
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS runner_up_id UUID;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS third_place_id UUID;

-- 3. (Tùy chọn) Thêm cột cụ thể cho cá nhân nếu muốn tách biệt hoàn toàn sau này
-- ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS champion_user_id UUID REFERENCES profiles(id);

-- 4. Thông báo hoàn thành
DO $$ BEGIN
    RAISE NOTICE 'Đã gỡ bỏ ràng buộc khóa ngoại cho champion_club_id để hỗ trợ giải cá nhân.';
END $$;
