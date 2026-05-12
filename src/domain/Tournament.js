/**
 * Tournament Domain Entity
 * SRP: Represents a tournament with its business rules and scheduling
 */
import { TournamentStatus, RegistrationStatus } from '../types/index.js';
import { generateUUID, formatDate } from '../utils/helpers.js';

export class Tournament {
  constructor(data = {}) {
    this.id = data.id || generateUUID();
    this.name = data.name || '';
    this.sportCategoryId = data.sportCategoryId || data.sport_category_id || null;
    this.sportCategory = data.sportCategory || data.sport_category || null;
    this.participantType = data.participantType || data.participant_type || 'club';
    this.rules = data.rules || '';
    this.format = data.format || 'round_robin';
    this.maxTeams = data.maxTeams || data.max_teams || 16;
    this.minTeams = data.minTeams || data.min_teams || 2;
    this.registrationDeadline = data.registrationDeadline || data.registration_deadline || null;
    this.startDate = data.startDate || data.start_date || null;
    this.endDate = data.endDate || data.end_date || null;
    this.matchDays = data.matchDays || data.match_days || [6, 7]; // Saturday, Sunday
    this.matchTimes = data.matchTimes || data.match_times || ['17:00', '19:00'];
    this.status = data.status || TournamentStatus.UPCOMING;
    this.cancellationReason = data.cancellationReason || data.cancellation_reason || '';
    this.championClubId = data.championClubId || data.champion_club_id || null;
    this.createdBy = data.createdBy || data.created_by || null;
    this.venueId = data.venueId || data.venue_id || null;
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();

    // Embedded collections
    this.registrations = data.registrations || [];
    this.matches = data.matches || [];
  }

  // Business logic methods
  canEdit() {
    return [TournamentStatus.UPCOMING, TournamentStatus.REGISTRATION_OPEN].includes(this.status);
  }

  isRegistrationOpen() {
    if (this.status !== TournamentStatus.REGISTRATION_OPEN) return false;
    if (!this.registrationDeadline) return true;
    return new Date() < new Date(this.registrationDeadline);
  }

  openRegistration() {
    if (this.status !== TournamentStatus.UPCOMING) {
      return { success: false, error: 'Only upcoming tournaments can open registration' };
    }
    this.status = TournamentStatus.REGISTRATION_OPEN;
    this.updatedAt = new Date();
    return { success: true };
  }

  closeRegistration() {
    if (this.status !== TournamentStatus.REGISTRATION_OPEN) {
      return { success: false, error: 'Registration is not currently open' };
    }
    this.status = TournamentStatus.REGISTRATION_CLOSED;
    this.updatedAt = new Date();
    return { success: true };
  }

  startTournament() {
    if (this.status !== TournamentStatus.REGISTRATION_CLOSED) {
      return { success: false, error: 'Tournament must be in registration closed status to start' };
    }
    this.status = TournamentStatus.ONGOING;
    this.updatedAt = new Date();
    return { success: true };
  }

  complete(championClubId) {
    if (this.status !== TournamentStatus.ONGOING) {
      return { success: false, error: 'Only ongoing tournaments can be completed' };
    }
    this.status = TournamentStatus.COMPLETED;
    this.championClubId = championClubId;
    this.endDate = new Date();
    this.updatedAt = new Date();
    return { success: true };
  }

  cancel(reason) {
    if ([TournamentStatus.COMPLETED, TournamentStatus.CANCELLED].includes(this.status)) {
      return { success: false, error: 'Cannot cancel completed or already cancelled tournaments' };
    }
    this.status = TournamentStatus.CANCELLED;
    this.cancellationReason = reason;
    this.updatedAt = new Date();
    return { success: true };
  }

