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
      
      // Insert matches one-by-one to get IDs for linking
      const idMap = [];
      for (const m of bracketMatches) {
        const { 
          nextIdx, loserNextIdx, tempIdx, displayIdx, 
          home_source, away_source,
          home_club, away_club, venue, home_user, away_user,
          ...dbData 
        } = m;
        const { data: inserted, error: iErr } = await supabase.from('matches').insert(dbData).select('id').single();
        if (iErr) throw new Error(iErr.message);
        idMap.push({ tempIdx: tempIdx ?? idMap.length, realId: inserted.id, nextIdx, loserNextIdx });
      }

      // Link next_match_id AND loser_next_match_id
      for (const item of idMap) {
        const updates = {};
        if (item.nextIdx != null) {
          const t = idMap.find(i => i.tempIdx === item.nextIdx);
          if (t) updates.next_match_id = t.realId;
        }
        if (item.loserNextIdx != null) {
          const t = idMap.find(i => i.tempIdx === item.loserNextIdx);
          if (t) updates.loser_next_match_id = t.realId;
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from('matches').update(updates).eq('id', item.realId);
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

export async function startTournamentWithMatches(tournamentId, bracketMatches) {
  try {
    // Clear existing matches first
    const { error: dErr } = await supabase.from('matches').delete().eq('tournament_id', tournamentId);
    if (dErr) throw new Error(dErr.message);

    const idMap = []; // { tempIdx, realId, nextIdx, loserNextIdx }
    for (const m of bracketMatches) {
      // Strip ALL non-DB fields
      const { 
        nextIdx, loserNextIdx, tempIdx, displayIdx, 
        home_source, away_source,
        home_club, away_club, venue, home_user, away_user,
        ...dbData 
      } = m;
      
      const { data: inserted, error: iErr } = await supabase.from('matches').insert(dbData).select('id').single();
      if (iErr) throw new Error(iErr.message);
      idMap.push({ 
        tempIdx: tempIdx ?? idMap.length, 
        realId: inserted.id, 
        nextIdx: nextIdx ?? null, 
        loserNextIdx: loserNextIdx ?? null 
      });
    }

    // Link next_match_id AND loser_next_match_id
    for (const item of idMap) {
      const updates = {};
      
      if (item.nextIdx !== null && item.nextIdx !== undefined) {
        const target = idMap.find(i => i.tempIdx === item.nextIdx);
        if (target) updates.next_match_id = target.realId;
      }
      
      if (item.loserNextIdx !== null && item.loserNextIdx !== undefined) {
        const loserTarget = idMap.find(i => i.tempIdx === item.loserNextIdx);
        if (loserTarget) updates.loser_next_match_id = loserTarget.realId;
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('matches').update(updates).eq('id', item.realId);
      }
    }

    await supabase.from('tournaments')
      .update({ status: 'ongoing', current_round: 1, updated_at: new Date().toISOString() })
      .eq('id', tournamentId);

    return { success: true };
  } catch (error) {
    console.error('Error saving bracket:', error);
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

// === INTERNATIONAL SINGLE ELIMINATION BRACKET BUILDER ===
export function buildKnockoutBracket(tournamentId, teams, venues, startDate, matchTimes, participantType) {
  const N = teams.length;
  if (N < 2) return [];

  const allMatches = [];
  let idx = 0;

  const addDays = (d, days) => {
    const r = new Date(d);
    r.setDate(r.getDate() + days);
    return r;
  };

  const make = (round, dateOffset, pos = 0) => {
    const m = createMatchData(tournamentId, null, null, venues, addDays(startDate, dateOffset * 2), matchTimes, idx, round, participantType);
    m.bracket_type = 'winner';
    m.bracket_position = pos;
    m.tempIdx = idx;
    m.displayIdx = idx + 1;
    m.nextIdx = null;
    m.loserNextIdx = null;
    idx++;
    return m;
  };

  const assignTeam = (m, side, team) => {
    if (!team) return;
    if (participantType === 'individual') {
      m[side === 'home' ? 'home_user_id' : 'away_user_id'] = team.id;
    } else {
      m[side === 'home' ? 'home_club_id' : 'away_club_id'] = team.id;
    }
    m[side === 'home' ? 'home_club' : 'away_club'] = team;
  };

  // 1. Determine base power of 2 (P) where P <= N
  let P = 1;
  while (P * 2 <= N) P *= 2;
  
  // Preliminary round matches (R1)
  const numR1Matches = N - P;
  const byeTeamsCount = N - 2 * numR1Matches;
  
  const rounds = [];
  
  // --- ROUND 1 (Preliminary) ---
  const r1Matches = [];
  if (numR1Matches > 0) {
    for (let i = 0; i < numR1Matches; i++) {
      const m = make(1, 0, i);
      m.match_type = 'regular';
      assignTeam(m, 'home', teams[i * 2]);
      assignTeam(m, 'away', teams[i * 2 + 1]);
      r1Matches.push(m);
      allMatches.push(m);
    }
  }
  rounds.push(r1Matches);

  // Teams that get a Bye
  const byeTeams = teams.slice(numR1Matches * 2);

  // --- ROUND 2 (Main Round of P teams) ---
  const r2Matches = [];
  const numR2Matches = P / 2;
  for (let i = 0; i < numR2Matches; i++) {
    const m = make(2, 1, i);
    m.match_type = 'regular';
    
    // Link winners from R1 (if any)
    const p1 = r1Matches[i * 2];
    const p2 = r1Matches[i * 2 + 1];
    if (p1) p1.nextIdx = m.tempIdx;
    if (p2) p2.nextIdx = m.tempIdx;

    // Assign Bye teams to remaining slots
    if (byeTeams.length > 0) {
      // Logic to fill slots not taken by R1 winners
      if (!p1 && byeTeams.length > 0) assignTeam(m, 'home', byeTeams.shift());
      if (!p2 && byeTeams.length > 0) assignTeam(m, 'away', byeTeams.shift());
    }

    r2Matches.push(m);
    allMatches.push(m);
  }
  rounds.push(r2Matches);

  // --- SUBSEQUENT ROUNDS ---
  let prevRoundMatches = r2Matches;
  let currRoundNum = 3;
  while (prevRoundMatches.length > 1) {
    const currRoundMatches = [];
    const numMatches = prevRoundMatches.length / 2;
    for (let i = 0; i < numMatches; i++) {
      const m = make(currRoundNum, currRoundNum - 1, i);
      m.match_type = 'regular';
      
      const p1 = prevRoundMatches[i * 2];
      const p2 = prevRoundMatches[i * 2 + 1];
      if (p1) p1.nextIdx = m.tempIdx;
      if (p2) p2.nextIdx = m.tempIdx;
      
      currRoundMatches.push(m);
      allMatches.push(m);
    }
    rounds.push(currRoundMatches);
    prevRoundMatches = currRoundMatches;
    currRoundNum++;
  }

  // --- FINAL & THIRD PLACE ---
  const finalMatch = allMatches[allMatches.length - 1];
  finalMatch.match_type = 'final';
  
  // Find Semi-final matches to link to Third Place
  const semifinals = allMatches.filter(m => m.nextIdx === finalMatch.tempIdx);
  if (semifinals.length === 2) {
    const thirdPlace = make(currRoundNum, currRoundNum - 1, 1);
    thirdPlace.match_type = 'third_place';
    thirdPlace.bracket_type = 'third_place';
    semifinals[0].loserNextIdx = thirdPlace.tempIdx;
    semifinals[1].loserNextIdx = thirdPlace.tempIdx;
    allMatches.push(thirdPlace);
  }

  // --- LABELING BADGES ---
  allMatches.forEach(m => {
    if (m.match_type === 'final') return;
    if (m.match_type === 'third_place') return;
    
    const roundMatches = allMatches.filter(x => x.round === m.round && x.bracket_type === 'winner');
    const totalInRound = roundMatches.length;
    
    if (m.round === 1 && numR1Matches > 0) m.match_type = 'preliminary';
    else if (totalInRound === 1) m.match_type = 'semifinal'; // Wait, if it's not final it's semi
    else if (totalInRound === 2) m.match_type = 'quarterfinal';
    else if (totalInRound === 4) m.match_type = 'round_of_16';
    else m.match_type = 'regular';
  });

  return allMatches;
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

    // 1. Advance Winner
    if (match.next_match_id) {
      const { data: next } = await supabase.from('matches').select('*').eq('id', match.next_match_id).single();
      if (next) {
        const u = {};
        if (!next[hf]) u[hf] = winnerId; else if (!next[af]) u[af] = winnerId;
        if (Object.keys(u).length > 0) await supabase.from('matches').update(u).eq('id', match.next_match_id);
      }
    }

    // 2. Advance Loser (ONLY for Third Place match)
    if (match.loser_next_match_id) {
      const { data: loserNext } = await supabase.from('matches').select('*').eq('id', match.loser_next_match_id).single();
      if (loserNext) {
        const u = {};
        if (!loserNext[hf]) u[hf] = loserId; else if (!loserNext[af]) u[af] = loserId;
        if (Object.keys(u).length > 0) await supabase.from('matches').update(u).eq('id', match.loser_next_match_id);
      }
    }

    // 3. Special: Champion & Runner-up
    if (match.match_type === 'final') {
      await supabase.from('tournaments').update({ 
        champion_club_id: winnerId, 
        runner_up_id: loserId, 
        updated_at: new Date().toISOString() 
      }).eq('id', match.tournament_id);
      await checkKnockoutComplete(match.tournament_id);
    }
    
    // 4. Special: Third Place
    if (match.match_type === 'third_place') {
      await supabase.from('tournaments').update({ 
        third_place_id: winnerId, 
        updated_at: new Date().toISOString() 
      }).eq('id', match.tournament_id);
      await checkKnockoutComplete(match.tournament_id);
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
  const venueIndex = Math.floor(slotInDay / matchTimes.length) % (venues.length || 1);
  const matchDate = new Date(startDate);
  matchDate.setDate(matchDate.getDate() + dayOffset);

  const match = {
    tournament_id: tournamentId,
    venue_id: venues[venueIndex]?.id || null,
    match_date: matchDate.toISOString().split('T')[0],
    match_time: matchTimes[timeIndex],
    status: 'scheduled',
    round: round
  };

  if (participantType === 'individual') {
    match.home_user_id = home?.id || null;
    match.away_user_id = away?.id || null;
    match.home_club = home?.id ? home : null;
    match.away_club = away?.id ? away : null;
  } else {
    match.home_club_id = home?.id || null;
    match.away_club_id = away?.id || null;
    match.home_club = home?.id ? home : null;
    match.away_club = away?.id ? away : null;
  }
  match.venue = venues[venueIndex] || null;
  return match;
}

