-- Fix profiles table - Add email column if missing

-- Add email column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add avatar_color column if missing
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(7) DEFAULT '#3b82f6';

-- Add display_role column if missing
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_role VARCHAR(100);

-- Ensure all required columns exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) DEFAULT 'User';

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update role constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'tournament_admin', 'club_admin', 'admin', 'club_leader', 'club_deputy', 'referee', 'user'));

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Now set the super admin user (safely, without requiring email column in INSERT)
DO $$
DECLARE
    target_user_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Find user by email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'ngconghieu2005@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Check if profile exists
        SELECT EXISTS(SELECT 1 FROM profiles WHERE id = target_user_id) INTO profile_exists;
        
        IF profile_exists THEN
            -- Update existing profile
            UPDATE profiles 
            SET role = 'super_admin',
                email = 'ngconghieu2005@gmail.com',
                full_name = COALESCE(full_name, 'Admin'),
                status = 'active',
                updated_at = NOW()
            WHERE id = target_user_id;
            
            RAISE NOTICE 'Updated existing profile for ngconghieu2005@gmail.com as super_admin';
        ELSE
            -- Insert new profile with all required columns
            INSERT INTO profiles (id, email, full_name, role, status, created_at, updated_at, avatar_color)
            VALUES (target_user_id, 'ngconghieu2005@gmail.com', 'Admin', 'super_admin', 'active', NOW(), NOW(), '#3b82f6');
            
            RAISE NOTICE 'Created new profile for ngconghieu2005@gmail.com as super_admin';
        END IF;
    ELSE
        RAISE NOTICE 'User ngconghieu2005@gmail.com not found in auth.users';
    END IF;
END $$;

SELECT 'Profiles table fixed and super admin set!' as status;
