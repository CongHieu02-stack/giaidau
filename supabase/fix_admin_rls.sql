-- ============================================
-- FIX RLS POLICY FOR ADMIN USER MANAGEMENT
-- Cho phép admin cập nhật vai trò người dùng
-- ============================================

-- 1. Disable RLS trên bảng profiles (không khuyến khích cho production)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Hoặc tạo policy cho phép admin update tất cả users (khuyến khích)
-- Xóa policy cũ nếu tồn tại
DROP POLICY IF EXISTS "Allow admin to update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can manage all users" ON profiles;

-- Tạo policy mới cho phép admin update role/status
CREATE POLICY "Admin can manage all users"
ON profiles
FOR ALL
TO authenticated
USING (
  -- User xem được profile của mình hoặc admin xem được tất cả
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  -- Chỉ admin được phép update
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- 3. Hoặc cách đơn giản: Cho phép authenticated users update role
-- (Chỉ dùng cho development/testing)
-- DROP POLICY IF EXISTS "Allow authenticated to update roles" ON profiles;
-- CREATE POLICY "Allow authenticated to update roles"
-- ON profiles FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- ============================================
-- VERIFY RLS STATUS
-- ============================================
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- ============================================
-- LIST CURRENT POLICIES
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';
