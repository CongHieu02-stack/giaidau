
-- Create tournament_groups table
CREATE TABLE IF NOT EXISTS tournament_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add group_id to tournament_registrations
ALTER TABLE tournament_registrations 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES tournament_groups(id) ON DELETE SET NULL;

-- Add group_id to matches
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES tournament_groups(id) ON DELETE SET NULL;

-- Enable RLS on tournament_groups
ALTER TABLE tournament_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view groups" ON tournament_groups
    FOR SELECT USING (true);

CREATE POLICY "Tournament admins can manage groups" ON tournament_groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_groups.tournament_id
            AND t.organizer_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
        )
    );
