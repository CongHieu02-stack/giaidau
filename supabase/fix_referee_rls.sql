-- =============================================
-- Fix RLS Policies for Referees and Admins
-- Tables: match_attendance, match_events, matches
-- =============================================

-- Enable RLS on all related tables
ALTER TABLE public.match_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------
-- 1. POLICIES FOR match_attendance
-- ---------------------------------------------
DROP POLICY IF EXISTS "Anyone can view match attendance" ON public.match_attendance;
CREATE POLICY "Anyone can view match attendance" ON public.match_attendance
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage all attendance" ON public.match_attendance;
CREATE POLICY "Admins can manage all attendance" ON public.match_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Referees can manage attendance for assigned matches" ON public.match_attendance;
CREATE POLICY "Referees can manage attendance for assigned matches" ON public.match_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE matches.id = match_attendance.match_id 
            AND matches.referee_id = auth.uid()
        )
    );

-- ---------------------------------------------
-- 2. POLICIES FOR match_events
-- ---------------------------------------------
DROP POLICY IF EXISTS "Anyone can view match events" ON public.match_events;
CREATE POLICY "Anyone can view match events" ON public.match_events
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage all match events" ON public.match_events;
CREATE POLICY "Admins can manage all match events" ON public.match_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Referees can manage events for assigned matches" ON public.match_events;
CREATE POLICY "Referees can manage events for assigned matches" ON public.match_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE matches.id = match_events.match_id 
            AND matches.referee_id = auth.uid()
        )
    );

-- ---------------------------------------------
-- 3. POLICIES FOR matches
-- ---------------------------------------------
DROP POLICY IF EXISTS "Matches are viewable by everyone" ON public.matches;
CREATE POLICY "Matches are viewable by everyone" ON public.matches
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage all matches" ON public.matches;
CREATE POLICY "Admins can manage all matches" ON public.matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Referees can update assigned matches" ON public.matches;
CREATE POLICY "Referees can update assigned matches" ON public.matches
    FOR UPDATE USING (referee_id = auth.uid());

DROP POLICY IF EXISTS "Referees and admins can update matches" ON public.matches; -- Cleanup old policy
