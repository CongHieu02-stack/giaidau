-- ============================================
-- MyLeague Supabase Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE (Extended user info)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    birth_date DATE,
    phone VARCHAR(20),
    avatar_url TEXT,
    avatar_color VARCHAR(7) DEFAULT '#3b82f6',
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'club_leader', 'club_deputy', 'referee', 'user')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
    display_role VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 2. SPORTS CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS sports_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    icon_url TEXT,
    icon_emoji VARCHAR(10),
    rules TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default sports
INSERT INTO sports_categories (name, icon_emoji, description) VALUES
    ('Bóng đá', '⚽', 'Môn thể thao vua, đá bóng theo đội'),
    ('Tennis', '🎾', 'Thi đấu đơn hoặc đôi với vợt và bóng'),
    ('Cầu lông', '🏸', 'Thi đấu với vợt đánh cầu'),
    ('Bóng rổ', '🏀', 'Thi đấu ghi điểm bằng cách ném bóng vào rổ'),
    ('Pickleball', '🎾', 'Môn thể thao kết hợp tennis, cầu lông và bóng bàn'),
    ('Bóng chuyền', '🏐', 'Thi đấu đánh bóng qua lưới')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. CLUBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    description TEXT,
    logo_url TEXT,
    leader_id UUID REFERENCES profiles(id),
    deputy_id UUID REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'dissolved')),
    rejection_reason TEXT,
    suspension_reason TEXT,
    member_count INTEGER DEFAULT 0,
    tournament_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clubs
CREATE POLICY "Clubs are viewable by everyone" 
    ON clubs FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create clubs" 
    ON clubs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Leaders can update own clubs" 
    ON clubs FOR UPDATE USING (leader_id = auth.uid());

-- ============================================
-- 4. CLUB MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS club_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'leader', 'deputy')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);

-- Enable RLS
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for club_members
CREATE POLICY "Club members are viewable by everyone" 
    ON club_members FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join clubs" 
    ON club_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can leave clubs" 
    ON club_members FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 5. TOURNAMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sport_category_id UUID REFERENCES sports_categories(id),
    format VARCHAR(20) DEFAULT 'round_robin' CHECK (format IN ('round_robin', 'knockout', 'hybrid')),
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
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled')),
    cancellation_reason TEXT,
    champion_club_id UUID REFERENCES clubs(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournaments
CREATE POLICY "Tournaments are viewable by everyone" 
    ON tournaments FOR SELECT USING (true);

CREATE POLICY "Admins can create tournaments" 
    ON tournaments FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Admins can update tournaments" 
    ON tournaments FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
        OR created_by = auth.uid()
    );

-- ============================================
-- 6. TOURNAMENT REGISTRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    registered_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES profiles(id),
    rejection_reason TEXT,
    UNIQUE(tournament_id, club_id)
);

-- Enable RLS
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Registrations are viewable by everyone" 
    ON tournament_registrations FOR SELECT USING (true);

CREATE POLICY "Club leaders can register" 
    ON tournament_registrations FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM clubs WHERE id = club_id AND leader_id = auth.uid())
    );

-- ============================================
-- 7. VENUES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    capacity INTEGER,
    facilities TEXT,
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venues are viewable by everyone" 
    ON venues FOR SELECT USING (true);

CREATE POLICY "Admins can manage venues" 
    ON venues FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Insert sample venues
INSERT INTO venues (name, address, capacity) VALUES
    ('Sân vận động GDU', '123 Nguyễn Văn A, Quận 1', 500),
    ('Sân tennis Trung tâm', '456 Lê Lợi, Quận 3', 100),
    ('Nhà thi đấu Phú Thọ', '15 Lý Thường Kiệt, Quận 10', 2000)
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. MATCHES TABLE
-- ============================================
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
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'paused', 'completed', 'cancelled', 'postponed')),
    notes TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are viewable by everyone" 
    ON matches FOR SELECT USING (true);

CREATE POLICY "Referees and admins can update matches" 
    ON matches FOR UPDATE USING (
        referee_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- ============================================
-- 9. MATCH EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES profiles(id),
    club_id UUID REFERENCES clubs(id),
    event_type VARCHAR(50) CHECK (event_type IN ('goal', 'own_goal', 'yellow_card', 'red_card', 'substitution_in', 'substitution_out', 'start', 'pause', 'resume', 'end', 'half_time', 'full_time')),
    minute INTEGER,
    added_time INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match events are viewable by everyone" 
    ON match_events FOR SELECT USING (true);

CREATE POLICY "Referees can create events" 
    ON match_events FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM matches m 
            WHERE m.id = match_id AND m.referee_id = auth.uid()
        )
    );

-- ============================================
-- 10. STANDINGS TABLE
-- ============================================
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

-- Enable RLS
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Standings are viewable by everyone" 
    ON standings FOR SELECT USING (true);

-- ============================================
-- 11. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('tournament', 'club', 'match', 'system', 'registration')),
    related_id UUID,
    related_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" 
    ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" 
    ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" 
    ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at 
    BEFORE UPDATE ON clubs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at 
    BEFORE UPDATE ON tournaments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at 
    BEFORE UPDATE ON matches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_clubs_status ON clubs(status);
CREATE INDEX IF NOT EXISTS idx_clubs_leader ON clubs(leader_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user ON club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_sport ON tournaments(sport_category_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_referee ON matches(referee_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_registrations_club ON tournament_registrations(club_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_standings_tournament ON standings(tournament_id);

-- ============================================
-- VIEWS
-- ============================================

-- View for tournament summary
CREATE OR REPLACE VIEW tournament_summary AS
SELECT 
    t.*,
    sc.name as sport_name,
    sc.icon_emoji as sport_icon,
    COUNT(DISTINCT tr.club_id) as registered_teams,
    p.full_name as creator_name
FROM tournaments t
LEFT JOIN sports_categories sc ON t.sport_category_id = sc.id
LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id AND tr.status = 'approved'
LEFT JOIN profiles p ON t.created_by = p.id
GROUP BY t.id, sc.name, sc.icon_emoji, p.full_name;

-- View for club summary
CREATE OR REPLACE VIEW club_summary AS
SELECT 
    c.*,
    p.full_name as leader_name,
    p.avatar_url as leader_avatar,
    COUNT(DISTINCT cm.user_id) as member_count
FROM clubs c
LEFT JOIN profiles p ON c.leader_id = p.id
LEFT JOIN club_members cm ON c.id = cm.club_id AND cm.status = 'approved'
GROUP BY c.id, p.full_name, p.avatar_url;

-- ============================================
-- SETUP COMPLETE
-- ============================================
