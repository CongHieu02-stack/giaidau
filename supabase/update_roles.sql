-- ============================================
-- UPDATE ROLES AND PERMISSIONS
-- ============================================

-- 1. Update profiles table role constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'tournament_admin', 'club_admin', 'admin', 'club_leader', 'club_deputy', 'referee', 'user'));

-- 2. Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to check if user is tournament admin
CREATE OR REPLACE FUNCTION is_tournament_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('super_admin', 'tournament_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to check if user is club admin
CREATE OR REPLACE FUNCTION is_club_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('super_admin', 'club_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Set specific user as super admin (ngconghieu2005@gmail.com)
-- First get the user ID from auth.users
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find user by email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'ngconghieu2005@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Update or insert profile as super_admin
        INSERT INTO profiles (id, email, full_name, role, status, created_at, updated_at)
        VALUES (target_user_id, 'ngconghieu2005@gmail.com', 'Admin', 'super_admin', 'active', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE 
        SET role = 'super_admin', 
            status = 'active',
            updated_at = NOW();
        
        RAISE NOTICE 'User ngconghieu2005@gmail.com set as super_admin';
    ELSE
        RAISE NOTICE 'User ngconghieu2005@gmail.com not found in auth.users';
    END IF;
END $$;

-- 6. Update RLS policies for tournaments
DROP POLICY IF EXISTS "Admins can create tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admins can update tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admins can delete tournaments" ON tournaments;

CREATE POLICY "Tournament admins can manage tournaments" ON tournaments
    FOR ALL 
    USING (is_tournament_admin());

-- 7. Update RLS policies for clubs
DROP POLICY IF EXISTS "Authenticated users can create clubs" ON clubs;
DROP POLICY IF EXISTS "Leaders can update own clubs" ON clubs;

CREATE POLICY "Club admins can manage all clubs" ON clubs
    FOR ALL 
    USING (is_club_admin());

CREATE POLICY "Club leaders can update own clubs" ON clubs
    FOR UPDATE 
    USING (leader_id = auth.uid());

CREATE POLICY "Authenticated users can create clubs" ON clubs
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- 8. Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Super admin can manage all profiles" ON profiles;

CREATE POLICY "Super admin can manage all profiles" ON profiles
    FOR ALL 
    USING (is_super_admin());

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 9. Add policy for super admin to manage all tables
CREATE POLICY "Super admin full access on tournaments" ON tournaments
    FOR ALL USING (is_super_admin());

CREATE POLICY "Super admin full access on clubs" ON clubs
    FOR ALL USING (is_super_admin());

CREATE POLICY "Super admin full access on matches" ON matches
    FOR ALL USING (is_super_admin());

CREATE POLICY "Super admin full access on club_members" ON club_members
    FOR ALL USING (is_super_admin());

CREATE POLICY "Super admin full access on tournament_registrations" ON tournament_registrations
    FOR ALL USING (is_super_admin());

-- 10. Create view for admin dashboard
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM profiles WHERE status = 'active') as total_users,
    (SELECT COUNT(*) FROM profiles WHERE role = 'referee' AND status = 'active') as total_referees,
    (SELECT COUNT(*) FROM clubs WHERE status = 'approved') as total_clubs,
    (SELECT COUNT(*) FROM tournaments WHERE status IN ('ongoing', 'registration_open')) as active_tournaments,
    (SELECT COUNT(*) FROM tournaments WHERE status = 'completed') as completed_tournaments,
    (SELECT COUNT(*) FROM club_members WHERE status = 'pending') as pending_member_requests,
    (SELECT COUNT(*) FROM clubs WHERE status = 'pending') as pending_club_approvals,
    (SELECT COUNT(*) FROM tournament_registrations WHERE status = 'pending') as pending_tournament_regs;

-- 11. Create view for tournament admin dashboard
CREATE OR REPLACE VIEW tournament_admin_dashboard AS
SELECT 
    t.*,
    sc.name as sport_name,
    sc.icon_emoji as sport_icon,
    COUNT(DISTINCT tr.club_id) as registered_teams,
    COUNT(DISTINCT m.id) as total_matches,
    COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as completed_matches
FROM tournaments t
LEFT JOIN sports_categories sc ON t.sport_category_id = sc.id
LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id AND tr.status = 'approved'
LEFT JOIN matches m ON t.id = m.tournament_id
GROUP BY t.id, sc.name, sc.icon_emoji;

-- 12. Create view for club admin dashboard
CREATE OR REPLACE VIEW club_admin_dashboard AS
SELECT 
    c.*,
    p.full_name as leader_name,
    COUNT(DISTINCT cm.user_id) as member_count,
    COUNT(DISTINCT CASE WHEN cm.status = 'pending' THEN cm.user_id END) as pending_members
FROM clubs c
LEFT JOIN profiles p ON c.leader_id = p.id
LEFT JOIN club_members cm ON c.id = cm.club_id
GROUP BY c.id, p.full_name;

SELECT 'Roles and permissions updated successfully!' as status;
