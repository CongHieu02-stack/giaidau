-- Run this in Supabase SQL Editor
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS loser_next_match_id UUID REFERENCES matches(id);

-- Optional: Add a column to identify if a match belongs to winner or loser bracket
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS bracket_type VARCHAR(20) DEFAULT 'winner' CHECK (bracket_type IN ('winner', 'loser', 'grand_final', 'third_place'));
