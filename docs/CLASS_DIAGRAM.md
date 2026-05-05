# Class Diagram - Sports League Management System

## Architecture Overview
Following SOLID principles with Repository Pattern, Service Pattern, and Factory Pattern.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    PRESENTATION LAYER                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │
│  │   Vue Views     │ │   Components    │ │     Stores      │ │   Composables   │     │
│  │  (Pages/UI)     │ │   (Reusable)    │ │   (Pinia)       │ │   (Logic)       │     │
│  └────────┬────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                    SERVICE LAYER                                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │
│  │ AuthService     │ │ClubService      │ │TournamentService│ │MatchService     │     │
│  ├─────────────────┤ ├─────────────────┤ ├─────────────────┤ ├─────────────────┤     │
│  │ - login()       │ │ - createClub()  │ │ - create()      │ │ - schedule()    │     │
│  │ - register()    │ │ - approveClub() │ │ - registerTeam()│ │ - startMatch()  │     │
│  │ - logout()      │ │ - suspendClub() │ │ - cancel()      │ │ - updateScore() │     │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                   REPOSITORY LAYER                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │
│  │UserRepository   │ │ClubRepository   │ │TournamentRepo   │ │MatchRepository  │     │
│  ├─────────────────┤ ├─────────────────┤ ├─────────────────┤ ├─────────────────┤     │
│  │ - findById()    │ │ - findById()    │ │ - findById()    │ │ - findById()    │     │
│  │ - findByEmail() │ │ - findAll()     │ │ - findAll()     │ │ - findByTourney │     │
│  │ - create()      │ │ - create()      │ │ - create()      │ │ - create()      │     │
│  │ - update()      │ │ - update()      │ │ - update()      │ │ - update()      │     │
│  │ - delete()      │ │ - delete()      │ │ - delete()      │ │ - delete()      │     │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                    DOMAIN LAYER                                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │
│  │     User        │ │     Club        │ │   Tournament    │ │     Match       │     │
│  ├─────────────────┤ ├─────────────────┤ ├─────────────────┤ ├─────────────────┤     │
│  │ - id: UUID      │ │ - id: UUID      │ │ - id: UUID      │ │ - id: UUID      │     │
│  │ - email: string │ │ - name: string  │ │ - name: string  │ │ - homeClub: Club│     │
│  │ - role: Role    │ │ - leader: User  │ │ - sport: Sport  │ │ - awayClub: Club│     │
│  │ - status: Status│ │ - status: Status│ │ - status: Status│ │ - referee: User │     │
│  │ - validate()    │ │ - approve()     │ │ - registerClub()│ │ - start()       │     │
│  │ - canAccess()   │ │ - suspend()     │ │ - cancel()      │ │ - end()         │     │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                   INFRASTRUCTURE                                     │
│                    Supabase Client / PostgreSQL Database                            │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Class Diagram

### Domain Entities