  // Registration management
  registerClub(club) {
    if (!this.isRegistrationOpen()) {
      return { success: false, error: 'Registration is not open for this tournament' };
    }

    if (this.approvedCount >= this.maxTeams) {
      return { success: false, error: 'Tournament has reached maximum number of approved teams' };
    }

    const existing = this.registrations.find(r => r.clubId === club.id);
    if (existing) {
      return { success: false, error: 'Club is already registered for this tournament' };
    }

    const registration = {
      id: generateUUID(),
      tournamentId: this.id,
      clubId: club.id,
      club: club,
      status: RegistrationStatus.PENDING,
      registeredAt: new Date(),
      players: []
    };

    this.registrations.push(registration);
    return { success: true, data: registration };
  }

  approveRegistration(registrationId) {
    const registration = this.registrations.find(r => r.id === registrationId);
    if (!registration) {
      return { success: false, error: 'Registration not found' };
    }
    if (registration.status !== RegistrationStatus.PENDING) {
      return { success: false, error: 'Only pending registrations can be approved' };
    }

    registration.status = RegistrationStatus.APPROVED;
    registration.approvedAt = new Date();
    return { success: true, data: registration };
  }

  rejectRegistration(registrationId, reason) {
    const registration = this.registrations.find(r => r.id === registrationId);
    if (!registration) {
      return { success: false, error: 'Registration not found' };
    }
    if (registration.status !== RegistrationStatus.PENDING) {
      return { success: false, error: 'Only pending registrations can be rejected' };
    }

    registration.status = RegistrationStatus.REJECTED;
    registration.rejectionReason = reason;
    return { success: true, data: registration };
  }

  getApprovedClubs() {
    return this.registrations
      .filter(r => r.status === RegistrationStatus.APPROVED)
      .map(r => r.club);
  }

  // Match scheduling
  generateSchedule(venues) {
    const approvedClubs = this.getApprovedClubs();
    if (approvedClubs.length < 2) {
      return { success: false, error: 'Need at least 2 clubs to generate schedule' };
    }

    const matches = [];
    const clubs = [...approvedClubs];
    const numRounds = clubs.length - 1;
    const numMatchesPerRound = Math.floor(clubs.length / 2);

    let matchIndex = 0;

    for (let round = 0; round < numRounds; round++) {
      for (let i = 0; i < numMatchesPerRound; i++) {
        const home = clubs[i];
        const away = clubs[clubs.length - 1 - i];

        const { date, time, venue } = this.calculateMatchSlot(matchIndex, venues);

        matches.push({
          id: generateUUID(),
          tournamentId: this.id,
          homeClubId: home.id,
          awayClubId: away.id,
          homeClub: home,
          awayClub: away,
          venueId: venue.id,
          venue: venue,
          matchDate: date,
          matchTime: time,
          status: 'scheduled',
          homeScore: 0,
          awayScore: 0,
          createdAt: new Date()
        });

        matchIndex++;
      }
      // Rotate clubs for next round (keep first club fixed)
      clubs.splice(1, 0, clubs.pop());
    }

    this.matches = matches;
    return { success: true, data: matches };
  }

  calculateMatchSlot(index, venues) {
    const startDate = new Date(this.startDate);
    const dayIndex = Math.floor(index / (this.matchTimes.length * venues.length));
    const slotIndex = index % (this.matchTimes.length * venues.length);
    const timeIndex = slotIndex % this.matchTimes.length;
    const venueIndex = Math.floor(slotIndex / this.matchTimes.length) % venues.length;

    // Find the next match day
    let currentDate = new Date(startDate);
    let daysAdded = 0;
    while (daysAdded < dayIndex) {
      currentDate.setDate(currentDate.getDate() + 1);
      if (this.matchDays.includes(currentDate.getDay())) {
        daysAdded++;
      }
    }

    return {
      date: currentDate,
      time: this.matchTimes[timeIndex],
      venue: venues[venueIndex]
    };
  }

  // Computed properties
  get registrationCount() {
    return this.registrations.length;
  }

  get approvedCount() {
    return this.registrations.filter(r => r.status === RegistrationStatus.APPROVED).length;
  }

  get isFull() {
    return this.approvedCount >= this.maxTeams;
  }

