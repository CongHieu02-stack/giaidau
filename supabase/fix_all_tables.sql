-- ============================================
-- FIX ALL TABLES - Create tables if missing + Add missing columns
-- ============================================

-- ============================================
-- 0. CREATE TABLES IF THEY DON'T EXIST
-- ============================================

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL DEFAULT 'User',
    email VARCHAR(255),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
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

-- Create sports_categories table if not exists
CREATE TABLE IF NOT EXISTS sports_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    icon_url TEXT,
    icon_emoji VARCHAR(10),
    rules TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create clubs table if not exists
CREATE TABLE IF NOT EXISTS clubs (
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

-- Create club_members table if not exists
CREATE TABLE IF NOT EXISTS club_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    status VARCHAR(20) DEFAULT 'pending',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);

-- Create tournaments table if not exists
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sport_category_id UUID REFERENCES sports_categories(id),
    format VARCHAR(20) DEFAULT 'round_robin',
    rules TEXT,
    max_teams INTEGER NOT NULL DEFAULT 16,
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

-- Create tournament_registrations table if not exists
CREATE TABLE IF NOT EXISTS tournament_registrations (
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

-- Create venues table if not exists
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    capacity INTEGER,
    facilities TEXT,
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create matches table if not exists
CREATE TABLE IF NOT EXISTS matches (
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

-- Create match_events table if not exists
CREATE TABLE IF NOT EXISTS match_events (
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

-- Create standings table if not exists
CREATE TABLE IF NOT EXISTS standings (
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

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
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

-- Enable RLS on all tables
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
ALTER TABLE sports_categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 1. FIX PROFILES TABLE (add missing columns)
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(7) DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS display_role VARCHAR(100);

-- 2. FIX CLUBS TABLE (main issue)
ALTER TABLE clubs 
ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS deputy_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS short_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tournament_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 3. FIX TOURNAMENTS TABLE
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS format VARCHAR(20) DEFAULT 'round_robin',
ADD COLUMN IF NOT EXISTS min_teams INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS venue_requirements TEXT,
ADD COLUMN IF NOT EXISTS referee_requirements TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- 4. FIX MATCHES TABLE
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS round VARCHAR(50),
ADD COLUMN IF NOT EXISTS match_number INTEGER,
ADD COLUMN IF NOT EXISTS home_penalty INTEGER,
ADD COLUMN IF NOT EXISTS away_penalty INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 5. FIX MATCH EVENTS TABLE
ALTER TABLE match_events
ADD COLUMN IF NOT EXISTS added_time INTEGER DEFAULT 0;

-- 6. FIX STANDINGS TABLE
ALTER TABLE standings
ADD COLUMN IF NOT EXISTS group_name VARCHAR(50);

-- 7. FIX NOTIFICATIONS TABLE
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS related_type VARCHAR(50);

-- 8. FIX SPORTS CATEGORIES TABLE
ALTER TABLE sports_categories
ADD COLUMN IF NOT EXISTS icon_emoji VARCHAR(10);

-- 9. FIX TOURNAMENT REGISTRATIONS TABLE
ALTER TABLE tournament_registrations
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ============================================
-- RECREATE ALL RLS POLICIES (clean slate)
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Clubs
DROP POLICY IF EXISTS "Clubs are viewable by everyone" ON clubs;
DROP POLICY IF EXISTS "Authenticated users can create clubs" ON clubs;
DROP POLICY IF EXISTS "Leaders can update own clubs" ON clubs;

CREATE POLICY "Clubs are viewable by everyone" ON clubs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create clubs" ON clubs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Leaders can update own clubs" ON clubs FOR UPDATE USING (leader_id = auth.uid());

-- Club Members
DROP POLICY IF EXISTS "Club members are viewable by everyone" ON club_members;
DROP POLICY IF EXISTS "Authenticated users can join clubs" ON club_members;
DROP POLICY IF EXISTS "Users can leave clubs" ON club_members;

CREATE POLICY "Club members are viewable by everyone" ON club_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join clubs" ON club_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can leave clubs" ON club_members FOR DELETE USING (user_id = auth.uid());

-- Tournaments
DROP POLICY IF EXISTS "Tournaments are viewable by everyone" ON tournaments;
DROP POLICY IF EXISTS "Admins can create tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admins can update tournaments" ON tournaments;

CREATE POLICY "Tournaments are viewable by everyone" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Admins can create tournaments" ON tournaments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can update tournaments" ON tournaments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    OR created_by = auth.uid()
);

-- Tournament Registrations
DROP POLICY IF EXISTS "Registrations are viewable by everyone" ON tournament_registrations;
DROP POLICY IF EXISTS "Club leaders can register" ON tournament_registrations;

CREATE POLICY "Registrations are viewable by everyone" ON tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Club leaders can register" ON tournament_registrations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clubs WHERE id = club_id AND leader_id = auth.uid())
);

-- Venues
DROP POLICY IF EXISTS "Venues are viewable by everyone" ON venues;
DROP POLICY IF EXISTS "Admins can manage venues" ON venues;

CREATE POLICY "Venues are viewable by everyone" ON venues FOR SELECT USING (true);
CREATE POLICY "Admins can manage venues" ON venues FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Matches
DROP POLICY IF EXISTS "Matches are viewable by everyone" ON matches;
DROP POLICY IF EXISTS "Referees and admins can update matches" ON matches;

CREATE POLICY "Matches are viewable by everyone" ON matches FOR SELECT USING (true);
CREATE POLICY "Referees and admins can update matches" ON matches FOR UPDATE USING (
    referee_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Match Events
DROP POLICY IF EXISTS "Match events are viewable by everyone" ON match_events;
DROP POLICY IF EXISTS "Referees can create events" ON match_events;

CREATE POLICY "Match events are viewable by everyone" ON match_events FOR SELECT USING (true);
CREATE POLICY "Referees can create events" ON match_events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM matches m WHERE m.id = match_id AND m.referee_id = auth.uid())
);

-- Standings
DROP POLICY IF EXISTS "Standings are viewable by everyone" ON standings;
CREATE POLICY "Standings are viewable by everyone" ON standings FOR SELECT USING (true);

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Sports Categories (public read)
DROP POLICY IF EXISTS "Sports categories are viewable by everyone" ON sports_categories;
CREATE POLICY "Sports categories are viewable by everyone" ON sports_categories FOR SELECT USING (true);

-- ============================================
-- RECREATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_clubs_updated_at ON clubs;
DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments;
DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT DATA (if not exists)
-- ============================================

-- Sports categories
INSERT INTO sports_categories (name, icon_emoji, description) VALUES
    ('Bóng đá', '⚽', 'Môn thể thao vua, đá bóng theo đội'),
    ('Tennis', '🎾', 'Thi đấu đơn hoặc đôi với vợt và bóng'),
    ('Cầu lông', '🏸', 'Thi đấu với vợt đánh cầu'),
    ('Bóng rổ', '🏀', 'Thi đấu ghi điểm bằng cách ném bóng vào rổ'),
    ('Pickleball', '🎾', 'Môn thể thao kết hợp tennis, cầu lông và bóng bàn'),
    ('Bóng chuyền', '🏐', 'Thi đấu đánh bóng qua lưới')
ON CONFLICT (name) DO NOTHING;

-- Sample venues
INSERT INTO venues (name, address, capacity) VALUES
    ('Sân vận động GDU', '123 Nguyễn Văn A, Quận 1', 500),
    ('Sân tennis Trung tâm', '456 Lê Lợi, Quận 3', 100),
    ('Nhà thi đấu Phú Thọ', '15 Lý Thường Kiệt, Quận 10', 2000)
ON CONFLICT DO NOTHING;

SELECT 'All tables fixed successfully!' as status;
