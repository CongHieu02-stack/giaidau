// Club Model
const BaseModel = require('./BaseModel');
const { supabase } = require('../config/supabase');

class Club extends BaseModel {
  constructor() {
    super('clubs');
  }

  // Get club with members
  async getWithMembers(clubId) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(`
        *,
        leader:profiles!leader_id(*),
        members:club_members(
          role,
          status,
          joined_at,
          user:profiles(*)
        )
      `)
      .eq('id', clubId)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get clubs by leader
  async findByLeader(leaderId) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('leader_id', leaderId);
    
    if (error) throw error;
    return data;
  }

  // Get pending clubs
  async getPending() {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(`
        *,
        leader:profiles!leader_id(*)
      `)
      .eq('status', 'pending');
    
    if (error) throw error;
    return data;
  }

  // Approve club
  async approve(clubId, approvedBy) {
    const { data, error } = await this.supabase
      .from(this.table)
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date()
      })
      .eq('id', clubId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Search clubs
  async search(query) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .ilike('name', `%${query}%`)
      .eq('status', 'approved');
    
    if (error) throw error;
    return data;
  }

  // Update member count
  async updateMemberCount(clubId) {
    const { count, error: countError } = await this.supabase
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('status', 'approved');
    
    if (countError) throw countError;
    
    const { error } = await this.supabase
      .from(this.table)
      .update({ member_count: count })
      .eq('id', clubId);
    
    if (error) throw erorr; 
    return true;
  }
}

module.exports = new Club();
