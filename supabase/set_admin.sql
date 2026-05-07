-- ============================================
-- SET SUPER ADMIN USER
-- Đặt user làm admin tổng (super admin)
-- ============================================

-- CÁCH 1: Cập nhật user hiện có thành super admin
-- Thay YOUR_USER_ID bằng ID của user muốn set làm superadmin
UPDATE profiles
SET role = 'superadmin',
    updated_at = NOW()
WHERE id = 'YOUR_USER_ID';

-- CÁCH 2: Tạo mới super admin (nếu chưa có user)
-- Thay email và các thông tin cần thiết
INSERT INTO profiles (id, full_name, email, role, created_at, updated_at)
VALUES (
    'YOUR_USER_ID',  -- ID từ auth.users
    'Super Admin',
    'superadmin@example.com',
    'superadmin',
    NOW(),
    NOW()
);

-- CÁCH 3: Lấy user ID từ email rồi set superadmin
-- Thay YOUR_EMAIL bằng email muốn set superadmin
UPDATE profiles
SET role = 'superadmin',
    updated_at = NOW()
WHERE email = 'YOUR_EMAIL';

-- ============================================
-- KIỂM TRA SUPERADMIN HIỆN CÓ
-- ============================================
SELECT id, full_name, email, role, created_at
FROM profiles
WHERE role = 'superadmin'
ORDER BY created_at DESC;

-- ============================================
-- KIỂM TRA USER ID TỪ EMAIL
-- ============================================
SELECT id, full_name, email, role
FROM profiles
WHERE email = 'YOUR_EMAIL';
