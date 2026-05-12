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
        club:clubs(id, name, logo_url),
        user:profiles!tournament_registrations_user_id_fkey(id, full_name, avatar_url)
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
    const { data: tournament, error: tError } = await supabase
      .from('tournaments').select('*').eq('id', tournamentId).single();
    if (tError) throw new Error(tError.message);

    const { data: venues, error: vError } = await supabase
      .from('venues').select('*').in('id', venueIds);
    if (vError) throw new Error(vError.message);

    const startDate = new Date(tournament.start_date);
    const matchTimes = tournament.match_times || ['17:00', '19:00'];

    await supabase.from('matches').delete().eq('tournament_id', tournamentId);
    await supabase.from('tournament_groups').delete().eq('tournament_id', tournamentId);

    // === KNOCKOUT FORMAT ===
    if (tournament.format === 'knockout') {
      let allTeams = draftGroups.flatMap(g => g.teams || []).filter(t => t && t.id);
      
      // If no draft groups (started directly from UI for knockout), fetch approved teams
      if (allTeams.length === 0) {
        const { data: regs } = await supabase.from('tournament_registrations')
          .select('*, club:clubs(id, name, logo_url), user:profiles!tournament_registrations_user_id_fkey(id, full_name, avatar_url)')
          .eq('tournament_id', tournamentId).eq('status', 'approved');
          
        allTeams = (regs || []).map(r => tournament.participant_type === 'individual'
          ? (r.user ? { id: r.user.id, name: r.user.full_name, avatar_url: r.user.avatar_url } : null)
          : (r.club ? { id: r.club.id, name: r.club.name, logo_url: r.club.logo_url } : null)
        ).filter(Boolean);
      }

      if (allTeams.length < 2) throw new Error('Cần ít nhất 2 đội để bắt đầu giải đấu loại trực tiếp');

      const bracketMatches = buildKnockoutBracket(tournamentId, allTeams, venues, startDate, matchTimes, tournament.participant_type);
      
      // Insert matches one-by-one to get IDs for next_match_id linking
      const insertedIds = [];
      for (const m of bracketMatches) {
        const { _nextIdx, ...dbData } = m;
        const { data: inserted, error: iErr } = await supabase.from('matches').insert(dbData).select('id').single();
        if (iErr) throw new Error(iErr.message);
        insertedIds.push(inserted.id);
      }

      // Link next_match_id: match at position i feeds into match at floor((i-1)/2) in next round
      for (let i = 0; i < bracketMatches.length; i++) {
        const nextIdx = bracketMatches[i]._nextIdx;
        if (nextIdx !== null && nextIdx !== undefined && insertedIds[nextIdx]) {
          await supabase.from('matches').update({ next_match_id: insertedIds[nextIdx] }).eq('id', insertedIds[i]);
          
          // If Round 1 match is a BYE (already marked completed in builder), advance it now
          if (bracketMatches[i].status === 'completed' && bracketMatches[i].winner_id) {
            await advanceKnockoutWinner(insertedIds[i]);
          }
        }
      }

      await supabase.from('tournaments')
        .update({ status: 'ongoing', current_round: 1, updated_at: new Date().toISOString() })
        .eq('id', tournamentId);
      return { success: true };
    }

    // === ROUND ROBIN FORMAT ===
    const allMatches = [];
    let totalMatchCount = 0;

    for (const groupData of draftGroups) {
      if (!groupData.teams || groupData.teams.length === 0) continue;
      const { data: group, error: gError } = await supabase
        .from('tournament_groups')
        .insert({ tournament_id: tournamentId, name: groupData.name })
        .select().single();
      if (gError) throw new Error(gError.message);

      const teamIds = groupData.teams.map(t => t.id);
      const idField = tournament.participant_type === 'individual' ? 'user_id' : 'club_id';
      await supabase.from('tournament_registrations')
        .update({ group_id: group.id })
        .eq('tournament_id', tournamentId)
        .in(idField, teamIds);

      const groupMatches = generateRoundRobin(tournamentId, groupData.teams, venues, startDate, matchTimes, totalMatchCount, tournament.participant_type);
      groupMatches.forEach(m => { m.group_id = group.id; allMatches.push(m); });
      totalMatchCount += groupMatches.length;
    }

    if (allMatches.length > 0) {
      const { error: mError } = await supabase.from('matches').insert(allMatches);
      if (mError) throw new Error(mError.message);
    }

    await supabase.from('tournaments')
      .update({ status: 'ongoing', current_round: 1, updated_at: new Date().toISOString() })
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
function generateRoundRobin(tournamentId, clubs, venues, startDate, matchTimes, startMatchIndex = 0, participantType = 'team') {
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
        matches.push(createMatchData(tournamentId, home, away, venues, startDate, matchTimes, matchCount, round + 1, participantType));
        matchCount++;
      }
    }
    teamList.splice(1, 0, teamList.pop());
  }
  return matches;
}

