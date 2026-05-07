-- ============================================
-- FIX RLS POLICIES - COMPLETE RESET
-- Xóa và tạo lại policies đúng cách
-- ============================================

-- 1. Xóa TẤT CẢ policies hiện có trên bảng profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can manage all users" ON profiles;
DROP POLICY IF EXISTS "Allow admin to update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated to update roles" ON profiles;
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- 2. Đảm bảo RLS được bật
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Tạo policy cho phép user đọc profile của CHÍNH HỌ (luôn cần có)
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 4. Tạo policy cho phép admin đọc TẤT CẢ profiles
CREATE POLICY "Admin can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- 5. Tạo policy cho phép user update profile của CHÍNH HỌ
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Tạo policy cho phép admin update TẤT CẢ profiles
CREATE POLICY "Admin can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- 7. Cho phép insert profile mới
CREATE POLICY "Enable insert for authenticated"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================
-- KIỂM TRA KẾT QUẢ
-- ============================================

-- Liệt kê tất cả policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual IS NOT NULL as has_using,
    with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================
-- KHÔI PHỤC SUPER ADMIN (nếu cần)
-- ============================================

-- Đặt lại quyền super admin cho email của bạn
UPDATE profiles
SET role = 'super_admin',
    updated_at = NOW()
WHERE email = 'ngconghieu2005@gmail.com';

-- Kiểm tra
SELECT id, full_name, email, role, status
FROM profiles
WHERE email = 'ngconghieu2005@gmail.com';
