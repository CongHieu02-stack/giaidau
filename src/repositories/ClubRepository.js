/**
 * Club Repository
 * SRP: Data access for Club entities
 */
import { BaseRepository } from './BaseRepository.js';
import { Club } from '../domain/Club.js';
import { Result } from '../utils/result.js';

export class ClubRepository extends BaseRepository {
  constructor() {
    super('clubs', Club);
  }

  /**
   * Find clubs by leader
   */
  async findByLeader(leaderId) {
    return this.findAll({ filters: { leader_id: leaderId } });
  }

  /**
   * Find clubs by status
   */
  async findByStatus(status) {
    return this.findAll({ filters: { status } });
  }

  /**
   * Find pending clubs
   */
  async findPending() {
    return this.findByStatus('pending');
  }

  /**
   * Find approved clubs
   */
  async findApproved() {
    return this.findByStatus('approved');
  }

  /**
   * Find clubs where user is a member
   */
  async findByMember(userId) {
    const { data, error } = await this.client
      .from('club_members')
      .select('club_id')
      .eq('user_id', userId)
      .eq('status', 'approved');

    if (error) {
      return Result.err(error.message);
    }

    if (!data || data.length === 0) {
      return Result.ok([]);
    }

    const clubIds = data.map(m => m.club_id);
    return this.findAll({ filters: { id: clubIds } });
  }

  /**
   * Find clubs with member count and optional filtering
   */
  async findWithMemberCount(options = {}) {
    const { filters = {} } = options;
    
    let query = this.client
      .from('clubs')
      .select(`
        *,
        leader:profiles!clubs_leader_id_fkey(id, full_name),
        club_members!left(count)
      `);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });

    // Filter the embedded club_members to only count approved
    query = query.eq('club_members.status', 'approved');

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return Result.err(error.message);
    }

    return Result.ok((data || []).map(item => {
      const club = this.domainClass.fromDB(item);
      // Increment by 1 to include the leader who is not in the club_members table
      club.member_count = (item.club_members?.[0]?.count || 0) + 1;
      club.leader = item.leader;
      return club;
    }));
  }

  /**
   * Find club with full details (members, leader)
   */
  async findWithDetails(id) {
    const { data, error } = await this.client
      .from('clubs')
      .select(`
        *,
        leader:profiles!clubs_leader_id_fkey(id, full_name, avatar_url),
        deputy:profiles!clubs_deputy_id_fkey(id, full_name, avatar_url),
        members:club_members(
          id,
          user:profiles(id, full_name, avatar_url, gender),
          role,
          status,
          joined_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return Result.err(error.message);
    }

    const club = this.domainClass.fromDB(data);
    club.leader = data.leader || null;
    club.deputy = data.deputy || null;
    club.members = data.members || [];
    return Result.ok(club);
  }

  /**
   * Find clubs managed by user (leader or deputy)
   */
  async findManagedBy(userId) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        leader:profiles!clubs_leader_id_fkey(id, full_name)
      `)
      .or(`leader_id.eq.${userId},deputy_id.eq.${userId}`);

    if (error) {
      return Result.err(error.message);
    }

    return Result.ok((data || []).map(item => {
      const club = this.domainClass.fromDB(item);
      club.leaderName = item.leader?.full_name;
      return club;
    }));
  }

  /**
   * Approve a club
   */
  async approve(id) {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ 
        status: 'approved', 
        rejection_reason: null,
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
   * Reject a club
   */
  async reject(id, reason) {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ 
        status: 'rejected', 
        rejection_reason: reason,
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
   * Suspend a club
   */
  async suspend(id, reason) {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ 
        status: 'suspended', 
        suspension_reason: reason,
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
   * Dissolve a club
   */
  async dissolve(id) {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ 
        status: 'dissolved',
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
   * Search clubs by name
   */
  async search(query, options = {}) {
    const { status, limit = 20 } = options;
    
    let supabaseQuery = this.client
      .from(this.tableName)
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit);

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
   * Get club statistics
   */
  async getStatistics() {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('status');

    if (error) {
      return Result.err(error.message);
    }

    const stats = {
      total: data.length,
      byStatus: {}
    };

    data.forEach(club => {
      stats.byStatus[club.status] = (stats.byStatus[club.status] || 0) + 1;
    });

    return Result.ok(stats);
  }
}

export const clubRepository = new ClubRepository();
