// Base Model - Abstract class for all models
const { supabase } = require('../config/supabase');

class BaseModel {
  constructor(tableName) {
    this.table = tableName;
    this.supabase = supabase;
  }

  // CREATE
  async create(data) {
    const { data: result, error } = await this.supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  // READ all
  async findAll(options = {}) {
    let query = this.supabase.from(this.table).select('*');
    
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // READ one
  async findById(id) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  // UPDATE
  async update(id, data) {
    const { data: result, error } = await this.supabase
      .from(this.table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  // DELETE
  async delete(id) {
    const { error } = await this.supabase
      .from(this.table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Count
  async count(filters = {}) {
    let query = this.supabase.from(this.table).select('*', { count: 'exact', head: true });
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { count, error } = await query;
    if (error) throw error;
    return count;
  }
}

module.exports = BaseModel;
