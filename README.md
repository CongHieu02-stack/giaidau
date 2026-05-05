# MyLeague - Sports Tournament Management System

A comprehensive sports league management platform built with Vue 3, following SOLID principles and modern design patterns.

## Features

- **Tournament Management**: Create, manage, and track sports tournaments
- **Club Management**: Register and manage sports clubs with member roles
- **Match Scheduling**: Automatic round-robin or knockout bracket generation
- **Live Match Control**: Referees can control matches and update scores in real-time
- **Multi-role System**: Super Admin, Admin, Club Leader, Club Deputy, Referee, and User roles
- **Responsive Design**: Modern UI with beautiful animations and glass morphism effects
- **Real-time Updates**: Live notifications and match updates

## Tech Stack

- **Frontend**: Vue 3 + Composition API
- **Build Tool**: Vite
- **UI Framework**: PrimeVue with Aura theme
- **State Management**: Pinia
- **Routing**: Vue Router
- **Backend**: Supabase (PostgreSQL + Auth)
- **Architecture**: SOLID principles with Repository and Service patterns

## Design Patterns Applied

1. **SRP (Single Responsibility Principle)**: Each class/component has one reason to change
2. **Repository Pattern**: Abstracted data access layer for easy testing
3. **Service Pattern**: Business logic encapsulated in services
4. **Factory Pattern**: Consistent object creation
5. **Observer Pattern**: Domain events for notifications
6. **Strategy Pattern**: Pluggable scheduling algorithms

## Project Structure

```
src/
├── components/          # Vue components
│   ├── common/          # Shared components (TournamentCard, FeatureCard)
│   ├── forms/           # Form components
│   └── layout/          # Layout components (AppNavbar, AppFooter)
├── composables/         # Vue composables
├── config/              # Configuration (Supabase)
├── domain/              # Domain entities (User, Club, Tournament, Match)
├── repositories/        # Repository pattern implementations
├── router/              # Vue Router configuration
├── services/            # Business logic services
├── stores/              # Pinia stores (Auth, Tournament)
├── types/               # Type definitions and enums
├── utils/               # Utility functions and Result pattern
├── views/               # Page components
│   ├── admin/           # Admin dashboard and management
│   ├── auth/            # Login, Register, Forgot Password
│   ├── club/            # Club leader views
│   ├── referee/         # Referee match control views
│   ├── shared/          # Public views (Home, Tournaments, Clubs)
│   └── user/            # User profile and settings
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Setup Supabase Database

Follow the detailed instructions in [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) to:
- Create database tables
- Setup Row Level Security (RLS) policies
- Configure auth triggers

### 4. Run Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
```

## User Roles

| Role | Permissions |
|------|-------------|
| Super Admin | Full system access, user management, role assignment |
| Admin | Tournament and club management, referee assignment |
| Club Leader | Manage own club, register for tournaments, approve members |
| Club Deputy | Assist club leader with management tasks |
| Referee | Control assigned matches, update scores |
| User | View tournaments, join clubs, register for tournaments |

## Key Features by Role

### Admin
- Create and manage tournaments
- Approve/reject clubs
- Assign referees to matches
- Generate match schedules
- Cancel tournaments with reason

### Club Leader
- Manage club members (approve/reject)
- Register club for tournaments
- Select players for tournament squads
- Appoint/deputy leaders

### Referee
- View assigned matches
- Control match flow (start, pause, resume, end)
- Record goals, cards, substitutions
- Update match scores

### User
- View tournaments and clubs
- Join clubs
- Register for tournaments through clubs
- View personal statistics
- Manage profile

## Documentation

- [Database Schema](./docs/DATABASE_SCHEMA.md) - Complete SQL schema for Supabase
- [Class Diagram](./docs/CLASS_DIAGRAM.md) - System architecture and design patterns
- [Setup Guide](./docs/SETUP_GUIDE.md) - Step-by-step setup instructions

## Screenshots

### Home Page
Beautiful landing page with animated hero section, featured tournaments, and feature highlights.

### Tournament Management
Admin interface for creating tournaments, managing registrations, and generating schedules.

### Match Control
Referee interface for controlling live matches with real-time updates.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@myleague.vn or create an issue in the repository.

---

Built with ❤️ using Vue 3 and Supabase

