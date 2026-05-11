-- Add status column to venues table for soft delete
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden'));

-- Create index for better performance when filtering by status
CREATE INDEX IF NOT EXISTS idx_venues_status ON venues(status);

-- Update RLS policy to only show active venues by default
DROP POLICY IF EXISTS "Venues are viewable by everyone" ON venues;
CREATE POLICY "Venues are viewable by everyone" ON venues 
  FOR SELECT USING (status = 'active');

-- Admins can see all venues including hidden ones
DROP POLICY IF EXISTS "Admins can manage venues" ON venues;
CREATE POLICY "Admins can manage venues" ON venues 
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('superadmin', 'admin')
    )
  );
