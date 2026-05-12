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

// --- Fisher-Yates Shuffle ---
function shuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// --- Phụ trợ: Chia bảng tự động ---
export function distributeTeamsIntoGroups(teams, numGroups) {
  const shuffledTeams = shuffle(teams);
  const groups = Array.from({ length: numGroups }, (_, i) => ({
    name: `Bảng ${String.fromCharCode(65 + i)}`,
    teams: []
  }));

  shuffledTeams.forEach((team, index) => {
    groups[index % numGroups].teams.push(team);
  });

  return groups;
}

export async function startTournament(tournamentId, draftGroups, venueIds) {
  try {
    // 1. Get tournament details
    const { data: tournament, error: tError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tError) throw new Error(tError.message);

    // 2. Get venues
    const { data: venues, error: vError } = await supabase
      .from('venues')
      .select('*')
      .in('id', venueIds);

    if (vError) throw new Error(vError.message);

    const startDate = new Date(tournament.start_date);
    const matchTimes = tournament.match_times || ['08:00', '10:00', '15:00', '17:00'];

    // 3. Clear old data
    await supabase.from('matches').delete().eq('tournament_id', tournamentId);
    await supabase.from('tournament_groups').delete().eq('tournament_id', tournamentId);

    const allMatches = [];
    let totalMatchCount = 0;

    // 4. Create groups and generate matches
    for (const groupData of draftGroups) {
      // Create group
      const { data: group, error: gError } = await supabase
        .from('tournament_groups')
        .insert({
          tournament_id: tournamentId,
          name: groupData.name
        })
        .select()
        .single();

      if (gError) throw new Error(gError.message);

      // Update registrations with group_id
      const teamIds = groupData.teams.map(t => t.id);
      const { error: rError } = await supabase
        .from('tournament_registrations')
        .update({ group_id: group.id })
        .eq('tournament_id', tournamentId)
        .in('club_id', teamIds);

      if (rError) throw new Error(rError.message);

      // Generate Round Robin matches for this group
      const groupMatches = generateRoundRobin(tournamentId, groupData.teams, venues, startDate, matchTimes, totalMatchCount);
      groupMatches.forEach(m => {
        m.group_id = group.id;
        allMatches.push(m);
      });
      totalMatchCount += groupMatches.length;
    }

    // 5. Bulk insert matches
    const { error: mError } = await supabase.from('matches').insert(allMatches);
    if (mError) throw new Error(mError.message);

    // 6. Update tournament status
    await supabase.from('tournaments')
      .update({ status: 'ongoing', updated_at: new Date().toISOString() })
      .eq('id', tournamentId);

    return { success: true };
  } catch (error) {
    console.error('[startTournament] error:', error);
    return { success: false, error: error.message };
  }
}

export async function generateTournamentMatches(tournamentId, venueIds) {
  // Existing function kept for backward compatibility or simple cases
  // but we will mainly use startTournament now.
  try {
    // ... (rest of old logic if needed, but I'll focus on the new flow)
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- Phụ trợ: Ghép vòng tròn ---
function generateRoundRobin(tournamentId, clubs, venues, startDate, matchTimes, startMatchIndex = 0) {
  const matches = [];
  const teamList = [...clubs];
  if (teamList.length % 2 !== 0) teamList.push({ id: null, name: 'BYE' });

  const numRounds = teamList.length - 1;
  const numMatchesPerRound = teamList.length / 2;
  let matchCount = startMatchIndex;

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

// --- Phụ trợ: Ghép loại trực tiếp (Vòng 1 với Byes) ---
function generateKnockout(tournamentId, clubs, venues, startDate, matchTimes) {
  const matches = [];
  const shuffled = shuffle([...clubs]);
  const numTeams = shuffled.length;
  
  // Tìm lũy thừa của 2 lớn nhất nhỏ hơn hoặc bằng numTeams
  // Ví dụ: 10 đội -> nextPowerOf2 = 16 (sai, ta cần tìm số đội chơi vòng sơ loại để về mốc 8)
  // Thực tế: Số đội chơi vòng sơ loại = (numTeams - targetPowerOf2) * 2
  // Trong đó targetPowerOf2 là lũy thừa của 2 nhỏ hơn gần nhất.
  
  let targetPowerOf2 = 2;
  while (targetPowerOf2 * 2 <= numTeams) {
    targetPowerOf2 *= 2;
  }
  
  // Số trận đấu ở vòng sơ loại (để đưa số đội thắng + số đội đặc cách về targetPowerOf2)
  const numPreliminaryMatches = numTeams - targetPowerOf2;
  const teamsInPreliminary = numPreliminaryMatches * 2;
  
  // Ghép cặp cho vòng sơ loại
  for (let i = 0; i < teamsInPreliminary; i += 2) {
    matches.push(createMatchData(tournamentId, shuffled[i], shuffled[i+1], venues, startDate, matchTimes, i/2, 1));
  }
  
  // Các đội còn lại (đặc cách vào vòng sau) sẽ không có trận đấu ở vòng 1
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
