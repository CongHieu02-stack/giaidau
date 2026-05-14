import { supabase } from '../../config/supabase.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function fetchSportCategories() {
  const { data, error } = await supabase
    .from('sports_categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function fetchVenues() {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, sport_category_id')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export function parseMatchTimes(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateTournamentForm(form) {
  if (!form.name?.trim()) return 'Vui lòng nhập tên giải đấu.';
  if (!form.sportCategoryId) return 'Vui lòng chọn bộ môn.';
  if (!form.rules?.trim()) return 'Vui lòng nhập thể lệ giải đấu.';
  if (!form.registrationDeadline) return 'Vui lòng chọn ngày hết hạn đăng ký.';
  if (!form.startDate) return 'Vui lòng chọn ngày thi đấu.';

  const maxTeams = Number(form.maxTeams);
  const minTeams = Number(form.minTeams);

  if (!Number.isInteger(maxTeams) || maxTeams < 2) {
    return 'Số lượng câu lạc bộ tham gia phải từ 2 trở lên.';
  }

  if (!Number.isInteger(minTeams) || minTeams < 2 || minTeams > maxTeams) {
    return 'Số câu lạc bộ tối thiểu phải từ 2 và không lớn hơn số lượng tham gia.';
  }

  const maxPlayers = Number(form.maxPlayersPerMatch);
  if (!Number.isInteger(maxPlayers) || maxPlayers < 0) {
    return 'Số vận động viên mỗi đội không hợp lệ.';
  }

  const now = new Date();
  const deadline = new Date(form.registrationDeadline);
  const startDate = new Date(form.startDate);
  const endDate = form.endDate ? new Date(form.endDate) : null;

  if (Number.isNaN(deadline.getTime())) return 'Ngày hết hạn đăng ký không hợp lệ.';
  if (Number.isNaN(startDate.getTime())) return 'Ngày thi đấu không hợp lệ.';
  if (deadline <= now) return 'Ngày hết hạn đăng ký phải lớn hơn thời điểm hiện tại.';
  if (startDate < deadline) return 'Ngày thi đấu phải sau hạn đăng ký.';
  if (endDate && endDate < startDate) return 'Ngày kết thúc phải sau ngày bắt đầu.';

  if (!form.startTime) return 'Vui lòng chọn giờ bắt đầu thi đấu.';
  if (!TIME_PATTERN.test(form.startTime)) return 'Giờ bắt đầu thi đấu không hợp lệ.';
  if (form.endTime && !TIME_PATTERN.test(form.endTime)) return 'Giờ kết thúc thi đấu không hợp lệ.';

  return '';
}

export function buildTournamentPayload(form, createdBy) {
  return {
    name: form.name.trim(),
    description: form.description?.trim() || null,
    sport_category_id: form.sportCategoryId,
    format: form.format || 'round_robin',
    participant_type: form.participantType || 'club',
    rules: form.rules.trim(),
    max_teams: Number(form.maxTeams),
    min_teams: Number(form.minTeams),
    max_players_per_match: Number(form.maxPlayersPerMatch || 0),
    registration_deadline: form.registrationDeadline,
    start_date: form.startDate,
    end_date: form.endDate || null,
    match_days: [],
    match_times: [form.startTime, form.endTime].filter(Boolean),
    venue_requirements: form.scheduleNote?.trim() || null,
    venue_id: form.venueId || null,
    status: 'registration_open',
    created_by: createdBy || null,
    tournament_mode: form.tournamentMode || 'knockout',
    scoring_type: form.scoringType || 'count',
    unit: form.unit || 'bàn thắng',
    updated_at: new Date().toISOString()
  };
}

export async function createTournamentForAdmin(form, createdBy) {
  const validationError = validateTournamentForm(form);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const { data, error } = await supabase
    .from('tournaments')
    .insert(buildTournamentPayload(form, createdBy))
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