```typescript
// Base Entity - SRP: Core identity and lifecycle
abstract class Entity {
    protected id: UUID;
    protected createdAt: Date;
    protected updatedAt: Date;
    
    getId(): UUID;
    getCreatedAt(): Date;
}

// Aggregate Root - Tournament
class Tournament extends Entity {
    private name: string;
    private sportCategory: SportCategory;
    private rules: string;
    private maxTeams: number;
    private registrationDeadline: Date;
    private startDate: Date;
    private endDate: Date;
    private matchDays: number[];
    private matchTimes: string[];
    private status: TournamentStatus;
    private registrations: TournamentRegistration[];
    private matches: Match[];
    
    // Business logic methods
    registerClub(club: Club): Result<void>;
    approveRegistration(registration: TournamentRegistration): Result<void>;
    cancel(reason: string): Result<void>;
    generateSchedule(): Match[];
    canEdit(): boolean;
    isRegistrationOpen(): boolean;
}

// Club Aggregate
class Club extends Entity {
    private name: string;
    private description: string;
    private logoUrl: string;
    private leader: User;
    private deputy: User | null;
    private status: ClubStatus;
    private members: ClubMember[];
    
    approve(): Result<void>;
    reject(reason: string): Result<void>;
    suspend(reason: string): Result<void>;
    dissolve(): Result<void>;
    appointDeputy(member: ClubMember): Result<void>;
    addMember(user: User): Result<void>;
    removeMember(member: ClubMember, reason: string): Result<void>;
    canBeManagedBy(user: User): boolean;
}

// User Entity
class User extends Entity {
    private email: string;
    private fullName: string;
    private gender: Gender;
    private birthDate: Date;
    private phone: string;
    private avatarUrl: string;
    private role: UserRole;
    private status: UserStatus;
    
    hasPermission(permission: Permission): boolean;
    canManageTournament(): boolean;
    canManageClub(club: Club): boolean;
    canReferee(): boolean;
    isActive(): boolean;
}

// Match Entity
class Match extends Entity {
    private tournament: Tournament;
    private homeClub: Club;
    private awayClub: Club;
    private venue: Venue;
    private referee: User | null;
    private matchDate: Date;
    private matchTime: string;
    private homeScore: number;
    private awayScore: number;
    private status: MatchStatus;
    private events: MatchEvent[];
    private startTime: Date | null;
    private endTime: Date | null;
    
    assignReferee(referee: User): Result<void>;
    start(): Result<void>;
    pause(): Result<void>;
    resume(): Result<void>;
    end(): Result<void>;
    recordGoal(player: User, minute: number): Result<void>;
    recordCard(player: User, type: CardType, minute: number): Result<void>;
    recordSubstitution(out: User, in: User, minute: number): Result<void>;
}

// Value Objects
class TournamentRegistration {
    private id: UUID;
    private tournament: Tournament;
    private club: Club;
    private status: RegistrationStatus;
    private players: TournamentPlayer[];
    private registeredAt: Date;
}

class ClubMember {
    private id: UUID;
    private club: Club;
    private user: User;
    private role: MemberRole;
    private status: MemberStatus;
    private joinedAt: Date;
}

class MatchEvent {
    private id: UUID;
    private match: Match;
    private player: User;
    private club: Club;
    private eventType: EventType;
    private minute: number;
    private description: string;
}

class SportCategory {
    private id: UUID;
    private name: string;
    private iconUrl: string;
    private rules: string;
    private description: string;
}

class Venue {
    private id: UUID;
    private name: string;
    private address: string;
    private capacity: number;
}

// Enums
type UserRole = 'super_admin' | 'admin' | 'club_leader' | 'club_deputy' | 'referee' | 'user';
type UserStatus = 'active' | 'suspended' | 'banned';
type ClubStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'dissolved';
type TournamentStatus = 'upcoming' | 'registration_open' | 'registration_closed' | 'ongoing' | 'completed' | 'cancelled';
type MatchStatus = 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
type MemberRole = 'member' | 'deputy' | 'leader';
type MemberStatus = 'pending' | 'approved' | 'rejected' | 'removed';
type RegistrationStatus = 'pending' | 'approved' | 'rejected';
type EventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution_in' | 'substitution_out' | 'start' | 'pause' | 'resume' | 'end';
type CardType = 'yellow' | 'red';
```

### Repository Pattern (Data Access)

```typescript
// Generic Repository Interface - SRP: Data access abstraction
interface Repository<T extends Entity> {
    findById(id: UUID): Promise<T | null>;
    findAll(options?: QueryOptions): Promise<T[]>;
    findOne(criteria: object): Promise<T | null>;
    create(entity: T): Promise<T>;
    update(entity: T): Promise<T>;
    delete(id: UUID): Promise<void>;
    exists(id: UUID): Promise<boolean>;
}

// Specific Repository Interfaces
interface IUserRepository extends Repository<User> {
    findByEmail(email: string): Promise<User | null>;
    findByRole(role: UserRole): Promise<User[]>;
    findAvailableReferees(date: Date, time: string): Promise<User[]>;
}

interface IClubRepository extends Repository<Club> {
    findByLeader(leaderId: UUID): Promise<Club[]>;
    findByStatus(status: ClubStatus): Promise<Club[]>;
    findPending(): Promise<Club[]>;
    findByMember(userId: UUID): Promise<Club[]>;
}

interface ITournamentRepository extends Repository<Tournament> {
    findByStatus(status: TournamentStatus): Promise<Tournament[]>;
    findBySportCategory(categoryId: UUID): Promise<Tournament[]>;
    findActive(): Promise<Tournament[]>;
    findByClub(clubId: UUID): Promise<Tournament[]>;
}

interface IMatchRepository extends Repository<Match> {
    findByTournament(tournamentId: UUID): Promise<Match[]>;
    findByReferee(refereeId: UUID): Promise<Match[]>;
    findByClub(clubId: UUID): Promise<Match[]>;
    findScheduled(): Promise<Match[]>;
    findInProgress(): Promise<Match[]>;
}

// Supabase Implementation
class SupabaseUserRepository implements IUserRepository {
    private client: SupabaseClient;
    
    async findById(id: UUID): Promise<User | null>;
    async findByEmail(email: string): Promise<User | null>;
    async findAll(options?: QueryOptions): Promise<User[]>;
    async create(entity: User): Promise<User>;
    async update(entity: User): Promise<User>;
    async delete(id: UUID): Promise<void>;
}
```

