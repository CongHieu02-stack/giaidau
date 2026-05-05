# MyLeague - MVC Project Structure

## Overview
This project follows the **MVC (Model-View-Controller)** architecture with clear separation between **Backend** and **Frontend**.

```
my-league-app/
├── backend/          # Express.js API (MVC)
├── frontend/         # Vue.js SPA (MVC)
└── supabase/         # Database setup
```

---

## Backend Structure (Express + Supabase)

```
backend/
├── config/           # Configuration
│   └── supabase.js   # Supabase client
│
├── models/           # Model layer (Database)
│   ├── BaseModel.js  # Base model class
│   ├── User.js       # User model
│   ├── Club.js       # Club model
│   ├── Tournament.js # Tournament model
│   └── index.js      # Barrel export
│
├── controllers/      # Controller layer (Request handling)
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── club.controller.js
│   ├── tournament.controller.js
│   └── match.controller.js
│
├── services/         # Business logic layer (optional)
│
├── routes/           # Route definitions
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── club.routes.js
│   ├── tournament.routes.js
│   └── match.routes.js
│
├── middleware/       # Express middleware
│   ├── auth.middleware.js
│   └── error.middleware.js
│
├── utils/            # Utility functions
├── validators/       # Input validation
├── database/         # Migrations
│
├── server.js         # Entry point
└── package.json
```

### Backend MVC Flow
```
HTTP Request
    ↓
Routes (routes/*.js)
    ↓
Middleware (auth, validation)
    ↓
Controller (controllers/*.js)
    ↓
Model (models/*.js)
    ↓
Database (Supabase)
    ↓
Response (JSON)
```

---

## Frontend Structure (Vue 3 + Pinia)

```
frontend/src/
├── api/              # Service layer (API calls)
│   ├── index.js      # Axios config
│   ├── auth.api.js
│   ├── user.api.js
│   ├── club.api.js
│   └── tournament.api.js
│
├── stores/           # State management (Model)
│   ├── auth.store.js
│   ├── user.store.js
│   ├── club.store.js
│   └── tournament.store.js
│
├── composables/      # Logic layer
│   ├── useAuth.js
│   ├── useClub.js
│   └── useTournament.js
│
├── components/       # UI components
│   ├── common/
│   ├── forms/
│   └── layout/
│
├── views/            # Page views (View layer)
│   ├── admin/
│   ├── club-admin/
│   ├── tournament-admin/
│   ├── referee/
│   ├── shared/
│   └── user/
│
├── router/           # Vue Router
├── middleware/       # Route guards
├── utils/            # Helpers
└── validators/       # Validation rules
```

### Frontend MVC Flow
```
User Action
    ↓
View (Vue Component)
    ↓
Composable / Store
    ↓
API Service
    ↓
Backend API
    ↓
Update State (Store)
    ↓
View Re-renders
```

---

## Role-Based Access Control

### Roles (Backend + Frontend)
| Role | Description | Backend Check | Frontend View |
|------|-------------|---------------|---------------|
| `super_admin` | Full system access | `is_super_admin()` | `/admin/*` |
| `tournament_admin` | Manage tournaments | `is_tournament_admin()` | `/tournament-admin/*` |
| `club_admin` | Manage clubs | `is_club_admin()` | `/club-admin/*` |
| `club_leader` | Manage own club | `leader_id = auth.uid()` | `/club/*` |
| `club_deputy` | Assist leader | `deputy_id = auth.uid()` | `/club/*` |
| `referee` | Control matches | `referee_id = auth.uid()` | `/referee/*` |
| `user` | Regular member | - | Default views |

---

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Database Setup
1. Go to Supabase SQL Editor
2. Run `supabase/FRESH_SETUP.sql`
3. Set super admin: `ngconghieu2005@gmail.com`

---

## API Endpoints

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Clubs
- `GET /api/clubs` - List clubs
- `POST /api/clubs` - Create club
- `GET /api/clubs/:id` - Get club
- `PUT /api/clubs/:id` - Update club
- `POST /api/clubs/:id/approve` - Approve club

### Tournaments
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/:id` - Get tournament
- `PUT /api/tournaments/:id` - Update tournament
- `POST /api/tournaments/:id/register` - Register club

---

## File Naming Conventions

### Backend
- Models: `PascalCase.js` (e.g., `User.js`)
- Controllers: `name.controller.js` (e.g., `auth.controller.js`)
- Routes: `name.routes.js` (e.g., `user.routes.js`)

### Frontend
- Components: `PascalCase.vue` (e.g., `TournamentCard.vue`)
- Stores: `name.store.js` (e.g., `auth.store.js`)
- Composables: `useName.js` (e.g., `useAuth.js`)
- API: `name.api.js` (e.g., `user.api.js`)
