/**
 * Tournament Service
 * SRP: Tournament business logic and operations
 */
import { supabase } from '../config/supabase.js';
import { tournamentRepository } from '../repositories/TournamentRepository.js';
import { clubRepository } from '../repositories/ClubRepository.js';
import { Tournament } from '../domain/Tournament.js';
import { Result } from '../utils/result.js';

export class TournamentService {
  constructor() {
    this.tournamentRepo = tournamentRepository;
    this.clubRepo = clubRepository;
  }

  /**
   * Create a new tournament
   */
  async createTournament(tournamentData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['name', 'sportCategoryId', 'maxTeams', 'minTeams', 'registrationDeadline', 'startDate'];
      for (const field of requiredFields) {
        if (!tournamentData[field]) {
          return Result.err(`Missing required field: ${field}`);
        }
      }

      // Validate team counts
      if (tournamentData.minTeams < 2) {
        return Result.err('Minimum teams must be at least 2');
      }
      if (tournamentData.maxTeams < tournamentData.minTeams) {
        return Result.err('Maximum teams must be greater than or equal to minimum teams');
      }

      // Validate dates
      const regDeadline = new Date(tournamentData.registrationDeadline);
      const startDate = new Date(tournamentData.startDate);
      const now = new Date();

      if (regDeadline < now) {
        return Result.err('Registration deadline must be in the future');
      }

      if (startDate < regDeadline) {
        return Result.err('Start date must be after registration deadline');
      }

      // Create tournament entity
      const tournament = new Tournament({
        ...tournamentData,
        createdBy: userId,
        status: 'registration_open'
      });

      // Save to database
      const result = await this.tournamentRepo.create(tournament);
      return result;
    } catch (error) {
      return Result.err(error.message || 'Failed to create tournament');
    }
  }

  /**
   * Update tournament
   */
  async updateTournament(tournamentId, updateData, userId) {
    try {
      // Get existing tournament
      const tournamentResult = await this.tournamentRepo.findById(tournamentId);
      if (tournamentResult.isErr()) {
        return Result.err('Tournament not found');
      }

      const tournament = tournamentResult.getValue();

      // Check if can edit
      if (!tournament.canEdit()) {
        return Result.err('Tournament cannot be edited in current status');
      }

      // Validate max teams is not less than approved registrations
      if (updateData.maxTeams !== undefined) {
        const approvedCount = tournament.approvedCount;
        if (updateData.maxTeams < approvedCount) {
          return Result.err(`Cannot reduce max teams below current approved count (${approvedCount})`);
        }
      }

      // Update fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          tournament[key] = updateData[key];
        }
      });

      tournament.updatedAt = new Date();

      const result = await this.tournamentRepo.update(tournament);
      return result;
    } catch (error) {
      return Result.err(error.message || 'Failed to update tournament');
    }
  }

  /**
   * Cancel tournament
   */
  async cancelTournament(tournamentId, reason, userId) {
    try {
      if (!reason || reason.trim().length < 10) {
        return Result.err('Cancellation reason must be at least 10 characters');
      }

      const result = await this.tournamentRepo.cancel(tournamentId, reason);
      return result;
    } catch (error) {
      return Result.err(error.message || 'Failed to cancel tournament');
    }
  }

  /**
   * Register club for tournament
   */
  async registerClub(tournamentId, clubId, userId, playerIds = []) {
    try {
      // Get tournament
      const tournamentResult = await this.tournamentRepo.findById(tournamentId);
      if (tournamentResult.isErr()) {
        return Result.err('Tournament not found');
      }
      const tournament = tournamentResult.getValue();

      let registrationData = {
        tournament_id: tournamentId,
        status: 'pending'
      };

      if (tournament.participantType === 'individual' || !clubId) {
        // Individual registration
        registrationData.user_id = userId;
        
        // Check if already registered
        const { data: existing } = await supabase
          .from('tournament_registrations')
          .select('id')
          .eq('tournament_id', tournamentId)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (existing) {
          return Result.err('Bạn đã đăng ký tham gia giải đấu này rồi.');
        }
      } else {
        // Club registration
        // Verify club ownership
        const clubResult = await this.clubRepo.findById(clubId);
        if (clubResult.isErr()) {
          return Result.err('Club not found');
        }

        const club = clubResult.getValue();
        if (!club.canBeManagedBy(userId)) {
          return Result.err('You do not have permission to register this club');
        }

        // Validate player IDs count
        if (playerIds.length !== tournament.maxPlayersPerMatch) {
          return Result.err(`Số lượng vận động viên phải bằng đúng ${tournament.maxPlayersPerMatch}`);
        }

        // Validate player IDs belong to the club (including leader and deputy)
        const { data: clubData, error: clubDataError } = await supabase
          .from('clubs')
          .select('leader_id, deputy_id')
          .eq('id', clubId)
          .single();

        if (clubDataError) {
          return Result.err('Lỗi khi kiểm tra thông tin câu lạc bộ');
        }

        const specialUserIds = [clubData.leader_id, clubData.deputy_id].filter(id => id);
        const regularPlayerIds = playerIds.filter(id => !specialUserIds.includes(id));

        if (regularPlayerIds.length > 0) {
          const { data: clubMembers, error: membersError } = await supabase
            .from('club_members')
            .select('user_id')
            .eq('club_id', clubId)
            .eq('status', 'approved')
            .in('user_id', regularPlayerIds);

          if (membersError) {
            return Result.err('Lỗi khi kiểm tra danh sách vận động viên');
          }

          if (clubMembers.length !== regularPlayerIds.length) {
            return Result.err('Một số vận động viên không thuộc câu lạc bộ này hoặc chưa được duyệt');
          }
        }

        // Register club logic in domain (if any)
        const registrationResult = tournament.registerClub(club);
        if (!registrationResult.success) {
          return Result.err(registrationResult.error);
        }
        
        registrationData.club_id = clubId;

        // Check if already registered
        const { data: existing } = await supabase
          .from('tournament_registrations')
          .select('id')
          .eq('tournament_id', tournamentId)
          .eq('club_id', clubId)
          .maybeSingle();
        
        if (existing) {
          return Result.err('Câu lạc bộ này đã đăng ký tham gia giải đấu này rồi.');
        }
      }

      // Save registration to database
      const { data: registration, error: regError } = await supabase
        .from('tournament_registrations')
        .insert(registrationData)
        .select()
        .single();

      if (regError) {
        return Result.err(regError.message);
      }

      // Save players if any
      if (playerIds.length > 0) {
        const registrationPlayers = playerIds.map(playerId => ({
          registration_id: registration.id,
          player_id: playerId,
          club_id: clubId
        }));

        const { error: playersError } = await supabase
          .from('tournament_registration_players')
          .insert(registrationPlayers);

        if (playersError) {
          // Rollback registration (simple version)
          await supabase.from('tournament_registrations').delete().eq('id', registration.id);
          return Result.err('Lỗi khi lưu danh sách vận động viên: ' + playersError.message);
        }
      }

      return Result.ok(registration);
    } catch (error) {
      return Result.err(error.message || 'Failed to register');
    }
  }

  /**
   * Approve club registration
   */
  async approveRegistration(tournamentId, registrationId, userId) {
    try {
      const result = await this.tournamentRepo.approveRegistration(tournamentId, registrationId);
      return result;
    } catch (error) {
      return Result.err(error.message || 'Failed to approve registration');
    }
  }

  /**
   * Reject club registration
   */
  async rejectRegistration(tournamentId, registrationId, reason, userId) {
    try {
      const result = await this.tournamentRepo.rejectRegistration(tournamentId, registrationId, reason);
      return result;
    } catch (error) {
      return Result.err(error.message || 'Failed to reject registration');
    }
  }

  /**
   * Generate match schedule
   */
  async generateSchedule(tournamentId, venueIds, userId) {
    try {
      // Get tournament with registrations
      const tournamentResult = await this.tournamentRepo.findWithDetails(tournamentId);
      if (tournamentResult.isErr()) {
        return Result.err('Tournament not found');
      }

      const tournament = tournamentResult.getValue();

      // Get venues
      const { data: venues, error: venueError } = await supabase
        .from('venues')
        .select('*')
        .in('id', venueIds);

      if (venueError) {
        return Result.err(venueError.message);
      }

      if (!venues || venues.length === 0) {
        return Result.err('No venues provided');
      }

      // Generate schedule
      const scheduleResult = tournament.generateSchedule(venues);
      if (!scheduleResult.success) {
        return Result.err(scheduleResult.error);
      }

      // Save matches to database
      const matches = scheduleResult.data.map(match => ({
        tournament_id: match.tournamentId,
        home_club_id: match.homeClubId,
        away_club_id: match.awayClubId,
        venue_id: match.venueId,
        match_date: match.matchDate,
        match_time: match.matchTime,
        status: 'scheduled'
      }));

      const { error } = await supabase
        .from('matches')
        .insert(matches);

      if (error) {
        return Result.err(error.message);
      }

      // Update tournament status
      await this.tournamentRepo.updateStatus(tournamentId, 'registration_closed');

      return Result.ok(scheduleResult.data);
    } catch (error) {
      return Result.err(error.message || 'Failed to generate schedule');
    }
  }

  /**
   * Assign referee to match
   */
  async assignReferee(matchId, refereeId, userId) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .update({ referee_id: refereeId })
        .eq('id', matchId)
        .select()
        .single();

      if (error) {
        return Result.err(error.message);
      }

      return Result.ok(data);
    } catch (error) {
      return Result.err(error.message || 'Failed to assign referee');
    }
  }

  /**
   * Get tournament list with filtering
   */
  async getTournaments(filters = {}) {
    try {
      const { status, sportCategoryId, search, page = 1, perPage = 10 } = filters;

      let query = supabase
        .from('tournaments')
        .select(`
          *,
          sport_category:sports_categories(id, name, icon_url),
          registration_count:tournament_registrations(count)
        `, { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      if (sportCategoryId) {
        query = query.eq('sport_category_id', sportCategoryId);
      }

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        return Result.err(error.message);
      }

      return Result.ok({
        data: data.map(t => ({
          ...t,
          registration_count: t.registration_count
        })),
        total: count,
        page,
        perPage
      });
    } catch (error) {
      return Result.err(error.message || 'Failed to fetch tournaments');
    }
  }

  /**
   * Get tournament by ID with full details
   */
  async getTournament(id) {
    return this.tournamentRepo.findWithDetails(id);
  }

  /**
   * Get tournament statistics
   */
  async getStatistics() {
    return this.tournamentRepo.getStatistics();
  }
}

export const tournamentService = new TournamentService();
