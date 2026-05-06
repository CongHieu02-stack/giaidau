-- ============================================
-- CHECK & FIX TOURNAMENT DATA
-- Kiểm tra và sửa dữ liệu giải đấu bị thiếu
-- ============================================

-- 1. Kiểm tra các giải đấu thiếu max_teams, min_teams
SELECT 
    id,
    title,
    max_teams,
    min_teams,
    status,
    created_at
FROM tournaments
WHERE max_teams IS NULL 
   OR min_teams IS NULL
   OR max_teams = 0
ORDER BY created_at DESC;

-- 2. Cập nhật giá trị mặc định cho các giải đấu bị thiếu
-- max_teams = 16 (mặc định), min_teams = 4 (mặc định)
UPDATE tournaments
SET 
    max_teams = COALESCE(max_teams, 16),
    min_teams = COALESCE(min_teams, 4)
WHERE max_teams IS NULL 
   OR min_teams IS NULL
   OR max_teams = 0;

-- 3. Kiểm tra lại sau khi cập nhật
SELECT 
    id,
    title,
    max_teams,
    min_teams,
    (max_teams - COALESCE(
        (SELECT COUNT(*) 
         FROM tournament_registrations 
         WHERE tournament_id = tournaments.id 
         AND status = 'approved'), 0
    )) as remaining_slots
FROM tournaments
ORDER BY created_at DESC;

-- 4. Nếu muốn set giá trị cụ thể cho từng giải đấu:
-- UPDATE tournaments 
-- SET max_teams = 20, min_teams = 10 
-- WHERE id = 'your-tournament-id';