### Service Layer (Business Logic)

```typescript
// Service Interface
interface IService<T> {
    execute(command: object): Promise<Result<T>>;
}

// Tournament Service - SRP: Tournament business logic
class TournamentService {
    private tournamentRepo: ITournamentRepository;
    private clubRepo: IClubRepository;
    private matchRepo: IMatchRepository;
    private notificationService: INotificationService;
    
    async createTournament(command: CreateTournamentCommand): Promise<Result<Tournament>>;
    async updateTournament(command: UpdateTournamentCommand): Promise<Result<Tournament>>;
    async cancelTournament(command: CancelTournamentCommand): Promise<Result<void>>;
    async registerClub(command: RegisterClubCommand): Promise<Result<TournamentRegistration>>;
    async approveRegistration(command: ApproveRegistrationCommand): Promise<Result<void>>;
    async generateSchedule(command: GenerateScheduleCommand): Promise<Result<Match[]>>;
    async assignReferee(command: AssignRefereeCommand): Promise<Result<void>>;
}

// Club Service - SRP: Club business logic
class ClubService {
    private clubRepo: IClubRepository;
    private userRepo: IUserRepository;
    private notificationService: INotificationService;
    
    async createClub(command: CreateClubCommand): Promise<Result<Club>>;
    async approveClub(command: ApproveClubCommand): Promise<Result<void>>;
    async rejectClub(command: RejectClubCommand): Promise<Result<void>>;
    async suspendClub(command: SuspendClubCommand): Promise<Result<void>>;
    async dissolveClub(command: DissolveClubCommand): Promise<Result<void>>;
    async appointDeputy(command: AppointDeputyCommand): Promise<Result<void>>;
    async addMember(command: AddMemberCommand): Promise<Result<ClubMember>>;
    async removeMember(command: RemoveMemberCommand): Promise<Result<void>>;
    async approveMember(command: ApproveMemberCommand): Promise<Result<void>>;
}

// Match Service - SRP: Match business logic
class MatchService {
    private matchRepo: IMatchRepository;
    private tournamentRepo: ITournamentRepository;
    private userRepo: IUserRepository;
    
    async startMatch(command: StartMatchCommand): Promise<Result<void>>;
    async pauseMatch(command: PauseMatchCommand): Promise<Result<void>>;
    async resumeMatch(command: ResumeMatchCommand): Promise<Result<void>>;
    async endMatch(command: EndMatchCommand): Promise<Result<void>>;
    async recordEvent(command: RecordEventCommand): Promise<Result<MatchEvent>>;
    async updateScore(command: UpdateScoreCommand): Promise<Result<void>>;
}

// Auth Service - SRP: Authentication business logic
class AuthService {
    private userRepo: IUserRepository;
    private supabaseAuth: SupabaseAuthClient;
    
    async login(command: LoginCommand): Promise<Result<AuthResponse>>;
    async register(command: RegisterCommand): Promise<Result<AuthResponse>>;
    async logout(): Promise<Result<void>>;
    async resetPassword(command: ResetPasswordCommand): Promise<Result<void>>;
    async changePassword(command: ChangePasswordCommand): Promise<Result<void>>;
    async verifyEmail(token: string): Promise<Result<void>>;
}

// User Service - SRP: User management business logic
class UserService {
    private userRepo: IUserRepository;
    
    async updateProfile(command: UpdateProfileCommand): Promise<Result<User>>;
    async suspendUser(command: SuspendUserCommand): Promise<Result<void>>;
    async unlockUser(command: UnlockUserCommand): Promise<Result<void>>;
    async assignRole(command: AssignRoleCommand): Promise<Result<void>>;
}
```

### Factory Pattern

```typescript
// Factory for creating complex objects
class TournamentFactory {
    static create(command: CreateTournamentCommand): Tournament {
        return new Tournament({
            id: generateUUID(),
            name: command.name,
            sportCategory: command.sportCategoryId,
            rules: command.rules,
            maxTeams: command.maxTeams,
            registrationDeadline: command.registrationDeadline,
            startDate: command.startDate,
            endDate: command.endDate,
            matchDays: command.matchDays || [6, 7],
            matchTimes: command.matchTimes || ['17:00', '19:00'],
            status: 'registration_open',
            createdAt: new Date()
        });
    }
}

class MatchFactory {
    static createFromSchedule(
        tournament: Tournament,
        homeClub: Club,
        awayClub: Club,
        matchDate: Date,
        matchTime: string,
        venue: Venue
    ): Match {
        return new Match({
            id: generateUUID(),
            tournament,
            homeClub,
            awayClub,
            venue,
            matchDate,
            matchTime,
            homeScore: 0,
            awayScore: 0,
            status: 'scheduled',
            createdAt: new Date()
        });
    }
}
```

