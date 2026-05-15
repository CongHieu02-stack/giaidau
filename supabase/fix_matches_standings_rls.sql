-- ============================================
-- FIX RLS POLICIES FOR MATCHES AND STANDINGS
-- Allow admins and super_admins to manage tournament data
-- ============================================

-- 1. FIX MATCHES TABLE POLICIES
-- Clean up existing restrictive policies
DROP POLICY IF EXISTS "Referees and admins can update matches" ON matches;
DROP POLICY IF EXISTS "Admins can manage all matches" ON matches;
DROP POLICY IF EXISTS "Anyone can insert matches" ON matches;

-- Select: Everyone can view (already exists, but reinforcing)
DROP POLICY IF EXISTS "Matches are viewable by everyone" ON matches;
CREATE POLICY "Matches are viewable by everyone" ON matches FOR SELECT USING (true);

-- Insert: Admins and Super Admins
CREATE POLICY "Admins can insert matches"
ON matches FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'tournament_admin')
    )
);

-- Update: Admins, Super Admins, and assigned Referees
CREATE POLICY "Admins and referees can update matches"
ON matches FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'tournament_admin')
    )
    OR referee_id = auth.uid()
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'tournament_admin')
    )
    OR referee_id = auth.uid()
);

-- Delete: Admins and Super Admins
CREATE POLICY "Admins can delete matches"
ON matches FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'tournament_admin')
    )
);


-- 2. FIX STANDINGS TABLE POLICIES
-- Clean up existing restrictive policies
DROP POLICY IF EXISTS "Standings are viewable by everyone" ON standings;
DROP POLICY IF EXISTS "Admins can manage standings" ON standings;

-- Select: Everyone can view
CREATE POLICY "Standings are viewable by everyone" ON standings FOR SELECT USING (true);

-- All (Insert, Update, Delete): Admins and Super Admins
CREATE POLICY "Admins can manage standings"
ON standings FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'tournament_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'tournament_admin')
    )
);

-- 3. FIX MATCH ATTENDANCE (Admins might need to initialize this)
DROP POLICY IF EXISTS "Referees can manage attendance for assigned matches" ON match_attendance;
CREATE POLICY "Admins and referees can manage attendance"
ON match_attendance FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'tournament_admin')
    )
    OR EXISTS (
        SELECT 1 FROM matches m 
        WHERE m.id = match_id AND m.referee_id = auth.uid()
    )
);

SELECT 'RLS policies for matches, standings, and attendance fixed successfully!' as status;
