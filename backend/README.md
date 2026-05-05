# Backend API - MVC Structure

## Structure
```
backend/
├── config/          # Configuration files
├── controllers/     # Request handlers (Controller in MVC)
├── models/          # Database models / repositories (Model in MVC)
├── services/        # Business logic layer
├── middleware/      # Express middleware
├── routes/          # API routes (maps to controllers)
├── utils/           # Helper functions
├── validators/      # Input validation
├── database/        # Migrations & seeds
└── server.js        # Entry point
```

## MVC Flow
```
Request → Route → Middleware → Controller → Service → Model → Database
                ↑___________________________________________|
                           Response
```

## Setup
```bash
cd backend
npm install
npm run dev
```
