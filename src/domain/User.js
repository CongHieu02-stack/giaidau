/**
 * User Domain Entity
 * SRP: Represents a user in the system with its behavior
 */
import { UserRole, UserStatus } from '../types/index.js';
import { generateUUID } from '../utils/helpers.js';

export class User {
  constructor(data = {}) {
    this.id = data.id || generateUUID();
    this.email = data.email || '';
    this.fullName = data.fullName || data.full_name || '';
    this.gender = data.gender || '';
    this.birthDate = data.birthDate || data.birth_date || null;
    this.phone = data.phone || '';
    this.avatarUrl = data.avatarUrl || data.avatar_url || '';
    this.role = data.role || UserRole.USER;
    this.status = data.status || UserStatus.ACTIVE;
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  // Business logic methods following SRP
  hasPermission(permission) {
    const permissions = {
      [UserRole.SUPER_ADMIN]: ['all'],
      [UserRole.ADMIN]: ['manage_tournaments', 'manage_clubs', 'view_all'],
      [UserRole.CLUB_LEADER]: ['manage_own_club', 'view_tournaments', 'register_tournament'],
      [UserRole.CLUB_DEPUTY]: ['manage_own_club', 'view_tournaments'],
      [UserRole.REFEREE]: ['view_matches', 'control_match'],
      [UserRole.USER]: ['view_tournaments', 'join_club', 'view_clubs']
    };

    const userPermissions = permissions[this.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  }

  canManageTournament() {
    return this.role === UserRole.ADMIN || this.role === UserRole.SUPER_ADMIN;
  }

  canManageClub(club) {
    if (!club) return false;
    return this.role === UserRole.SUPER_ADMIN || 
           this.role === UserRole.ADMIN ||
           club.leaderId === this.id || 
           club.deputyId === this.id;
  }

  canReferee() {
    return this.role === UserRole.REFEREE;
  }

  isActive() {
    return this.status === UserStatus.ACTIVE;
  }

  isLocked() {
    return this.status === UserStatus.SUSPENDED || this.status === UserStatus.BANNED;
  }

  canBePromotedTo(newRole) {
    const hierarchy = [UserRole.USER, UserRole.REFEREE, UserRole.CLUB_DEPUTY, UserRole.CLUB_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN];
    const currentIndex = hierarchy.indexOf(this.role);
    const newIndex = hierarchy.indexOf(newRole);
    return newIndex > currentIndex;
  }

  updateProfile(data) {
    if (data.fullName) this.fullName = data.fullName;
    if (data.gender) this.gender = data.gender;
    if (data.birthDate) this.birthDate = data.birthDate;
    if (data.phone) this.phone = data.phone;
    if (data.avatarUrl) this.avatarUrl = data.avatarUrl;
    this.updatedAt = new Date();
  }

  suspend(reason) {
    this.status = UserStatus.SUSPENDED;
    this.suspensionReason = reason;
    this.updatedAt = new Date();
  }

  unlock() {
    this.status = UserStatus.ACTIVE;
    this.suspensionReason = null;
    this.updatedAt = new Date();
  }

  changeRole(newRole) {
    this.role = newRole;
    this.updatedAt = new Date();
  }

  // Getters for computed properties
  get initials() {
    return this.fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  get displayRole() {
    const roleNames = {
      [UserRole.SUPER_ADMIN]: 'Super Admin',
      [UserRole.ADMIN]: 'Admin',
      [UserRole.CLUB_LEADER]: 'Trưởng CLB',
      [UserRole.CLUB_DEPUTY]: 'Phó CLB',
      [UserRole.REFEREE]: 'Trọng tài',
      [UserRole.USER]: 'Thành viên'
    };
    return roleNames[this.role] || 'Thành viên';
  }

  get avatarColor() {
    let hash = 0;
    for (let i = 0; i < this.fullName.length; i++) {
      hash = this.fullName.codePointAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      gender: this.gender,
      birthDate: this.birthDate,
      phone: this.phone,
      avatarUrl: this.avatarUrl,
      role: this.role,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDB(data) {
    return new User(data);
  }
}
