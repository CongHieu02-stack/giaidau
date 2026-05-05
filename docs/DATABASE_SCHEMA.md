# Database Schema for Sports League Management System (Supabase)

## Overview
PostgreSQL database with Row Level Security (RLS) policies for multi-tenant access control.

## Tables

### 1. users (Auth managed by Supabase Auth)
```sql
-- Extended user profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    birth_date DATE,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'club_leader', 'club_deputy', 'referee', 'user')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. sports_categories
```sql
CREATE TABLE sports_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    icon_url TEXT,
    rules TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. clubs
```sql
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    leader_id UUID REFERENCES profiles(id),
    deputy_id UUID REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'dissolved')),
    rejection_reason TEXT,
    suspension_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. club_members
```sql
CREATE TABLE club_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'leader', 'deputy')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);
```

### 5. tournaments
```sql
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sport_category_id UUID REFERENCES sports_categories(id),
    rules TEXT,
    max_teams INTEGER NOT NULL,
    registration_deadline TIMESTAMP NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    match_days INTEGER[] DEFAULT '{6,7}', -- 6=Saturday, 7=Sunday
    match_times TIME[] DEFAULT '{"17:00", "19:00"}',
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled')),
    cancellation_reason TEXT,
    champion_club_id UUID REFERENCES clubs(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6. tournament_registrations
```sql
CREATE TABLE tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    registered_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, club_id)
);
```

### 7. tournament_players
```sql
CREATE TABLE tournament_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES tournament_registrations(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'rejected')),
    registered_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, player_id)
);
```

### 8. venues
```sql
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    capacity INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 9. matches
```sql
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    home_club_id UUID REFERENCES clubs(id),
    away_club_id UUID REFERENCES clubs(id),
    venue_id UUID REFERENCES venues(id),
    referee_id UUID REFERENCES profiles(id),
    match_date DATE NOT NULL,
    match_time TIME NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'paused', 'completed', 'cancelled')),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 10. match_events
```sql
CREATE TABLE match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES profiles(id),
    club_id UUID REFERENCES clubs(id),
    event_type VARCHAR(50) CHECK (event_type IN ('goal', 'yellow_card', 'red_card', 'substitution_in', 'substitution_out', 'start', 'pause', 'resume', 'end')),
    minute INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 11. notifications
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('tournament', 'club', 'match', 'system')),
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 12. system_logs
```sql
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update only own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Clubs: Leaders can manage their clubs
CREATE POLICY "Clubs viewable by everyone" ON clubs FOR SELECT USING (true);
CREATE POLICY "Leaders can update own clubs" ON clubs FOR UPDATE USING (leader_id = auth.uid());

-- Tournaments: Admins can manage
CREATE POLICY "Tournaments viewable by everyone" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Admins can manage tournaments" ON tournaments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
```

## Indexes

```sql
CREATE INDEX idx_clubs_status ON clubs(status);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_referee ON matches(referee_id);
CREATE INDEX idx_club_members_club ON club_members(club_id);
CREATE INDEX idx_club_members_user ON club_members(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
```

## Functions & Triggers

```sql
-- Update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()   
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```
