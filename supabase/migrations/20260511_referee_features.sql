-- =============================================
-- Referee Features - Database Migration
-- =============================================

-- 1. Create match_events table for tracking goals, cards, substitutions
CREATE TABLE IF NOT EXISTS public.match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.profiles(id),
    club_id UUID REFERENCES public.clubs(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('goal', 'yellow_card', 'red_card', 'substitution_in', 'substitution_out', 'start', 'pause', 'resume', 'end')),
    minute INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create match_attendance table for player check-in before match
CREATE TABLE IF NOT EXISTS public.match_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.profiles(id),
    club_id UUID NOT NULL REFERENCES public.clubs(id),
    is_present BOOLEAN DEFAULT false,
    checked_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(match_id, player_id)
);

-- 3. Add extra columns to matches if they are missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='start_time') THEN
        ALTER TABLE public.matches ADD COLUMN start_time TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='end_time') THEN
        ALTER TABLE public.matches ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='referee_id') THEN
        ALTER TABLE public.matches ADD COLUMN referee_id UUID REFERENCES public.profiles(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='duration_seconds') THEN
        ALTER TABLE public.matches ADD COLUMN duration_seconds INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. Add participant_type to tournaments if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='participant_type') THEN
        ALTER TABLE public.tournaments ADD COLUMN participant_type VARCHAR(20) DEFAULT 'club';
    END IF;
END $$;

-- 5. Add user_id to tournament_registrations if missing (for individual registration)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_registrations' AND column_name='user_id') THEN
        ALTER TABLE public.tournament_registrations ADD COLUMN user_id UUID REFERENCES public.profiles(id);
    END IF;
END $$;

-- 6. RLS Policies for match_events
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- Everyone can view match events
CREATE POLICY "Anyone can view match events" ON public.match_events
    FOR SELECT USING (true);

-- Referees can insert/update/delete events for their assigned matches
CREATE POLICY "Referees can manage events for assigned matches" ON public.match_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE matches.id = match_events.match_id 
            AND matches.referee_id = auth.uid()
        )
    );

CREATE POLICY "Referees can update events for assigned matches" ON public.match_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE matches.id = match_events.match_id 
            AND matches.referee_id = auth.uid()
        )
    );

CREATE POLICY "Referees can delete events for assigned matches" ON public.match_events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE matches.id = match_events.match_id 
            AND matches.referee_id = auth.uid()
        )
    );

-- 7. RLS Policies for match_attendance
ALTER TABLE public.match_attendance ENABLE ROW LEVEL SECURITY;

-- Everyone can view attendance
CREATE POLICY "Anyone can view match attendance" ON public.match_attendance
    FOR SELECT USING (true);

-- Referees can manage attendance for their assigned matches
CREATE POLICY "Referees can manage attendance for assigned matches" ON public.match_attendance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE matches.id = match_attendance.match_id 
            AND matches.referee_id = auth.uid()
        )
    );

CREATE POLICY "Referees can update attendance for assigned matches" ON public.match_attendance
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE matches.id = match_attendance.match_id 
            AND matches.referee_id = auth.uid()
        )
    );

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON public.match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_attendance_match_id ON public.match_attendance(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_referee_id ON public.matches(referee_id);
