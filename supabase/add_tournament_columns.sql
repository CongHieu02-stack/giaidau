-- ============================================
-- ADD MISSING COLUMNS TO TOURNAMENTS TABLE
-- Thêm cột max_teams và min_teams nếu chưa có
-- ============================================

-- 1. Kiểm tra cột hiện có trong bảng tournaments
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tournaments'
ORDER BY ordinal_position;

-- 2. Thêm cột max_teams nếu chưa có
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS max_teams INTEGER DEFAULT 16;

-- 3. Thêm cột min_teams nếu chưa có  
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS min_teams INTEGER DEFAULT 4;

-- 4. Cập nhật giá trị NULL thành default
UPDATE tournaments
SET max_teams = 16
WHERE max_teams IS NULL;

UPDATE tournaments
SET min_teams = 4
WHERE min_teams IS NULL;

-- 5. Kiểm tra lại
SELECT id, title, max_teams, min_teams
FROM tournaments
LIMIT 5;
