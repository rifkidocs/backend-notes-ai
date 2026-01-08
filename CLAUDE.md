# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Database
```bash
npm run prisma:generate    # Generate Prisma client after schema changes
npm run prisma:migrate     # Run database migrations
npm run prisma:studio      # Open Prisma Studio (database GUI)
npx prisma migrate dev --name <name>  # Create new migration
npx prisma migrate reset   # Reset database (DESTRUCTIVE)
```

### Server
```bash
npm run dev    # Start development server with nodemon (auto-reload)
npm run build  # Compile TypeScript to JavaScript
npm start      # Start production server
```

### Infrastructure
```bash
docker-compose up -d    # Start PostgreSQL and Redis
```

## Architecture Overview

### Layered Architecture
The codebase follows a classic Express.js layered architecture:
- **Routes** (`src/routes/`) - Define API endpoints and map to controllers
- **Controllers** (`src/controllers/`) - Handle HTTP requests/responses
- **Services** (`src/services/`) - Business logic layer
- **Middleware** (`src/middleware/`) - Auth, validation, error handling, rate limiting

### Key Architectural Patterns

**OAuth Authentication Flow:**
- JWT tokens (15min access, 7d refresh)
- Passport.js strategies in `src/config/oauth.ts`
- User lookup via `AuthService.findOrCreateUser()` - upserts based on OAuth provider ID
- Tokens generated in `AuthService.generateTokens()`

**WebSocket Real-time Collaboration:**
- Socket.IO server initialized in `src/websocket/socket.server.ts`
- JWT auth required on connection (via `socket.handshake.auth.token`)
- Three handler modules: `document.handler.ts`, `cursor.handler.ts`, `presence.handler.ts`
- Document rooms track version for conflict detection
- `SharingService.checkNoteAccess()` centralizes permission checks

**Permission System:**
- Owner always has full access
- Public access controlled by `Note.isPublic` and `Note.publicAccess` (VIEW/EDIT)
- User-specific grants via `SharedAccess` table
- `checkNoteAccess()` returns `{ canView, canEdit }` - use this for all auth checks

**AI Integration:**
- Google Gemini API via `@google/generative-ai`
- `AIService` methods: generateContent, continueWriting, summarizeDocument, expandSection, fixGrammar, generateBlogPost, generateOutline
- AI endpoints rate-limited (10 req/min)
- Generation history tracked in `AIGeneration` table

### Database Schema (Prisma)

**Core Models:**
- `User` - OAuth users (Google/GitHub), identified by `provider + providerId`
- `Note` - Rich text content (JSON), soft delete via `isDeleted`, archive via `isArchived`
- `SharedAccess` - User permissions + pending email invites (token-based, 7-day expiry)
- `DocumentEdit` - OT operation history with version tracking
- `AIGeneration` - AI generation history per note

**Important Enums:**
- `Provider`: GOOGLE, GITHUB
- `AccessLevel`: VIEW, EDIT

### Module Dependencies

**Service Dependencies:**
- `AuthService` - standalone, used by auth controller
- `SharingService` - standalone, used by sharing controller AND WebSocket handlers
- `AIService` - standalone, used by AI controller
- `NotesService` - (if exists) uses SharingService for access checks

**WebSocket Auth Flow:**
1. Client sends token via `socket.handshake.auth.token`
2. Middleware verifies JWT, loads user from DB, attaches to `socket.user`
3. Handlers use `SharingService.checkNoteAccess()` for permissions

### TypeScript Types
- Express types extended in `src/types/express.d.ts` - adds `user` property to Request
- Global types in `src/types/global.d.ts`
- Prisma generates types from schema

## Important Notes

**Rate Limiting:**
- General limiter on `/api` routes
- AI endpoints have stricter limits (configured in middleware)

**Soft Deletes:**
- Notes use `isDeleted` flag - filter these out in queries
- Cascade deletes configured in Prisma schema for related records

**CORS Configuration:**
- Set via `FRONTEND_URL` env var, defaults to `http://localhost:3000`
- Credentials enabled for cookie-based auth

**Redis for Production:**
- Socket.IO Redis adapter (`socket.io-redis`) configured but optional
- Required for scaling WebSocket across multiple server instances

**Environment Variables:**
- Required: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GEMINI_API_KEY`, OAuth credentials
- Optional: `REDIS_URL` (for Socket.IO scaling), `NODE_ENV`

**Prisma Client:**
- Singleton export from `src/config/database.ts`
- Always import as `import prisma from '../config/database'`

**Error Handling:**
- `AppError` class in `src/middleware/error.middleware.ts`
- Centralized error handler at end of middleware chain
