-- ============================================
-- RESTORE SUPER ADMIN ROLE
-- Kiểm tra và khôi phục quyền super admin
-- ============================================

-- 1. Kiểm tra user hiện tại đang đăng nhập
SELECT 
    id,
    full_name,
    email,
    role,
    status,
    created_at
FROM profiles
WHERE email = 'ngconghieu2005@gmail.com';  -- Thay email của bạn

-- 2. Khôi phục super admin (nếu bị mất)
UPDATE profiles
SET role = 'super_admin',
    updated_at = NOW()
WHERE email = 'ngconghieu2005@gmail.com';  -- Thay email của bạn

-- 3. Kiểm tra lại sau khi update
SELECT 
    id,
    full_name,
    email,
    role,
    status
FROM profiles
WHERE email = 'ngconghieu2005@gmail.com';

-- ============================================
-- HOẶC: Nếu muốn xem tất cả admin hiện có
-- ============================================
SELECT id, full_name, email, role, status
FROM profiles
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at DESC;
