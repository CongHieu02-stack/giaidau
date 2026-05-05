-- Fix clubs table - Add missing columns

-- First, check if clubs table exists and what columns it has
-- Run this to see current structure:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'clubs';

-- Add missing columns if they don't exist
ALTER TABLE clubs 
ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS deputy_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS short_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tournament_count INTEGER DEFAULT 0;

-- Also ensure other columns exist
ALTER TABLE clubs 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- If the clubs table doesn't exist at all, create it:
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

-- Enable RLS if not already enabled
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Clubs are viewable by everyone" ON clubs;
DROP POLICY IF EXISTS "Authenticated users can create clubs" ON clubs;
DROP POLICY IF EXISTS "Leaders can update own clubs" ON clubs;

-- Recreate RLS policies
CREATE POLICY "Clubs are viewable by everyone" 
    ON clubs FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create clubs" 
    ON clubs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Leaders can update own clubs" 
    ON clubs FOR UPDATE USING (leader_id = auth.uid());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clubs_updated_at ON clubs;

CREATE TRIGGER update_clubs_updated_at 
    BEFORE UPDATE ON clubs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index
CREATE INDEX IF NOT EXISTS idx_clubs_status ON clubs(status);
CREATE INDEX IF NOT EXISTS idx_clubs_leader ON clubs(leader_id);