// === KNOCKOUT BRACKET BUILDER ===
function buildKnockoutBracket(tournamentId, teams, venues, startDate, matchTimes, participantType) {
  const shuffled = shuffle([...teams]);
  let slots = 2;
  while (slots < shuffled.length) slots *= 2;
  while (shuffled.length < slots) shuffled.push({ id: null, name: 'BYE' });

  const totalRounds = Math.log2(slots);
  const allMatches = [];
  let matchIdx = 0;
  const roundMatches = [];

  // Determine which teams play in Round 1 and which get BYEs
  // Number of matches that actually have 2 teams
  const numRegularMatches = shuffled.filter(t => t.id).length - (slots / 2);
  const numByeMatches = (slots / 2) - numRegularMatches;

  const r1 = [];
  const realTeams = shuffled.filter(t => t.id);
  
  // 1. Create matches for teams that MUST play
  for (let i = 0; i < numRegularMatches; i++) {
    const home = realTeams.pop();
    const away = realTeams.pop();
    const m = createMatchData(tournamentId, home, away, venues, startDate, matchTimes, matchIdx, 1, participantType);
    m.bracket_position = matchIdx;
    m.match_type = 'regular';
    m._nextIdx = null;
    r1.push(allMatches.length);
    allMatches.push(m);
    matchIdx++;
  }

  // 2. Create BYE matches for remaining teams
  for (let i = 0; i < numByeMatches; i++) {
    const team = realTeams.pop();
    const m = createMatchData(tournamentId, team, {id: null}, venues, startDate, matchTimes, matchIdx, 1, participantType);
    m.bracket_position = matchIdx;
    m.match_type = 'regular';
    m._nextIdx = null;
    m.status = 'completed';
    m.winner_id = team.id;
    m.home_score = 0; m.away_score = 0;
    r1.push(allMatches.length);
    allMatches.push(m);
    matchIdx++;
  }
  roundMatches.push(r1);

  for (let round = 2; round <= totalRounds; round++) {
    const prevIndices = roundMatches[round - 2];
    const thisRound = [];
    const rd = new Date(startDate);
    rd.setDate(rd.getDate() + (round - 1) * 2);
    for (let i = 0; i < prevIndices.length; i += 2) {
      const m = createMatchData(tournamentId, {id: null}, {id: null}, venues, rd, matchTimes, matchIdx, round, participantType);
      m.bracket_position = matchIdx;
      m._nextIdx = null;
      delete m.home_club_id; delete m.away_club_id;
      delete m.home_user_id; delete m.away_user_id;
      m.match_type = round === totalRounds ? 'final' : (round === totalRounds - 1 && totalRounds > 2) ? 'semifinal' : 'regular';
      const idx = allMatches.length;
      thisRound.push(idx);
      allMatches.push(m);
      allMatches[prevIndices[i]]._nextIdx = idx;
      allMatches[prevIndices[i + 1]]._nextIdx = idx;
      matchIdx++;
    }
    roundMatches.push(thisRound);
  }

  // Third-place match
  if (totalRounds >= 2) {
    const td = new Date(startDate);
    td.setDate(td.getDate() + (totalRounds - 1) * 2);
    const m3 = createMatchData(tournamentId, {id: null}, {id: null}, venues, td, matchTimes, matchIdx, totalRounds, participantType);
    m3.bracket_position = matchIdx;
    m3.match_type = 'third_place';
    m3._nextIdx = null;
    delete m3.home_club_id; delete m3.away_club_id;
    delete m3.home_user_id; delete m3.away_user_id;
    allMatches.push(m3);
  }

  return allMatches.map(m => {
    const { _nextIdx, ...dbMatch } = m;
    return { ...dbMatch, _nextIdx };
  });
}

