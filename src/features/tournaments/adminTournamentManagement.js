import { supabase } from '../../config/supabase.js';


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
  if (!id) throw new Error('Tournament ID is required');

  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      sport_category:sports_categories(id, name),
      venue:venues(id, name),
      registrations:tournament_registrations(
        id, 
        status, 
        registered_at,
        club:clubs(id, name, logo_url)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Không tìm thấy giải đấu');

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

  if (!form.startTime) return 'Vui lòng chọn giờ bắt đầu thi đấu.';
  if (!TIME_PATTERN.test(form.startTime)) return 'Giờ bắt đầu thi đấu không hợp lệ.';
  if (form.endTime && !TIME_PATTERN.test(form.endTime)) return 'Giờ kết thúc thi đấu không hợp lệ.';

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
      match_days: [],
      match_times: [form.startTime, form.endTime].filter(Boolean),
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
export async function approveTournamentRegistration(regId) {
  const { data, error } = await supabase
    .from('tournament_registrations')
    .update({ status: 'approved' })
    .eq('id', regId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function rejectTournamentRegistration(regId, reason) {
  const { data, error } = await supabase
    .from('tournament_registrations')
    .update({ 
      status: 'rejected',
      rejection_reason: reason 
    })
    .eq('id', regId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function generateTournamentMatches(tournamentId, venueIds) {
  try {
    // 1. Get tournament details with approved registrations
    const { data: tournament, error: tError } = await supabase
      .from('tournaments')
      .select(`
        *,
        registrations:tournament_registrations(
          id,
          status,
          club:clubs(id, name, logo_url)
        )
      `)
      .eq('id', tournamentId)
      .single();

    if (tError) throw new Error(tError.message);

    const approvedClubs = (tournament.registrations || [])
      .filter(r => r.status === 'approved')
      .map(r => r.club);

    if (approvedClubs.length < 2) {
      throw new Error('Cần ít nhất 2 câu lạc bộ đã duyệt để ghép cặp.');
    }

    // 2. Get venues
    const { data: venues, error: vError } = await supabase
      .from('venues')
      .select('*')
      .in('id', venueIds);

    if (vError) throw new Error(vError.message);
    if (!venues || venues.length === 0) {
      throw new Error('Vui lòng chọn ít nhất một sân đấu.');
    }

    let matches = [];
    const format = tournament.format || 'round_robin';
    const startDate = new Date(tournament.start_date);
    const matchTimes = tournament.match_times || ['08:00', '10:00', '15:00', '17:00'];

    if (format === 'round_robin') {
      matches = generateRoundRobin(tournamentId, approvedClubs, venues, startDate, matchTimes);
    } else if (format === 'knockout') {
      matches = generateKnockout(tournamentId, approvedClubs, venues, startDate, matchTimes);
    } else if (format === 'hybrid') {
      matches = generateHybrid(tournamentId, approvedClubs, venues, startDate, matchTimes);
    }

    // 3. Save matches
    await supabase.from('matches').delete().eq('tournament_id', tournamentId);
    const { error: mError } = await supabase.from('matches').insert(matches);
    if (mError) throw new Error(mError.message);

    // 4. Update status
    await supabase.from('tournaments')
      .update({ status: 'ongoing', updated_at: new Date().toISOString() })
      .eq('id', tournamentId);

    return { success: true, count: matches.length };
  } catch (error) {
    console.error('[generateTournamentMatches] error:', error);
    return { success: false, error: error.message };
  }
}

// --- Phụ trợ: Ghép vòng tròn ---
function generateRoundRobin(tournamentId, clubs, venues, startDate, matchTimes) {
  const matches = [];
  const teamList = [...clubs];
  if (teamList.length % 2 !== 0) teamList.push({ id: null, name: 'BYE' });

  const numRounds = teamList.length - 1;
  const numMatchesPerRound = teamList.length / 2;
  let matchCount = 0;

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < numMatchesPerRound; i++) {
      const home = teamList[i];
      const away = teamList[teamList.length - 1 - i];
      if (home.id && away.id) {
        matches.push(createMatchData(tournamentId, home, away, venues, startDate, matchTimes, matchCount, round + 1));
        matchCount++;
      }
    }
    teamList.splice(1, 0, teamList.pop());
  }
  return matches;
}

// --- Phụ trợ: Ghép loại trực tiếp (Vòng 1) ---
function generateKnockout(tournamentId, clubs, venues, startDate, matchTimes) {
  const matches = [];
  const shuffled = [...clubs].sort(() => Math.random() - 0.5);
  
  // Chỉ ghép cặp vòng đầu tiên
  for (let i = 0; i < shuffled.length; i += 2) {
    if (shuffled[i + 1]) {
      matches.push(createMatchData(tournamentId, shuffled[i], shuffled[i+1], venues, startDate, matchTimes, i/2, 1));
    }
  }
  return matches;
}

// --- Phụ trợ: Ghép kết hợp (Vòng bảng) ---
function generateHybrid(tournamentId, clubs, venues, startDate, matchTimes) {
  const matches = [];
  const groupSize = 4;
  const numGroups = Math.ceil(clubs.length / groupSize);
  const groups = Array.from({ length: numGroups }, () => []);
  
  clubs.forEach((club, index) => groups[index % numGroups].push(club));

  let totalMatchCount = 0;
  groups.forEach((groupClubs, groupIdx) => {
    const groupMatches = generateRoundRobin(tournamentId, groupClubs, venues, startDate, matchTimes);
    groupMatches.forEach(m => {
      // Điều chỉnh lại thời gian để không bị trùng giữa các bảng nếu ít sân
      const adjustedMatch = createMatchData(tournamentId, {id: m.home_club_id}, {id: m.away_club_id}, venues, startDate, matchTimes, totalMatchCount, 1);
      adjustedMatch.group_name = `Bảng ${String.fromCharCode(65 + groupIdx)}`;
      matches.push(adjustedMatch);
      totalMatchCount++;
    });
  });
  return matches;
}

function createMatchData(tournamentId, home, away, venues, startDate, matchTimes, matchIndex, round) {
  const dayOffset = Math.floor(matchIndex / (matchTimes.length * venues.length));
  const slotInDay = matchIndex % (matchTimes.length * venues.length);
  const timeIndex = slotInDay % matchTimes.length;
  const venueIndex = Math.floor(slotInDay / matchTimes.length) % venues.length;

  const matchDate = new Date(startDate);
  matchDate.setDate(matchDate.getDate() + dayOffset);

  return {
    tournament_id: tournamentId,
    home_club_id: home.id,
    away_club_id: away.id,
    venue_id: venues[venueIndex].id,
    match_date: matchDate.toISOString().split('T')[0],
    match_time: matchTimes[timeIndex],
    status: 'scheduled',
    round: round
  };
}
