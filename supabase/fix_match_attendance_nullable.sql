-- =============================================
-- Fix match_attendance table constraints
-- Allow null club_id for individual tournaments
-- =============================================

-- 1. Make club_id and player_id nullable
ALTER TABLE public.match_attendance ALTER COLUMN club_id DROP NOT NULL;
ALTER TABLE public.match_attendance ALTER COLUMN player_id DROP NOT NULL;

COMMENT ON COLUMN public.match_attendance.club_id IS 'Optional: ID of the club.';
COMMENT ON COLUMN public.match_attendance.player_id IS 'Optional: ID of the player profile.';