  get displayStatus() {
    const statusNames = {
      [TournamentStatus.UPCOMING]: 'Sắp diễn ra',
      [TournamentStatus.REGISTRATION_OPEN]: 'Mở đăng ký',
      [TournamentStatus.REGISTRATION_CLOSED]: 'Đóng đăng ký',
      [TournamentStatus.ONGOING]: 'Đang diễn ra',
      [TournamentStatus.COMPLETED]: 'Đã kết thúc',
      [TournamentStatus.CANCELLED]: 'Đã hủy'
    };
    return statusNames[this.status] || 'Không xác định';
  }

  calculateStandings(groupId = null) {
    const standings = new Map();
    const approvedClubs = this.getApprovedClubs();
    
    // Initialize standings for all approved clubs
    approvedClubs.forEach(club => {
      // If groupId is provided, only include clubs in that group
      // This requires registration data to have group_id
      const reg = this.registrations.find(r => r.clubId === club.id || r.club_id === club.id);
      if (groupId && reg && reg.group_id !== groupId) return;

      standings.set(club.id, {
        clubId: club.id,
        name: club.name,
        logoUrl: club.logoUrl || club.logo_url,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0
      });
    });

    // Process matches
    this.matches.forEach(match => {
      // CHỈ tính điểm cho những trận đã kết thúc (status === 'completed')
      if (match.status !== 'completed') return;
      if (groupId && (match.group_id || match.groupId) !== groupId) return;

      const homeId = match.homeClubId || match.home_club_id;
      const awayId = match.awayClubId || match.away_club_id;
      const homeScore = Number(match.homeScore ?? match.home_score);
      const awayScore = Number(match.awayScore ?? match.away_score);

      const homeStats = standings.get(homeId);
      const awayStats = standings.get(awayId);

      if (homeStats && awayStats) {
        homeStats.played++;
        awayStats.played++;
        homeStats.gf += homeScore;
        homeStats.ga += awayScore;
        awayStats.gf += awayScore;
        awayStats.ga += homeScore;

        if (homeScore > awayScore) {
          homeStats.won++;
          homeStats.points += 2; // Thắng +2
          awayStats.lost++;
          awayStats.points -= 1; // Thua -1
        } else if (homeScore < awayScore) {
          awayStats.won++;
          awayStats.points += 2; // Thắng +2
          homeStats.lost++;
          homeStats.points -= 1; // Thua -1
        } else {
          homeStats.drawn++;
          awayStats.drawn++;
          homeStats.points += 1; // Hòa +1
          awayStats.points += 1; // Hòa +1
        }

        homeStats.gd = homeStats.gf - homeStats.ga;
        awayStats.gd = awayStats.gf - awayStats.ga;
      }
    });

    // Convert to array and sort
    const result = Array.from(standings.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });

    // Apply Continuous Dense Ranking
    let currentRank = 1;
    return result.map((team, index) => {
      if (index > 0) {
        const prevTeam = result[index - 1];
        const isTied = team.points === prevTeam.points && 
                       team.gd === prevTeam.gd && 
                       team.gf === prevTeam.gf;
        if (!isTied) {
          currentRank++;
        }
      }
      return { ...team, rank: currentRank };
    });
  }

  get displayDate() {
    if (this.startDate && this.endDate) {
      return `${formatDate(this.startDate)} - ${formatDate(this.endDate)}`;
    }
    return formatDate(this.startDate) || 'Chưa xác định';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      sport_category_id: this.sportCategoryId,
      rules: this.rules,
      format: this.format,
      participant_type: this.participantType,
      max_teams: this.maxTeams,
      min_teams: this.minTeams,
      registration_deadline: this.registrationDeadline,
      start_date: this.startDate,
      end_date: this.endDate,
      match_days: this.matchDays,
      match_times: this.matchTimes,
      status: this.status,
      cancellation_reason: this.cancellationReason,
      champion_club_id: this.championClubId,
      created_by: this.createdBy,
      venue_id: this.venueId,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  static fromDB(data) {
    return new Tournament(data);
  }
}
