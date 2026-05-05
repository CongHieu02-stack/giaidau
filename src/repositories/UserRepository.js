/**
 * User Repository
 * SRP: Data access for User entities
 * Extends BaseRepository with user-specific operations
 */
import { BaseRepository } from './BaseRepository.js';
import { User } from '../domain/User.js';
import { Result } from '../utils/result.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super('profiles', User);
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const result = await this.findOne({ email });
    return result;
  }

  /**
   * Find users by role
   */
  async findByRole(role) {
    return this.findAll({ filters: { role } });
  }

  /**
   * Find available referees for a specific date and time
   * (Referees who don't have matches at that time)
   */
  async findAvailableReferees(date, time) {
    // First get all referees
    const refereesResult = await this.findByRole('referee');
    if (refereesResult.isErr()) {
      return refereesResult;
    }

    const referees = refereesResult.getValue().filter(r => r.status === 'active');
    
    // Get busy referees for the given date/time
    const { data: busyReferees, error } = await this.client
      .from('matches')
      .select('referee_id')
      .eq('match_date', date)
      .eq('match_time', time)
      .not('referee_id', 'is', null);

    if (error) {
      return Result.err(error.message);
    }

    const busyRefereeIds = new Set((busyReferees || []).map(m => m.referee_id));
    
    // Filter out busy referees
    const availableReferees = referees.filter(r => !busyRefereeIds.has(r.id));
    
    return Result.ok(availableReferees);
  }

  /**
   * Search users by name or email
   */
  async search(query, options = {}) {
    const { role, status, limit = 20 } = options;
    
    let supabaseQuery = this.client
      .from(this.tableName)
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit);

    if (role) {
      supabaseQuery = supabaseQuery.eq('role', role);
    }

    if (status) {
      supabaseQuery = supabaseQuery.eq('status', status);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      return Result.err(error.message);
    }

    return Result.ok((data || []).map(item => this.domainClass.fromDB(item)));
  }

  /**
   * Get user statistics for dashboard
   */
  async getStatistics() {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('role, status');

    if (error) {
      return Result.err(error.message);
    }

    const stats = {
      total: data.length,
      byRole: {},
      byStatus: {}
    };

    data.forEach(user => {
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
      stats.byStatus[user.status] = (stats.byStatus[user.status] || 0) + 1;
    });

    return Result.ok(stats);
  }

  /**
   * Update user role
   */
  async updateRole(userId, newRole) {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ role: newRole, updated_at: new Date() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return Result.err(error.message);
    }

    return Result.ok(this.domainClass.fromDB(data));
  }

  /**
   * Update user status
   */
  async updateStatus(userId, status, reason = null) {
    const updateData = { 
      status, 
      updated_at: new Date() 
    };
    
    if (reason) {
      updateData.suspension_reason = reason;
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return Result.err(error.message);
    }

    return Result.ok(this.domainClass.fromDB(data));
  }
}

export const userRepository = new UserRepository();
