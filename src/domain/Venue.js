/**
 * Venue Domain Entity
 * SRP: Represents a venue (sân đấu)
 */
import { generateUUID } from '../utils/helpers.js';

export class Venue {
  constructor(data = {}) {
    this.id = data.id || generateUUID();
    this.name = data.name || '';
    this.address = data.address || '';
    this.capacity = data.capacity || 0;
    this.facilities = data.facilities || '';
    this.contactPhone = data.contactPhone || data.contact_phone || '';
    this.sportCategoryId = data.sportCategoryId || data.sport_category_id || null;
    this.createdAt = data.createdAt || data.created_at || new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      capacity: this.capacity,
      facilities: this.facilities,
      contact_phone: this.contactPhone,
      sport_category_id: this.sportCategoryId,
      created_at: this.createdAt
    };
  }

  static fromDB(data) {
    if (!data) return null;
    return new Venue(data);
  }
}
