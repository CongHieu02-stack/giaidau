/**
 * Tournament Repository
 * SRP: Data access for Tournament entities
 */
import { BaseRepository } from './BaseRepository.js';
import { Tournament } from '../domain/Tournament.js';
import { Result } from '../utils/result.js';

export class TournamentRepository extends BaseRepository {
  constructor() {
    super('tournaments', Tournament);
  }

  /**
   * Override findAll to include related data
   */
  async findAll(options = {}) {
    const { filters = {}, orderBy = 'created_at', order = 'desc', limit = null } = options;
    
    let query = this.client
      .from(this.tableName)
      .select(`
        *,
        sport_category:sports_categories(id, name, icon_url),
        registrations:tournament_registrations(id, status)
      `);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });

    // Apply ordering
    query = query.order(orderBy, { ascending: order === 'asc' });

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) return Result.err(error.message);
    
    return Result.ok((data || []).map(item => this.domainClass.fromDB(item)));
  }

  /**
   * Find tournaments by status
   */
  async findByStatus(status) {
    return this.findAll({ filters: { status } });
  }

  /**
   * Find tournaments by sport category
   */
  async findBySportCategory(categoryId) {
    return this.findAll({ filters: { sport_category_id: categoryId } });
  }

  /**
   * Find active tournaments (ongoing or registration open)
   */
  async findActive() {
    return this.findAll({ 
      filters: { 
        status: ['ongoing', 'registration_open', 'registration_closed'] 
      } 
    });
  }

  /**
   * Find upcoming tournaments
   */
  async findUpcoming() {
    return this.findAll({ 
      filters: { status: 'upcoming' },
      orderBy: 'start_date',
      order: 'asc'
    });
  }

  /**
   * Find ongoing tournaments
   */
  async findOngoing() {
    return this.findByStatus('ongoing');
  }

  /**
   * Find completed tournaments
   */
  async findCompleted() {
    return this.findByStatus('completed');
  }

  /**
   * Find tournaments by club participation
   */
  async findByClub(clubId) {
    const { data, error } = await this.client
      .from('tournament_registrations')
      .select('tournament_id')
      .eq('club_id', clubId);

    if (error) {
      return Result.err(error.message);
    }

    if (!data || data.length === 0) {
      return Result.ok([]);
    }

    const tournamentIds = data.map(r => r.tournament_id);
    return this.findAll({ filters: { id: tournamentIds } });
  }

  /**
   * Find tournament with full details
   */
  async findWithDetails(id) {
    const { data, error } = await this.client
      .from('tournaments')
      .select(`
        *,
        sport_category:sports_categories(id, name, icon_url),
        organizer:profiles!created_by(id, full_name, avatar_url),
        registrations:tournament_registrations(
          id,
          club_id,
          user_id,
          club:clubs(id, name, logo_url),
          user:profiles!tournament_registrations_user_id_fkey(id, full_name, avatar_url),
          players:tournament_registration_players(
            player:profiles!player_id(id, full_name, avatar_url)
          ),
          status,
          registered_at,
          group_id
        ),
        matches:matches(
          id,
          home_club_id,
          away_club_id,
          home_user_id,
          away_user_id,
          home_club:clubs!home_club_id(id, name, logo_url),
          away_club:clubs!away_club_id(id, name, logo_url),
          home_user:profiles!matches_home_user_id_fkey(id, full_name, avatar_url),
          away_user:profiles!matches_away_user_id_fkey(id, full_name, avatar_url),
          venue:venues(id, name),
          referee:profiles!referee_id(id, full_name),
          match_date,
          match_time,
          home_score,
          away_score,
          status,
          match_type,
          bracket_type,
          bracket_position,
          round,
          next_match_id,
          loser_next_match_id,
          group_id,
          events:match_events(*)
        ).order('match_date', { ascending: true }).order('match_time', { ascending: true }),
        groups:tournament_groups(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return Result.err(error.message);
    }

    return Result.ok(this.domainClass.fromDB(data));
  }

  /**
   * Create tournament with registrations
   */
  async createWithDetails(tournament) {
    const { registrations, ...tournamentData } = tournament.toJSON();

    // Start transaction
    const { data: createdTournament, error: tournamentError } = await this.client
      .from(this.tableName)
      .insert(tournamentData)
      .select()
      .single();

    if (tournamentError) {
      return Result.err(tournamentError.message);
    }

    // Insert registrations if any
    if (registrations && registrations.length > 0) {
      const registrationsWithTournamentId = registrations.map(r => ({
        ...r,
        tournament_id: createdTournament.id
      }));

      const { error: regError } = await this.client
        .from('tournament_registrations')
        .insert(registrationsWithTournamentId);

      if (regError) {
        return Result.err(regError.message);
      }
    }

    return Result.ok(this.domainClass.fromDB(createdTournament));
  }

  /**
   * Approve a tournament registration
   */
  async approveRegistration(tournamentId, registrationId) {
    const { data, error } = await this.client
      .from('tournament_registrations')
      .update({ 
        status: 'approved', 
        approved_at: new Date().toISOString() 
      })
      .eq('id', registrationId)
      .eq('tournament_id', tournamentId)
      .select()
      .single();

    if (error) {
      return Result.err(error.message);
    }

    return Result.ok(data);
  }

  /**
   * Reject a tournament registration
   */
  async rejectRegistration(tournamentId, registrationId, reason) {
    const { data, error } = await this.client
      .from('tournament_registrations')
      .update({ 
        status: 'rejected',
        rejection_reason: reason 
      })
      .eq('id', registrationId)
      .eq('tournament_id', tournamentId)
      .select()
      .single();

    if (error) {
      return Result.err(error.message);
    }

    return Result.ok(data);
  }

  /**
   * Cancel a tournament
   */
  async cancel(id, reason) {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ 
        status: 'cancelled',
        cancellation_reason: reason,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Result.err(error.message);
    }

    return Result.ok(this.domainClass.fromDB(data));
  }

  /**
   * Update tournament status
   */
  async updateStatus(id, status) {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ 
        status,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Result.err(error.message);
    }

    return Result.ok(this.domainClass.fromDB(data));
  }

  /**
   * Search tournaments by name
   */
  async search(query, options = {}) {
    const { status, sportCategoryId, limit = 20 } = options;
    
    let supabaseQuery = this.client
      .from(this.tableName)
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit);

    if (status) {
      supabaseQuery = supabaseQuery.eq('status', status);
    }

    if (sportCategoryId) {
      supabaseQuery = supabaseQuery.eq('sport_category_id', sportCategoryId);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      return Result.err(error.message);
    }

    return Result.ok((data || []).map(item => this.domainClass.fromDB(item)));
  }

  /**
   * Get tournament statistics
   */
  async getStatistics() {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('status, sport_category_id');

    if (error) {
      return Result.err(error.message);
    }

    const stats = {
      total: data.length,
      byStatus: {},
      bySportCategory: {}
    };

    data.forEach(tournament => {
      stats.byStatus[tournament.status] = (stats.byStatus[tournament.status] || 0) + 1;
      stats.bySportCategory[tournament.sport_category_id] = (stats.bySportCategory[tournament.sport_category_id] || 0) + 1;
    });

    return Result.ok(stats);
  }
}

export const tournamentRepository = new TournamentRepository();
