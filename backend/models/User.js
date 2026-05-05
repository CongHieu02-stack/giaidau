// User Model
const BaseModel = require('./BaseModel');
const { supabase } = require('../config/supabase');

class User extends BaseModel {
  constructor() {
    super('profiles');
  }

  // Find by email
  async findByEmail(email) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find by role
  async findByRole(role) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('role', role);
    
    if (error) throw error;
    return data;
  }

  // Get user with club membership
  async getWithClubs(userId) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(`
        *,
        club_members(
          role,
          status,
          club:clubs(*)
        )
      `)
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Check if user has role
  async hasRole(userId, roles) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) throw false;
    return roles.includes(data.role);
  }

  // Search users
  async search(query, filters = {}) {
    let dbQuery = this.supabase
      .from(this.table)
      .select('*')
      .ilike('full_name', `%${query}%`);
    
    if (filters.role) {
      dbQuery = dbQuery.eq('role', filters.role);
    }
    
    if (filters.status) {
      dbQuery = dbQuery.eq('status', filters.status);
    }
    
    const { data, error } = await dbQuery;
    if (error) throw error;
    return data;
  }

  // Update last login
  async updateLastLogin(userId) {
    const { error } = await this.supabase
      .from(this.table)
      .update({ last_login: new Date() })
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  }
}

module.exports = new User();
