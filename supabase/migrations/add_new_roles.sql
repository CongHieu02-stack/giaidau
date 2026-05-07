-- ============================================================
-- Migration: Thêm role tournament_admin và club_admin
-- Chạy trong Supabase Dashboard → SQL Editor
-- ============================================================

-- Bước 1: Kiểm tra xem cột role có dùng ENUM type không
-- Nếu có ENUM → dùng khối DO $$ bên dưới
-- Nếu là VARCHAR/TEXT → bỏ qua bước này, không cần làm gì thêm

DO $$
DECLARE
  type_exists boolean;
  v_enum_name text;
BEGIN
  -- Tìm tên enum type của cột role trong bảng profiles
  SELECT t.typname INTO v_enum_name
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_type t ON t.oid = a.atttypid
  WHERE c.relname = 'profiles'
    AND a.attname = 'role'
    AND t.typtype = 'e'; -- 'e' = enum

  IF v_enum_name IS NOT NULL THEN
    RAISE NOTICE 'Cột role dùng ENUM type: %', v_enum_name;

    -- Thêm tournament_admin nếu chưa có
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = v_enum_name
        AND e.enumlabel = 'tournament_admin'
    ) THEN
      EXECUTE format('ALTER TYPE %I ADD VALUE %L', v_enum_name, 'tournament_admin');
      RAISE NOTICE 'Đã thêm: tournament_admin';
    ELSE
      RAISE NOTICE 'Đã tồn tại: tournament_admin';
    END IF;

    -- Thêm club_admin nếu chưa có
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = v_enum_name
        AND e.enumlabel = 'club_admin'
    ) THEN
      EXECUTE format('ALTER TYPE %I ADD VALUE %L', v_enum_name, 'club_admin');
      RAISE NOTICE 'Đã thêm: club_admin';
    ELSE
      RAISE NOTICE 'Đã tồn tại: club_admin';
    END IF;

  ELSE
    RAISE NOTICE 'Cột role là TEXT/VARCHAR — không cần thêm enum, đã sẵn sàng sử dụng.';
  END IF;
END $$;

-- ============================================================
-- Bước 2: Thêm constraint CHECK nếu cột role là TEXT
-- (Bỏ comment nếu muốn giới hạn các giá trị hợp lệ)
-- ============================================================

-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
--   CHECK (role IN (
--     'user',
--     'referee',
--     'club_deputy',
--     'club_leader',
--     'tournament_admin',
--     'club_admin',
--     'admin',
--     'super_admin'
--   ));

-- ============================================================
-- Bước 3: Kiểm tra kết quả
-- ============================================================

-- Nếu dùng ENUM: xem các giá trị trong enum
SELECT t.typname AS enum_name, e.enumlabel AS value
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
JOIN pg_attribute a ON a.atttypid = t.oid
JOIN pg_class c ON c.oid = a.attrelid
WHERE c.relname = 'profiles' AND a.attname = 'role'
ORDER BY e.enumsortorder;