// === ADVANCE KNOCKOUT WINNER ===
export async function advanceKnockoutWinner(matchId) {
  try {
    const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single();
    if (!match || match.status !== 'completed') return { success: false, error: 'Trận chưa kết thúc' };

    const winnerId = match.home_score > match.away_score
      ? (match.home_club_id || match.home_user_id)
      : (match.away_club_id || match.away_user_id);
    const loserId = match.home_score > match.away_score
      ? (match.away_club_id || match.away_user_id)
      : (match.home_club_id || match.home_user_id);

    await supabase.from('matches').update({ winner_id: winnerId }).eq('id', matchId);

    const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', match.tournament_id).single();
    const isInd = tournament?.participant_type === 'individual';
    const hf = isInd ? 'home_user_id' : 'home_club_id';
    const af = isInd ? 'away_user_id' : 'away_club_id';

    if (match.match_type === 'final') {
      await supabase.from('tournaments').update({ champion_club_id: winnerId, runner_up_id: loserId, updated_at: new Date().toISOString() }).eq('id', match.tournament_id);
      await checkKnockoutComplete(match.tournament_id);
      return { success: true };
    }
    if (match.match_type === 'third_place') {
      await supabase.from('tournaments').update({ third_place_id: winnerId, updated_at: new Date().toISOString() }).eq('id', match.tournament_id);
      await checkKnockoutComplete(match.tournament_id);
      return { success: true };
    }
    if (match.match_type === 'semifinal') {
      const { data: thirdMatch } = await supabase.from('matches').select('*').eq('tournament_id', match.tournament_id).eq('match_type', 'third_place').single();
      if (thirdMatch) {
        const u = {};
        if (!thirdMatch[hf]) u[hf] = loserId; else if (!thirdMatch[af]) u[af] = loserId;
        if (Object.keys(u).length > 0) await supabase.from('matches').update(u).eq('id', thirdMatch.id);
      }
    }
    if (match.next_match_id) {
      const { data: next } = await supabase.from('matches').select('*').eq('id', match.next_match_id).single();
      if (next) {
        const u = {};
        if (!next[hf]) u[hf] = winnerId; else if (!next[af]) u[af] = winnerId;
        if (Object.keys(u).length > 0) await supabase.from('matches').update(u).eq('id', match.next_match_id);
      }
    }
    return { success: true };
  } catch (error) {
    console.error('[advanceKnockoutWinner]', error);
    return { success: false, error: error.message };
  }
}

async function checkKnockoutComplete(tournamentId) {
  const { data: matches } = await supabase.from('matches').select('status, match_type').eq('tournament_id', tournamentId);
  const finalDone = matches?.find(m => m.match_type === 'final')?.status === 'completed';
  const thirdDone = matches?.find(m => m.match_type === 'third_place')?.status === 'completed';
  if (finalDone && thirdDone) {
    await supabase.from('tournaments').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', tournamentId);
  }
}

