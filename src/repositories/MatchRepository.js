/**
 * Match Repository
 * SRP: Data access for Match entities
 */
import { BaseRepository } from './BaseRepository.js';
import { Match } from '../domain/Match.js';
import { Result } from '../utils/result.js';

export class MatchRepository extends BaseRepository {
  constructor() {
    super('matches', Match);
  }

  async findByTournament(tournamentId) {
    return this.findAll({ filters: { tournament_id: tournamentId } });
  }

  async findByReferee(refereeId) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        home_club:clubs!home_club_id(id, name, logo_url),
        away_club:clubs!away_club_id(id, name, logo_url),
        home_user:profiles!matches_home_user_id_fkey(id, full_name, avatar_url),
        away_user:profiles!matches_away_user_id_fkey(id, full_name, avatar_url),
        venue:venues(id, name),
        tournament:tournaments(id, name, participant_type, tournament_mode, sport_category:sports_categories(id, name))
      `)
      .eq('referee_id', refereeId)
      .order('match_date', { ascending: true });

    if (error) return Result.err(error.message);
    return Result.ok(data || []);
  }

  async findByIdWithDetails(id) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        home_club:clubs!home_club_id(id, name, logo_url),
        away_club:clubs!away_club_id(id, name, logo_url),
        home_user:profiles!matches_home_user_id_fkey(id, full_name, avatar_url),
        away_user:profiles!matches_away_user_id_fkey(id, full_name, avatar_url),
        venue:venues(id, name),
        tournament:tournaments(id, name, format, participant_type, tournament_mode, scoring_type, unit, sport_category:sports_categories(id, name)),
        referee:profiles!referee_id(id, full_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) return Result.err(error.message);
    return Result.ok(data);
  }

  async findByClub(clubId) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`);

    if (error) return Result.err(error.message);
    return Result.ok((data || []).map(item => this.domainClass.fromDB(item)));
  }

  async findScheduled() {
    return this.findAll({ filters: { status: 'scheduled' } });
  }

  async findInProgress() {
    return this.findAll({ filters: { status: 'in_progress' } });
  }

  async updateScore(id, homeScore, awayScore) {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ home_score: homeScore, away_score: awayScore })
      .eq('id', id)
      .select()
      .single();

    if (error) return Result.err(error.message);
    return Result.ok(this.domainClass.fromDB(data));
  }

  async updateStatus(id, status, extraFields = {}) {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ status, ...extraFields })
      .eq('id', id)
      .select()
      .single();

    if (error) return Result.err(error.message);
    return Result.ok(this.domainClass.fromDB(data));
  }

  // Match Events
  async getMatchEvents(matchId) {
    const { data, error } = await this.client
      .from('match_events')
      .select(`
        *,
        player:profiles!player_id(id, full_name, avatar_url),
        club:clubs(id, name, logo_url)
      `)
      .eq('match_id', matchId)
      .order('minute', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) return Result.err(error.message);
    return Result.ok(data || []);
  }

  async addMatchEvent(eventData) {
    const { data, error } = await this.client
      .from('match_events')
      .insert(eventData)
      .select(`
        *,
        player:profiles!player_id(id, full_name, avatar_url),
        club:clubs(id, name, logo_url)
      `)
      .single();

    if (error) return Result.err(error.message);
    return Result.ok(data);
  }

  async deleteMatchEvent(eventId) {
    const { error } = await this.client
      .from('match_events')
      .delete()
      .eq('id', eventId);

    if (error) return Result.err(error.message);
    return Result.ok(true);
  }

  // Match Attendance
  async getMatchAttendance(matchId) {
    const { data, error } = await this.client
      .from('match_attendance')
      .select(`
        *,
        player:player_id(id, full_name, avatar_url),
        club:club_id(id, name)
      `)
      .eq('match_id', matchId);

    if (error) return Result.err(error.message);
    return Result.ok(data || []);
  }

  async upsertAttendance(matchId, playerId, clubId, isPresent, resultValue = null) {
    const payload = {
      match_id: matchId,
      player_id: playerId,
      club_id: clubId,
      is_present: isPresent,
      checked_at: isPresent ? new Date().toISOString() : null
    };
    if (resultValue !== null) payload.result_value = resultValue;

    const { data, error } = await this.client
      .from('match_attendance')
      .upsert(payload, { onConflict: 'match_id,player_id' })
      .select()
      .single();

    if (error) return Result.err(error.message);
    return Result.ok(data);
  }

  async updateResultValue(matchId, playerId, value) {
    const { data, error } = await this.client
      .from('match_attendance')
      .update({ result_value: value })
      .match({ match_id: matchId, player_id: playerId })
      .select()
      .single();

    if (error) return Result.err(error.message);
    return Result.ok(data);
  }

  // Get club members for attendance
  async getClubMembers(clubId) {
    const { data, error } = await this.client
      .from('club_members')
      .select(`
        id,
        user:profiles!user_id(id, full_name, avatar_url),
        role,
        status
      `)
      .eq('club_id', clubId)
      .eq('status', 'approved');

    if (error) return Result.err(error.message);
    return Result.ok(data || []);
  }
}

export const matchRepository = new MatchRepository();
