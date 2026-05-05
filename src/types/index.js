/**
 * Type Definitions
 * Following SRP: Single place for type definitions
 */

// Enums
export const UserRole = {
  SUPER_ADMIN: 'super_admin',      // Admin tổng - toàn quyền hệ thống
  TOURNAMENT_ADMIN: 'tournament_admin',  // Admin quản lý giải đấu
  CLUB_ADMIN: 'club_admin',        // Admin quản lý câu lạc bộ
  ADMIN: 'admin',                  // Admin chung (backward compat)
  CLUB_LEADER: 'club_leader',      // Trưởng câu lạc bộ
  CLUB_DEPUTY: 'club_deputy',      // Phó câu lạc bộ
  REFEREE: 'referee',              // Trọng tài
  USER: 'user'                     // Thành viên thường
};

export const UserStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BANNED: 'banned'
};

export const ClubStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  DISSOLVED: 'dissolved'
};

export const TournamentStatus = {
  UPCOMING: 'upcoming',
  REGISTRATION_OPEN: 'registration_open',
  REGISTRATION_CLOSED: 'registration_closed',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const MatchStatus = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const MemberRole = {
  MEMBER: 'member',
  DEPUTY: 'deputy',
  LEADER: 'leader'
};

export const MemberStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REMOVED: 'removed'
};

export const RegistrationStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const EventType = {
  GOAL: 'goal',
  YELLOW_CARD: 'yellow_card',
  RED_CARD: 'red_card',
  SUBSTITUTION_IN: 'substitution_in',
  SUBSTITUTION_OUT: 'substitution_out',
  START: 'start',
  PAUSE: 'pause',
  RESUME: 'resume',
  END: 'end'
};

export const NotificationType = {
  TOURNAMENT: 'tournament',
  CLUB: 'club',
  MATCH: 'match',
  SYSTEM: 'system'
};