// === ROUND ROBIN: GENERATE NEXT ROUND ===
export async function generateNextRound(tournamentId) {
  try {
    const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single();
    if (!tournament) return { success: false, error: 'Giải không tồn tại' };
    const currentRound = tournament.current_round || 1;
    if (currentRound >= 4) return await checkAndFinalizeTournament(tournamentId);

    const { data: currentMatches } = await supabase.from('matches').select('status').eq('tournament_id', tournamentId).eq('round', currentRound);
    if (!currentMatches?.every(m => m.status === 'completed')) return { success: false, error: 'Chưa hoàn thành vòng hiện tại' };

    const nextRound = currentRound + 1;
    const { data: regs } = await supabase.from('tournament_registrations')
      .select('*, club:clubs(id, name, logo_url), user:profiles!tournament_registrations_user_id_fkey(id, full_name, avatar_url)')
      .eq('tournament_id', tournamentId).eq('status', 'approved');

    const teams = (regs || []).map(r => tournament.participant_type === 'individual'
      ? (r.user ? { id: r.user.id, name: r.user.full_name } : null)
      : (r.club ? { id: r.club.id, name: r.club.name } : null)
    ).filter(Boolean);

    const { data: venues } = await supabase.from('venues').select('*').eq('id', tournament.venue_id);
    if (!venues?.length) return { success: false, error: 'Không tìm thấy sân' };

    const sd = new Date(tournament.start_date);
    sd.setDate(sd.getDate() + (nextRound - 1) * 7);
    const mt = tournament.match_times || ['17:00', '19:00'];
    const newMatches = generateRoundRobin(tournamentId, teams, venues, sd, mt, 0, tournament.participant_type);
    newMatches.forEach(m => { m.round = nextRound; });

    if (newMatches.length > 0) {
      const { error } = await supabase.from('matches').insert(newMatches);
      if (error) throw new Error(error.message);
    }
    await supabase.from('tournaments').update({ current_round: nextRound, updated_at: new Date().toISOString() }).eq('id', tournamentId);
    return { success: true, nextRound };
  } catch (error) {
    console.error('[generateNextRound]', error);
    return { success: false, error: error.message };
  }
}

// === FINALIZE TOURNAMENT (Round Robin) ===
export async function checkAndFinalizeTournament(tournamentId) {
  try {
    const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single();
    if (!tournament || tournament.status === 'completed') return { success: true };
    const currentRound = tournament.current_round || 1;

    const { data: roundMatches } = await supabase.from('matches').select('status').eq('tournament_id', tournamentId).eq('round', currentRound);
    if (!roundMatches?.every(m => m.status === 'completed')) return { success: false, error: 'Chưa hoàn thành vòng' };
    if (currentRound < 4) return await generateNextRound(tournamentId);

    const { data: allMatches } = await supabase.from('matches').select('*').eq('tournament_id', tournamentId).eq('status', 'completed');
    const standings = {};
    (allMatches || []).forEach(m => {
      const hid = m.home_club_id || m.home_user_id;
      const aid = m.away_club_id || m.away_user_id;
      if (!hid || !aid) return;
      if (!standings[hid]) standings[hid] = { id: hid, points: 0, gd: 0, gf: 0 };
      if (!standings[aid]) standings[aid] = { id: aid, points: 0, gd: 0, gf: 0 };
      const hs = Number(m.home_score || 0), as = Number(m.away_score || 0);
      standings[hid].gf += hs; standings[hid].gd += (hs - as);
      standings[aid].gf += as; standings[aid].gd += (as - hs);
      if (hs > as) standings[hid].points += 3;
      else if (hs < as) standings[aid].points += 3;
      else { standings[hid].points += 1; standings[aid].points += 1; }
    });

    const sorted = Object.values(standings).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
    await supabase.from('tournaments').update({
      status: 'completed', champion_club_id: sorted[0]?.id, runner_up_id: sorted[1]?.id, third_place_id: sorted[2]?.id, updated_at: new Date().toISOString()
    }).eq('id', tournamentId);
    return { success: true };
  } catch (error) {
    console.error('[checkAndFinalizeTournament]', error);
    return { success: false, error: error.message };
  }
}

function createMatchData(tournamentId, home, away, venues, startDate, matchTimes, matchIndex, round, participantType = 'team') {
  const dayOffset = Math.floor(matchIndex / (matchTimes.length * venues.length));
  const slotInDay = matchIndex % (matchTimes.length * venues.length);
  const timeIndex = slotInDay % matchTimes.length;
  const venueIndex = Math.floor(slotInDay / matchTimes.length) % venues.length;
  const matchDate = new Date(startDate);
  matchDate.setDate(matchDate.getDate() + dayOffset);

  const match = {
    tournament_id: tournamentId,
    venue_id: venues[venueIndex].id,
    match_date: matchDate.toISOString().split('T')[0],
    match_time: matchTimes[timeIndex],
    status: 'scheduled',
    round: round
  };

  if (participantType === 'individual') {
    match.home_user_id = home.id;
    match.away_user_id = away.id;
  } else {
    match.home_club_id = home.id;
    match.away_club_id = away.id;
  }
  return match;
}

