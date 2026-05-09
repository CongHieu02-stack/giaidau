import { supabase } from '../../config/supabase.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function fetchSportCategories() {
  const { data, error } = await supabase
    .from('sports_categories')
    .select('id, name')
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

  const now = new Date();
  const deadline = new Date(form.registrationDeadline);
  const startDate = new Date(form.startDate);
  const endDate = form.endDate ? new Date(form.endDate) : null;

  if (Number.isNaN(deadline.getTime())) return 'Ngày hết hạn đăng ký không hợp lệ.';
  if (Number.isNaN(startDate.getTime())) return 'Ngày thi đấu không hợp lệ.';
  if (deadline <= now) return 'Ngày hết hạn đăng ký phải lớn hơn thời điểm hiện tại.';
  if (startDate < deadline) return 'Ngày thi đấu phải sau hạn đăng ký.';
  if (endDate && endDate < startDate) return 'Ngày kết thúc phải sau ngày bắt đầu.';

  if (!Array.isArray(form.matchDays) || form.matchDays.length === 0) {
    return 'Vui lòng chọn ít nhất một ngày thi đấu trong tuần.';
  }

  const matchTimes = parseMatchTimes(form.matchTimes);
  if (matchTimes.length === 0) return 'Vui lòng nhập lịch giờ thi đấu.';
  if (matchTimes.some((time) => !TIME_PATTERN.test(time))) {
    return 'Giờ thi đấu cần đúng định dạng HH:mm, ví dụ: 17:00, 19:00.';
  }

  return '';
}

export function buildTournamentPayload(form, createdBy) {
  return {
    name: form.name.trim(),
    description: form.description?.trim() || null,
    sport_category_id: form.sportCategoryId,
    format: form.format || 'round_robin',
    rules: form.rules.trim(),
    max_teams: Number(form.maxTeams),
    min_teams: Number(form.minTeams),
    registration_deadline: form.registrationDeadline,
    start_date: form.startDate,
    end_date: form.endDate || null,
    match_days: form.matchDays.map(Number),
    match_times: parseMatchTimes(form.matchTimes),
    venue_requirements: form.scheduleNote?.trim() || null,
    venue_id: form.venueId || null,
    status: 'registration_open',
    created_by: createdBy || null,
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
