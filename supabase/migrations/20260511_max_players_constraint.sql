-- Add max_players_per_match to tournaments table
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS max_players_per_match INTEGER DEFAULT 0;

-- Create tournament_registration_players table
CREATE TABLE IF NOT EXISTS tournament_registration_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID REFERENCES tournament_registrations(id) ON DELETE CASCADE,
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(registration_id, player_id)
);

-- Enable RLS
ALTER TABLE tournament_registration_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "public_select" ON tournament_registration_players FOR SELECT USING (true);
CREATE POLICY "authenticated_insert" ON tournament_registration_players FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_delete" ON tournament_registration_players FOR DELETE USING (auth.role() = 'authenticated');
