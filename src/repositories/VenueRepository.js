/**
 * Venue Repository
 * SRP: Data access for Venue entities
 */
import { BaseRepository } from './BaseRepository.js';
import { Venue } from '../domain/Venue.js';
import { Result } from '../utils/result.js';

export class VenueRepository extends BaseRepository {
  constructor() {
    super('venues', Venue);
  }

  /**
   * Search venues by name
   */
  async search(query, limit = 20) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit);

    if (error) {
      return Result.err(error.message);
    }

    return Result.ok((data || []).map(item => this.domainClass.fromDB(item)));
  }

  /**
   * Soft delete - hide a venue instead of deleting it
   */
  async softDelete(id) {
    return this.update({ id, status: 'hidden' });
  }

  /**
   * Restore a hidden venue
   */
  async restore(id) {
    return this.update({ id, status: 'active' });
  }
}

export const venueRepository = new VenueRepository();
