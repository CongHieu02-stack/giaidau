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
    return this.findAll({ filters: { referee_id: refereeId } });
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

  async updateStatus(id, status) {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) return Result.err(error.message);
    return Result.ok(this.domainClass.fromDB(data));
  }
}

export const matchRepository = new MatchRepository();
