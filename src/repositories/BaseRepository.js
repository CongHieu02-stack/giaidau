/**
 * Base Repository Abstract Class
 * SRP: Abstracts data access operations
 * Following Repository Pattern for data access abstraction
 */
import { supabase } from '../config/supabase.js';
import { Result, AsyncResult } from '../utils/result.js';

export class BaseRepository {
  constructor(tableName, domainClass) {
    this.tableName = tableName;
    this.domainClass = domainClass;
    this.client = supabase;
  }

  /**
   * Find a single record by ID
   */
  async findById(id) {
    return AsyncResult.from(
      this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') throw error;
          return data ? this.domainClass.fromDB(data) : null;
        })
    );
  }

  /**
   * Find all records with optional filtering
   */
  async findAll(options = {}) {
    const { filters = {}, orderBy = 'created_at', order = 'desc', limit = null } = options;
    
    let query = this.client
      .from(this.tableName)
      .select('*');

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

    return AsyncResult.from(
      query.then(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(item => this.domainClass.fromDB(item));
      })
    );
  }

  /**
   * Find a single record by criteria
   */
  async findOne(criteria) {
    let query = this.client
      .from(this.tableName)
      .select('*');

    Object.entries(criteria).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    return AsyncResult.from(
      query
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
          return data ? this.domainClass.fromDB(data) : null;
        })
    );
  }

  /**
   * Create a new record
   */
  async create(entity) {
    const data = entity.toJSON ? entity.toJSON() : entity;
    
    return AsyncResult.from(
      this.client
        .from(this.tableName)
        .insert(data)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return this.domainClass.fromDB(data);
        })
    );
  }

  /**
   * Update an existing record
   */
  async update(entity) {
    const data = entity.toJSON ? entity.toJSON() : entity;
    const id = data.id || entity.id;

    return AsyncResult.from(
      this.client
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return this.domainClass.fromDB(data);
        })
    );
  }

  /**
   * Delete a record by ID
   */
  async delete(id) {
    return AsyncResult.from(
      this.client
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) throw error;
          return true;
        })
    );
  }

  /**
   * Check if a record exists
   */
  async exists(id) {
    const result = await this.findById(id);
    return Result.ok(result.isOk() && result.getValue() !== null);
  }

  /**
   * Count records with optional filters
   */
  async count(filters = {}) {
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });

    return AsyncResult.from(
      query.then(({ count, error }) => {
        if (error) throw error;
        return count || 0;
      })
    );
  }
}
