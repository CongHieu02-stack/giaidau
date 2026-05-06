/**
 * Club Domain Entity
 * SRP: Represents a sports club with its business rules
 */
import { ClubStatus, MemberRole, MemberStatus } from '../types/index.js';
import { generateUUID } from '../utils/helpers.js';

export class Club {
  constructor(data = {}) {
    this.id = data.id || generateUUID();
    this.name = data.name || '';
    this.short_name = data.short_name || data.shortName || '';
    this.description = data.description || '';
    this.logoUrl = data.logoUrl || data.logo_url || '';
    this.leaderId = data.leaderId || data.leader_id || null;
    this.deputyId = data.deputyId || data.deputy_id || null;
    this.status = data.status || ClubStatus.PENDING;
    this.rejectionReason = data.rejectionReason || data.rejection_reason || '';
    this.suspensionReason = data.suspensionReason || data.suspension_reason || '';
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
    
    // Embedded collections
    this.members = data.members || [];
    this.tournamentHistory = data.tournamentHistory || [];
  }

  // Business logic methods
  approve() {
    if (this.status !== ClubStatus.PENDING && this.status !== ClubStatus.REJECTED) {
      return { success: false, error: 'Club can only be approved when pending or rejected' };
    }
    this.status = ClubStatus.APPROVED;
    this.rejectionReason = '';
    this.updatedAt = new Date();
    return { success: true };
  }

  reject(reason) {
    if (this.status !== ClubStatus.PENDING) {
      return { success: false, error: 'Only pending clubs can be rejected' };
    }
    this.status = ClubStatus.REJECTED;
    this.rejectionReason = reason;
    this.updatedAt = new Date();
    return { success: true };
  }

  suspend(reason) {
    if (this.status !== ClubStatus.APPROVED) {
      return { success: false, error: 'Only approved clubs can be suspended' };
    }
    this.status = ClubStatus.SUSPENDED;
    this.suspensionReason = reason;
    this.updatedAt = new Date();
    return { success: true };
  }

  dissolve() {
    if (this.status !== ClubStatus.APPROVED && this.status !== ClubStatus.SUSPENDED) {
      return { success: false, error: 'Club must be approved or suspended to be dissolved' };
    }
    this.status = ClubStatus.DISSOLVED;
    this.updatedAt = new Date();
    return { success: true };
  }

  canBeManagedBy(userId) {
    return this.leaderId === userId || this.deputyId === userId;
  }

  canJoinTournaments() {
    return this.status === ClubStatus.APPROVED;
  }

  appointDeputy(deputyId) {
    if (this.deputyId && this.deputyId !== deputyId) {
      return { success: false, error: 'Club already has a deputy' };
    }
    this.deputyId = deputyId;
    this.updatedAt = new Date();
    return { success: true };
  }

  removeDeputy() {
    this.deputyId = null;
    this.updatedAt = new Date();
    return { success: true };
  }

  transferLeadership(newLeaderId, promoteOldLeaderToDeputy = false) {
    if (promoteOldLeaderToDeputy) {
      this.deputyId = this.leaderId;
    }
    this.leaderId = newLeaderId;
    this.updatedAt = new Date();
    return { success: true };
  }

  // Member management
  addMember(userId, role = MemberRole.MEMBER) {
    const existingMember = this.members.find(m => m.userId === userId);
    if (existingMember) {
      return { success: false, error: 'User is already a member of this club' };
    }

    const member = {
      id: generateUUID(),
      clubId: this.id,
      userId,
      role,
      status: MemberStatus.PENDING,
      joinedAt: new Date()
    };

    this.members.push(member);
    return { success: true, data: member };
  }

  approveMember(memberId) {
    const member = this.members.find(m => m.id === memberId);
    if (!member) {
      return { success: false, error: 'Member not found' };
    }
    if (member.status !== MemberStatus.PENDING) {
      return { success: false, error: 'Only pending members can be approved' };
    }
    
    member.status = MemberStatus.APPROVED;
    member.joinedAt = new Date();
    return { success: true, data: member };
  }

  rejectMember(memberId) {
    const memberIndex = this.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
      return { success: false, error: 'Member not found' };
    }
    
    this.members[memberIndex].status = MemberStatus.REJECTED;
    return { success: true };
  }

  removeMember(memberId, reason) {
    const memberIndex = this.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
      return { success: false, error: 'Member not found' };
    }
    
    this.members[memberIndex].status = MemberStatus.REMOVED;
    this.members[memberIndex].removalReason = reason;
    this.members[memberIndex].removedAt = new Date();
    return { success: true };
  }

  getApprovedMembers() {
    return this.members.filter(m => m.status === MemberStatus.APPROVED);
  }

  getPendingMembers() {
    return this.members.filter(m => m.status === MemberStatus.PENDING);
  }

  getLeaders() {
    return this.members.filter(m => 
      m.status === MemberStatus.APPROVED && 
      (m.role === MemberRole.LEADER || m.role === MemberRole.DEPUTY)
    );
  }

  // Tournament participation
  registerForTournament(tournamentId) {
    if (!this.canJoinTournaments()) {
      return { success: false, error: 'Club cannot join tournaments in current status' };
    }

    const existing = this.tournamentHistory.find(t => t.tournamentId === tournamentId);
    if (existing) {
      return { success: false, error: 'Club is already registered for this tournament' };
    }

    const registration = {
      id: generateUUID(),
      tournamentId,
      clubId: this.id,
      status: 'pending',
      registeredAt: new Date(),
      players: []
    };

    this.tournamentHistory.push(registration);
    return { success: true, data: registration };
  }

  // Computed properties
  get memberCount() {
    return this.getApprovedMembers().length;
  }

  get displayStatus() {
    const statusNames = {
      [ClubStatus.PENDING]: 'Chờ duyệt',
      [ClubStatus.APPROVED]: 'Đã duyệt',
      [ClubStatus.REJECTED]: 'Từ chối',
      [ClubStatus.SUSPENDED]: 'Tạm khóa',
      [ClubStatus.DISSOLVED]: 'Giải thể'
    };
    return statusNames[this.status] || 'Không xác định';
  }

  get isActive() {
    return this.status === ClubStatus.APPROVED;
  }

  get isPending() {
    return this.status === ClubStatus.PENDING;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      short_name: this.short_name || null,
      description: this.description || null,
      logo_url: this.logoUrl || null,
      leader_id: this.leaderId,
      deputy_id: this.deputyId || null,
      status: this.status,
      rejection_reason: this.rejectionReason || null,
      suspension_reason: this.suspensionReason || null,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      member_count: this.memberCount
    };
  }

  static fromDB(data) {
    return new Club(data);
  }
}
