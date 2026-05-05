// Tournament Model
const BaseModel = require('./BaseModel');
const { supabase } = require('../config/supabase');

class Tournament extends BaseModel {
  constructor() {
    super('tournaments');
  }

  // Get tournament with details
  async getWithDetails(tournamentId) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(`
        *,
        sport:sports_categories(*),
        creator:profiles!created_by(*),
        registrations:tournament_registrations(
          status,
          club:clubs(*)
        ),
        matches(*)
      `)
      .eq('id', tournamentId)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get active tournaments
  async getActive() {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(`
        *,
        sport:sports_categories(*)
      `)
      .in('status', ['registration_open', 'ongoing'])
      .order('start_date', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  // Get by sport category
  async getBySport(sportCategoryId) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('sport_category_id', sportCategoryId);
    
    if (error) throw error;
    return data;
  }

  // Get by status
  async getByStatus(status) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(`
        *,
        sport:sports_categories(*)
      `)
      .eq('status', status)
      .order('start_date', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  // Register club for tournament
  async register(tournamentId, clubId) {
    const { data, error } = await this.supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: tournamentId,
        club_id: clubId,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Approve registration
  async approveRegistration(registrationId, approvedBy) {
    const { data, error } = await this.supabase
      .from('tournament_registrations')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date()
      })
      .eq('id', registrationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get registrations
  async getRegistrations(tournamentId, status = null) {
    let query = this.supabase
      .from('tournament_registrations')
      .select(`
        *,
        club:clubs(*)
      `)
      .eq('tournament_id', tournamentId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Update tournament status
  async updateStatus(tournamentId, status) {
    const { data, error } = await this.supabase
      .from(this.table)
      .update({ status })
      .eq('id', tournamentId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

module.exports = new Tournament();
