import { supabase } from '../../config/supabase.js';
import { parseMatchTimes } from './adminCreateTournament.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function countRegistrations(tournament) {
  return Array.isArray(tournament.registrations) ? tournament.registrations.length : 0;
}

export async function fetchAdminTournaments() {
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      sport_category:sports_categories(id, name),
      venue:venues(id, name),
      registrations:tournament_registrations(id, status)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((tournament) => ({
    ...tournament,
    registration_count: countRegistrations(tournament),
    approved_count: (tournament.registrations || []).filter((item) => item.status === 'approved').length
  }));
}

export async function fetchAdminTournament(id) {
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      sport_category:sports_categories(id, name),
      venue:venues(id, name),
      registrations:tournament_registrations(id, status)
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...data,
    registration_count: countRegistrations(data),
    approved_count: (data.registrations || []).filter((item) => item.status === 'approved').length
  };
}

export function validateTournamentUpdate(form, registrationCount) {
  const maxTeams = Number(form.maxTeams);
  const minimum = Number(registrationCount || 0);

  if (!Number.isInteger(maxTeams) || maxTeams < 2) {
    return 'Số lượng câu lạc bộ tham gia phải từ 2 trở lên.';
  }

  if (maxTeams < minimum) {
    return `Số lượng câu lạc bộ không được nhỏ hơn số đội đã đăng ký (${minimum}).`;
  }

  if (!form.rules?.trim()) return 'Vui lòng nhập thể lệ giải đấu.';
  if (!form.registrationDeadline) return 'Vui lòng chọn ngày hết hạn đăng ký.';
  if (!form.startDate) return 'Vui lòng chọn ngày thi đấu.';

  const deadline = new Date(form.registrationDeadline);
  const startDate = new Date(form.startDate);
  const endDate = form.endDate ? new Date(form.endDate) : null;

  if (Number.isNaN(deadline.getTime())) return 'Ngày hết hạn đăng ký không hợp lệ.';
  if (Number.isNaN(startDate.getTime())) return 'Ngày thi đấu không hợp lệ.';
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

export async function updateTournamentForAdmin(id, form, registrationCount) {
  const validationError = validateTournamentUpdate(form, registrationCount);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const { data, error } = await supabase
    .from('tournaments')
    .update({
      rules: form.rules.trim(),
      max_teams: Number(form.maxTeams),
      registration_deadline: form.registrationDeadline,
      start_date: form.startDate,
      end_date: form.endDate || null,
      match_days: form.matchDays.map(Number),
      match_times: parseMatchTimes(form.matchTimes),
      venue_requirements: form.scheduleNote?.trim() || null,
      venue_id: form.venueId || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function cancelTournamentForAdmin(id, reason) {
  const trimmedReason = reason?.trim() || '';
  if (trimmedReason.length < 10) {
    return { success: false, error: 'Vui lòng nhập lý do hủy ít nhất 10 ký tự.' };
  }

  const { data, error } = await supabase
    .from('tournaments')
    .update({
      status: 'cancelled',
      cancellation_reason: trimmedReason,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
