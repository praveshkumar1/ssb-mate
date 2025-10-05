# SSB Connect Backend

A Node.js + Express + PostgreSQL backend for the SSB Connect coaching platform.

## Features

- **Express.js** REST API server
- **PostgreSQL** database with Knex.js ORM
- **TypeScript** for type safety
- **JWT** authentication (ready for implementation)
- **Winston** logging
- **Helmet** security headers
- **CORS** configured for frontend
- **Rate limiting** protection
- **Database migrations** and seeds
- **Comprehensive error handling**

## Prerequisites

- Node.js 18+ and npm 8+
- PostgreSQL 12+ database

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your settings:

```bash
copy .env.example .env
```

Edit `.env` with your database credentials:

```env
NODE_ENV=development
PORT=8080

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ssbconnect
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ssbconnect
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# API Configuration
CORS_ORIGIN=http://localhost:9000
```

### 3. Database Setup

Make sure PostgreSQL is running and create the database:

```sql
CREATE DATABASE ssbconnect;
```

Run migrations and seed data:

```bash
npm run migrate
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run migrate:rollback` - Rollback last migration
- `npm run seed` - Run database seeds
- `npm test` - Run tests

## API Endpoints

### Test Endpoints
- `GET /api/test/hello` - Simple test endpoint
- `GET /api/test/health` - Health check with system info

### Coach Endpoints
- `GET /api/coaches/verified` - Get all verified coaches
- `GET /api/coaches/:id` - Get coach by ID
- `GET /api/coaches` - Get coaches with filters (pagination, verified, sport, etc.)

### User Endpoints
- `GET /api/users/profile` - User profile (placeholder)

### System Endpoints
- `GET /health` - Application health check

## Database Schema

### Users Table
- Basic user information (id, email, name, role, etc.)
- Supports roles: user, coach, admin

### Coaches Table
- Extended coach information (bio, experience, certifications, etc.)
- Links to users table via foreign key
- Includes specializations, hourly rates, ratings

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 8080 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | ssbconnect |
| `DB_USER` | Database user | - |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 24h |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |
| `LOG_LEVEL` | Logging level | info |
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) | - |
| `SUPABASE_ANON_KEY` | Supabase anon key (fallback if service role not provided) | - |
| `SUPABASE_BUCKET` | Supabase Storage bucket name for uploads | avatars |
| `SUPABASE_USE_SIGNED_URL` | If true, use time-limited signed URLs for images | false |
| `SUPABASE_SIGNED_URL_TTL` | Signed URL TTL in seconds | 604800 (7 days) |

## Project Structure

```
src/
├── database/           # Database configuration and migrations
│   ├── migrations/     # Database migration files
│   ├── seeds/         # Database seed files
│   └── connection.ts  # Database connection setup
├── middleware/        # Express middleware
│   ├── errorHandler.ts
│   └── notFoundHandler.ts
├── routes/           # API route definitions
│   ├── testRoutes.ts
│   ├── coachRoutes.ts
│   └── userRoutes.ts
├── services/         # Business logic layer
│   └── coachService.ts
├── types/           # TypeScript type definitions
│   └── index.ts
├── utils/           # Utility functions
│   └── logger.ts
└── server.ts        # Main application file
```

## Development Tips

1. **Hot Reload**: The development server uses nodemon for automatic restarts
2. **Logging**: Check console and `logs/` directory for application logs
3. **Database Changes**: Create new migrations for schema changes
4. **Testing**: Use the `/api/test/hello` endpoint to verify the server is running
5. **CORS**: Already configured for React frontend at localhost:5173

## Production Deployment

1. Set `NODE_ENV=production`
2. Update database credentials
3. Set a secure `JWT_SECRET`
4. Configure proper `CORS_ORIGIN`
5. Run `npm run build && npm start`

## Testing with Frontend

The backend is configured to work with the React frontend. Make sure both are running:

- Backend: `http://localhost:8080`
- Frontend: `http://localhost:9000`

The frontend should automatically connect to the backend API endpoints.
