# Backend Notes AI

A Notion-like backend with AI-powered content generation, real-time collaboration, and sharing features. Built with Express.js, TypeScript, PostgreSQL, and Socket.IO.

## Features

- **Authentication**: OAuth integration (Google & GitHub)
- **Notes Management**: CRUD operations with rich text content support
- **Real-time Collaboration**: WebSocket-based live editing with cursor tracking
- **Sharing System**: Public sharing (view/edit) and user invitations
- **AI Integration**: Content generation using Google Gemini API
- **Type Safety**: Full TypeScript implementation
- **Database**: PostgreSQL with Prisma ORM
- **Rate Limiting**: Configurable rate limiters for API endpoints

## Technology Stack

- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **WebSocket**: Socket.IO with Redis adapter
- **Authentication**: JWT + OAuth (Google, GitHub)
- **AI**: Google Gemini API
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Redis (for WebSocket scaling in production)
- Google OAuth credentials
- GitHub OAuth credentials (optional)
- Google Gemini API key

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd backend-notes-ai
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://notes_user:notes_password@localhost:5432/notes_ai"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-token-secret"

# OAuth - Google
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"

# OAuth - GitHub
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_CALLBACK_URL="http://localhost:5000/api/auth/github/callback"

# AI
GEMINI_API_KEY="your-gemini-api-key"

# Server
PORT=5000
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"
```

4. **Start PostgreSQL and Redis with Docker**

```bash
docker-compose up -d
```

5. **Setup database**

```bash
npm run prisma:generate
npm run prisma:migrate
```

6. **Start the development server**

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed database with sample data

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

#### Google OAuth

```
GET  /api/auth/google
GET  /api/auth/google/callback
```

#### GitHub OAuth

```
GET  /api/auth/github
GET  /api/auth/github/callback
```

#### User Management

```
GET    /api/auth/me          - Get current user
POST   /api/auth/refresh     - Refresh access token
POST   /api/auth/logout      - Logout user
```

### Notes Endpoints

All endpoints require authentication (Bearer token in Authorization header).

```
GET    /api/notes              - List user's notes (paginated)
GET    /api/notes/shared       - List notes shared with user
GET    /api/notes/:id          - Get single note
POST   /api/notes              - Create new note
PATCH  /api/notes/:id          - Update note
DELETE /api/notes/:id          - Delete note
PATCH  /api/notes/:id/archive  - Archive note
PATCH  /api/notes/:id/restore  - Restore note
```

### Sharing Endpoints

```
GET    /api/notes/:id/sharing           - Get sharing settings
POST   /api/notes/:id/sharing/public    - Make note public
DELETE /api/notes/:id/sharing/public    - Remove public access
POST   /api/notes/:id/sharing/invite    - Invite user by email
POST   /api/notes/invite/accept/:token  - Accept invite
DELETE /api/notes/:id/sharing/:accessId - Remove user access
PATCH  /api/notes/:id/sharing/:accessId - Update access level
GET    /api/notes/public/:id            - Access public note
```

### AI Endpoints

All AI endpoints are rate-limited (10 requests per minute).

```
POST /api/ai/generate    - Generate content from prompt
POST /api/ai/continue    - Continue writing
POST /api/ai/summarize   - Summarize document
POST /api/ai/expand      - Expand section
POST /api/ai/grammar     - Fix grammar
POST /api/ai/blog        - Generate blog post
POST /api/ai/outline     - Generate outline
GET  /api/ai/history/:noteId - Get generation history
```

## WebSocket Events

### Client → Server

```typescript
// Authentication
socket.emit('authenticate', { token: string })

// Document operations
socket.emit('document:join', { noteId: string })
socket.emit('document:leave', { noteId: string })
socket.emit('document:edit', { noteId: string, operations: any[], version: number })

// Cursor tracking
socket.emit('cursor:update', { noteId: string, position: { line: number, ch: number } })

// Presence
socket.emit('presence:subscribe', { noteId: string })
```

### Server → Client

```typescript
// Document updates
socket.on('document:updated', { operations: any[], version: number, userId: string })

// User presence
socket.on('document:user:joined', { userId: string, userName: string })
socket.on('document:user:left', { userId: string })
socket.on('presence:online', { noteId: string, users: any[] })

// Cursor updates
socket.on('cursor:moved', { userId: string, userName: string, position: any, color: string })

// Errors
socket.on('error', { message: string })
```

## Database Schema

### User

- OAuth authentication (Google/GitHub)
- Profile data (name, email, avatar)

### Note

- Rich text content (JSON format)
- Owner relationship
- Public access flags
- Soft delete support

### SharedAccess

- Permission levels (VIEW/EDIT)
- User invitations via email
- Invite token system

### DocumentEdit

- Track all document changes
- Operational transformation data
- Version control

### AIGeneration

- AI generation history
- Token usage tracking

## Project Structure

```
backend-notes-ai/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── websocket/        # WebSocket implementation
│   ├── models/           # TypeScript interfaces
│   ├── validators/       # Request validation schemas
│   ├── utils/            # Utility functions
│   ├── types/            # Global TypeScript types
│   └── app.ts            # Express app entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── tests/                # Test files
├── .env.example          # Environment variables template
├── docker-compose.yml    # PostgreSQL + Redis
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Security Features

- **Authentication**: JWT-based OAuth (Google, GitHub)
- **Rate Limiting**: Configurable rate limiters
- **CORS**: Configured for specific frontend origin
- **Helmet**: HTTP headers security
- **Input Validation**: Zod schemas for all endpoints
- **SQL Injection Prevention**: Prisma ORM handles this
- **XSS Protection**: Input sanitization

## OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### GitHub OAuth

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. Copy Client ID and Client Secret to `.env`

## Gemini AI Setup

1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Create an API key
3. Copy the API key to `.env` as `GEMINI_API_KEY`

## Development Tips

### View Database

```bash
npm run prisma:studio
```

### Reset Database

```bash
npm run prisma:migrate reset
```

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Create New Migration

```bash
npx prisma migrate dev --name migration_name
```

## Production Deployment

1. Set `NODE_ENV=production` in environment variables
2. Use strong JWT secrets
3. Configure CORS for production domain
4. Use Redis for WebSocket scaling
5. Enable all security headers
6. Set up monitoring and logging
7. Use a process manager (PM2)
8. Configure reverse proxy (Nginx)

## License

ISC

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please open a GitHub issue.