### Observer Pattern (Notifications)

```typescript
// Observer Interface
interface DomainEventObserver {
    handle(event: DomainEvent): Promise<void>;
}

// Events
abstract class DomainEvent {
    readonly occurredAt: Date = new Date();
    abstract readonly type: string;
}

class TournamentCreatedEvent extends DomainEvent {
    readonly type = 'TOURNAMENT_CREATED';
    constructor(public tournament: Tournament) { super(); }
}

class ClubRegisteredEvent extends DomainEvent {
    readonly type = 'CLUB_REGISTERED';
    constructor(public club: Club, public tournament: Tournament) { super(); }
}

class MatchStartedEvent extends DomainEvent {
    readonly type = 'MATCH_STARTED';
    constructor(public match: Match) { super(); }
}

class MatchEndedEvent extends DomainEvent {
    readonly type = 'MATCH_ENDED';
    constructor(public match: Match) { super(); }
}

// Event Bus - SRP: Event distribution
class DomainEventBus {
    private observers: Map<string, DomainEventObserver[]> = new Map();
    
    subscribe(eventType: string, observer: DomainEventObserver): void;
    unsubscribe(eventType: string, observer: DomainEventObserver): void;
    async publish(event: DomainEvent): Promise<void>;
}

// Notification Observer
class NotificationObserver implements DomainEventObserver {
    private notificationService: INotificationService;
    
    async handle(event: DomainEvent): Promise<void> {
        switch (event.type) {
            case 'TOURNAMENT_CREATED':
                await this.notifyAllUsers(event as TournamentCreatedEvent);
                break;
            case 'CLUB_REGISTERED':
                await this.notifyTournamentAdmins(event as ClubRegisteredEvent);
                break;
            case 'MATCH_STARTED':
                await this.notifyMatchParticipants(event as MatchStartedEvent);
                break;
            case 'MATCH_ENDED':
                await this.notifyMatchResult(event as MatchEndedEvent);
                break;
        }
    }
}
```

### Strategy Pattern (Match Scheduling)

```typescript
// Strategy Interface
interface IScheduleStrategy {
    generate(tournament: Tournament, clubs: Club[]): Match[];
}

// Round Robin Strategy
class RoundRobinStrategy implements IScheduleStrategy {
    generate(tournament: Tournament, clubs: Club[]): Match[] {
        // Generate round-robin schedule
        const matches: Match[] = [];
        const venues = tournament.getVenues();
        let matchIndex = 0;
        
        for (let round = 0; round < clubs.length - 1; round++) {
            for (let i = 0; i < clubs.length / 2; i++) {
                const home = clubs[i];
                const away = clubs[clubs.length - 1 - i];
                const { date, time, venue } = this.calculateMatchSlot(tournament, matchIndex);
                
                matches.push(MatchFactory.createFromSchedule(
                    tournament, home, away, date, time, venue
                ));
                matchIndex++;
            }
            // Rotate clubs for next round
            clubs.splice(1, 0, clubs.pop()!);
        }
        
        return matches;
    }
    
    private calculateMatchSlot(tournament: Tournament, index: number): { date: Date; time: string; venue: Venue } {
        // Calculate based on matchDays and matchTimes
        // Implementation details...
    }
}

// Knockout Strategy
class KnockoutStrategy implements IScheduleStrategy {
    generate(tournament: Tournament, clubs: Club[]): Match[] {
        // Generate knockout bracket schedule
        // Implementation...
    }
}

// Strategy Context
class ScheduleGenerator {
    private strategy: IScheduleStrategy;
    
    setStrategy(strategy: IScheduleStrategy): void {
        this.strategy = strategy;
    }
    
    generate(tournament: Tournament, clubs: Club[]): Match[] {
        return this.strategy.generate(tournament, clubs);
    }
}
```

## Design Patterns Used

1. **Repository Pattern** - Abstracts data access, enables testing
2. **Service Pattern** - Encapsulates business logic
3. **Factory Pattern** - Creates complex objects consistently
4. **Observer Pattern** - Decoupled event handling for notifications
5. **Strategy Pattern** - Pluggable scheduling algorithms
6. **Command Pattern** - Encapsulates requests as objects
7. **Result Pattern** - Explicit error handling without exceptions

## SOLID Principles Applied

- **Single Responsibility (SRP)**: Each class has one reason to change
- **Open/Closed (OCP)**: Extensible via strategies and observers
- **Liskov Substitution (LSP)**: Repository implementations interchangeable
- **Interface Segregation (ISP)**: Specific repository interfaces
- **Dependency Inversion (DIP)**: Depend on abstractions (interfaces)
