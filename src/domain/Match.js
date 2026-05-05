/**
 * Match Domain Entity
 * SRP: Represents a match with its lifecycle and events
 */
import { MatchStatus, EventType } from '../types/index.js';
import { generateUUID } from '../utils/helpers.js';

export class Match {
  constructor(data = {}) {
    this.id = data.id || generateUUID();
    this.tournamentId = data.tournamentId || data.tournament_id || null;
    this.tournament = data.tournament || null;
    this.homeClubId = data.homeClubId || data.home_club_id || null;
    this.homeClub = data.homeClub || null;
    this.awayClubId = data.awayClubId || data.away_club_id || null;
    this.awayClub = data.awayClub || null;
    this.venueId = data.venueId || data.venue_id || null;
    this.venue = data.venue || null;
    this.refereeId = data.refereeId || data.referee_id || null;
    this.referee = data.referee || null;
    this.matchDate = data.matchDate || data.match_date || null;
    this.matchTime = data.matchTime || data.match_time || null;
    this.homeScore = data.homeScore || data.home_score || 0;
    this.awayScore = data.awayScore || data.away_score || 0;
    this.status = data.status || MatchStatus.SCHEDULED;
    this.startTime = data.startTime || data.start_time || null;
    this.endTime = data.endTime || data.end_time || null;
    this.createdAt = data.createdAt || data.created_at || new Date();

    // Embedded events
    this.events = data.events || [];
  }

  // Lifecycle methods
  assignReferee(referee) {
    if (![MatchStatus.SCHEDULED].includes(this.status)) {
      return { success: false, error: 'Can only assign referee to scheduled matches' };
    }
    this.refereeId = referee.id;
    this.referee = referee;
    return { success: true };
  }

  removeReferee() {
    if (![MatchStatus.SCHEDULED].includes(this.status)) {
      return { success: false, error: 'Cannot remove referee after match has started' };
    }
    this.refereeId = null;
    this.referee = null;
    return { success: true };
  }

  start() {
    if (this.status !== MatchStatus.SCHEDULED) {
      return { success: false, error: 'Match must be scheduled to start' };
    }
    this.status = MatchStatus.IN_PROGRESS;
    this.startTime = new Date();

    this.addEvent({
      type: EventType.START,
      minute: 0,
      description: 'Trận đấu bắt đầu'
    });

    return { success: true };
  }

  pause() {
    if (this.status !== MatchStatus.IN_PROGRESS) {
      return { success: false, error: 'Can only pause an ongoing match' };
    }
    this.status = MatchStatus.PAUSED;

    this.addEvent({
      type: EventType.PAUSE,
      minute: this.currentMinute,
      description: 'Trận đấu tạm dừng'
    });

    return { success: true };
  }

  resume() {
    if (this.status !== MatchStatus.PAUSED) {
      return { success: false, error: 'Can only resume a paused match' };
    }
    this.status = MatchStatus.IN_PROGRESS;

    this.addEvent({
      type: EventType.RESUME,
      minute: this.currentMinute,
      description: 'Trận đấu tiếp tục'
    });

    return { success: true };
  }

  end() {
    if (![MatchStatus.IN_PROGRESS, MatchStatus.PAUSED].includes(this.status)) {
      return { success: false, error: 'Can only end an ongoing or paused match' };
    }
    this.status = MatchStatus.COMPLETED;
    this.endTime = new Date();

    this.addEvent({
      type: EventType.END,
      minute: this.currentMinute,
      description: 'Trận đấu kết thúc'
    });

    return { success: true };
  }

  cancel(reason) {
    if ([MatchStatus.COMPLETED].includes(this.status)) {
      return { success: false, error: 'Cannot cancel a completed match' };
    }
    this.status = MatchStatus.CANCELLED;
    this.cancellationReason = reason;
    return { success: true };
  }

