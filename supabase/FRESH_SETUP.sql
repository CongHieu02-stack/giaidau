-- ============================================
-- FRESH SETUP - Simple and Clean
-- ============================================

-- Drop all tables
DROP TABLE IF EXISTS match_events CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS tournament_registrations CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS standings CASCADE;
DROP TABLE IF EXISTS club_members CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS sports_categories CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL DEFAULT 'User',
    email VARCHAR(255),
    gender VARCHAR(10),
    birth_date DATE,
    phone VARCHAR(20),
    avatar_url TEXT,
    avatar_color VARCHAR(7) DEFAULT '#3b82f6',
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    display_role VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sports
CREATE TABLE sports_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    icon_url TEXT,
    icon_emoji VARCHAR(10),
    rules TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Clubs
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    description TEXT,
    logo_url TEXT,
    leader_id UUID REFERENCES profiles(id),
    deputy_id UUID REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'pending',
    rejection_reason TEXT,
    suspension_reason TEXT,
    member_count INTEGER DEFAULT 0,
    tournament_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Club Members
CREATE TABLE club_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    status VARCHAR(20) DEFAULT 'pending',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);

-- Tournaments
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sport_category_id UUID REFERENCES sports_categories(id),
    format VARCHAR(20) DEFAULT 'round_robin',
    rules TEXT,
    max_teams INTEGER DEFAULT 16,
    min_teams INTEGER DEFAULT 4,
    registration_deadline TIMESTAMP NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    match_days INTEGER[] DEFAULT '{6,7}',
    match_times TIME[] DEFAULT '{"17:00", "19:00"}',
    venue_requirements TEXT,
    referee_requirements TEXT,
    status VARCHAR(20) DEFAULT 'upcoming',
    cancellation_reason TEXT,
    champion_club_id UUID REFERENCES clubs(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tournament Registrations
CREATE TABLE tournament_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    registered_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES profiles(id),
    rejection_reason TEXT,
    UNIQUE(tournament_id, club_id)
);

-- Venues
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    capacity INTEGER,
    facilities TEXT,
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Matches
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    home_club_id UUID REFERENCES clubs(id),
    away_club_id UUID REFERENCES clubs(id),
    venue_id UUID REFERENCES venues(id),
    referee_id UUID REFERENCES profiles(id),
    round VARCHAR(50),
    match_number INTEGER,
    match_date DATE NOT NULL,
    match_time TIME NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    home_penalty INTEGER,
    away_penalty INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Match Events
CREATE TABLE match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES profiles(id),
    club_id UUID REFERENCES clubs(id),
    event_type VARCHAR(50),
    minute INTEGER,
    added_time INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Standings
CREATE TABLE standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    drawn INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    position INTEGER,
    group_name VARCHAR(50),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, club_id)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    related_id UUID,
    related_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System Logs
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simple)
CREATE POLICY "public_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "public_select" ON clubs FOR SELECT USING (true);
CREATE POLICY "public_select" ON club_members FOR SELECT USING (true);
CREATE POLICY "public_select" ON tournaments FOR SELECT USING (true);
CREATE POLICY "public_select" ON tournament_registrations FOR SELECT USING (true);
CREATE POLICY "public_select" ON venues FOR SELECT USING (true);
CREATE POLICY "public_select" ON matches FOR SELECT USING (true);
CREATE POLICY "public_select" ON match_events FOR SELECT USING (true);
CREATE POLICY "public_select" ON standings FOR SELECT USING (true);
CREATE POLICY "public_select" ON sports_categories FOR SELECT USING (true);

CREATE POLICY "owner_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "owner_update" ON clubs FOR UPDATE USING (leader_id = auth.uid());
CREATE POLICY "owner_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_clubs BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_tournaments BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_matches BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Default data
INSERT INTO sports_categories (name, icon_emoji, description) VALUES
    ('Bóng đá', '⚽', 'Môn thể thao vua'),
    ('Tennis', '🎾', 'Thi đấu với vợt'),
    ('Cầu lông', '🏸', 'Thi đấu cầu lông'),
    ('Bóng rổ', '🏀', 'Thi đấu bóng rổ'),
    ('Pickleball', '🎾', 'Môn pickleball'),
    ('Bóng chuyền', '🏐', 'Thi đấu bóng chuyền');

INSERT INTO venues (name, address, capacity) VALUES
    ('Sân vận động GDU', '123 Nguyễn Văn A', 500),
    ('Sân tennis Trung tâm', '456 Lê Lợi', 100),
    ('Nhà thi đấu Phú Thọ', '15 Lý Thường Kiệt', 2000);

-- Set super admin
DO $$
DECLARE
    uid UUID;
BEGIN
    SELECT id INTO uid FROM auth.users WHERE email = 'ngconghieu2005@gmail.com';
    IF uid IS NOT NULL THEN
        INSERT INTO profiles (id, email, full_name, role, status, created_at, updated_at, avatar_color)
        VALUES (uid, 'ngconghieu2005@gmail.com', 'Admin', 'super_admin', 'active', NOW(), NOW(), '#3b82f6')
        ON CONFLICT (id) DO UPDATE SET role = 'super_admin', status = 'active', updated_at = NOW();
    END IF;
END $$;

SELECT 'Setup complete!' as status;