  // Event recording
  recordGoal(playerId, clubId, minute, assistedBy = null) {
    if (![MatchStatus.IN_PROGRESS].includes(this.status)) {
      return { success: false, error: 'Can only record goals during active match' };
    }

    const isHome = this.homeClubId === clubId;
    if (isHome) {
      this.homeScore++;
    } else {
      this.awayScore++;
    }

    const event = this.addEvent({
      type: EventType.GOAL,
      playerId,
      clubId,
      minute,
      description: assistedBy
        ? `Ghi bàn (kiến tạo bởi #${assistedBy})`
        : 'Ghi bàn'
    });

    return { success: true, data: event };
  }

  recordCard(playerId, clubId, cardType, minute, reason = '') {
    if (![MatchStatus.IN_PROGRESS, MatchStatus.PAUSED].includes(this.status)) {
      return { success: false, error: 'Can only record cards during active match' };
    }

    const eventType = cardType === 'red' ? EventType.RED_CARD : EventType.YELLOW_CARD;

    const event = this.addEvent({
      type: eventType,
      playerId,
      clubId,
      minute,
      description: reason || (cardType === 'red' ? 'Thẻ đỏ' : 'Thẻ vàng')
    });

    return { success: true, data: event };
  }

  recordSubstitution(playerOutId, playerInId, clubId, minute) {
    if (![MatchStatus.IN_PROGRESS, MatchStatus.PAUSED].includes(this.status)) {
      return { success: false, error: 'Can only record substitutions during active match' };
    }

    this.addEvent({
      type: EventType.SUBSTITUTION_OUT,
      playerId: playerOutId,
      clubId,
      minute,
      description: 'Thay người ra'
    });

    const event = this.addEvent({
      type: EventType.SUBSTITUTION_IN,
      playerId: playerInId,
      clubId,
      minute,
      description: 'Thay người vào'
    });

    return { success: true, data: event };
  }

  addEvent(eventData) {
    const event = {
      id: generateUUID(),
      matchId: this.id,
      playerId: eventData.playerId || null,
      clubId: eventData.clubId || null,
      type: eventData.type,
      minute: eventData.minute,
      description: eventData.description,
      createdAt: new Date()
    };

    this.events.push(event);
    return event;
  }

  // Computed properties
  get currentMinute() {
    if (!this.startTime) return 0;
    if (this.endTime) {
      const diff = new Date(this.endTime) - new Date(this.startTime);
      return Math.floor(diff / 60000);
    }
    const diff = Date.now() - new Date(this.startTime).getTime();
    return Math.floor(diff / 60000);
  }

  get winner() {
    if (this.homeScore > this.awayScore) return this.homeClub;
    if (this.awayScore > this.homeScore) return this.awayClub;
    return null; // Draw
  }

  get isDraw() {
    return this.homeScore === this.awayScore;
  }

  get displayScore() {
    return `${this.homeScore} - ${this.awayScore}`;
  }

  get displayStatus() {
    const statusNames = {
      [MatchStatus.SCHEDULED]: 'Chờ thi đấu',
      [MatchStatus.IN_PROGRESS]: 'Đang thi đấu',
      [MatchStatus.PAUSED]: 'Tạm dừng',
      [MatchStatus.COMPLETED]: 'Đã kết thúc',
      [MatchStatus.CANCELLED]: 'Đã hủy'
    };
    return statusNames[this.status] || 'Không xác định';
  }

  get goals() {
    return this.events.filter(e => e.type === EventType.GOAL);
  }

  get yellowCards() {
    return this.events.filter(e => e.type === EventType.YELLOW_CARD);
  }

  get redCards() {
    return this.events.filter(e => e.type === EventType.RED_CARD);
  }

  get substitutions() {
    return this.events.filter(e =>
      e.type === EventType.SUBSTITUTION_IN || e.type === EventType.SUBSTITUTION_OUT
    );
  }

  toJSON() {
    return {
      id: this.id,
      tournamentId: this.tournamentId,
      homeClubId: this.homeClubId,
      awayClubId: this.awayClubId,
      venueId: this.venueId,
      refereeId: this.refereeId,
      matchDate: this.matchDate,
      matchTime: this.matchTime,
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      createdAt: this.createdAt,
      events: this.events
    };
  }

  static fromDB(data) {
    return new Match(data);
  }
}
