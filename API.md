# API Documentation

Backend Notes AI - REST API Reference

**Base URL:** `http://localhost:5000/api`

**Version:** 1.0.0

---

## Table of Contents

- [Authentication](#authentication)
- [Notes](#notes)
- [Sharing](#sharing)
- [AI](#ai)
- [WebSocket Events](#websocket-events)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Types

| Token Type | Expiry | Usage |
|------------|--------|-------|
| Access Token | 15 minutes | API authentication |
| Refresh Token | 7 days | Obtain new access token |

---

### OAuth Endpoints

#### Google OAuth

Initiate Google OAuth flow

```http
GET /api/auth/google
```

**Rate Limit:** 5 requests per 15 minutes

**Response:** Redirects to Google OAuth page

---

#### Google OAuth Callback

```http
GET /api/auth/google/callback
```

**Rate Limit:** 5 requests per 15 minutes

**Success Response:** Redirects to frontend with tokens

```
<FRONTEND_URL>/auth/callback?accessToken=<token>&refreshToken=<token>
```

**Error Response:** Redirects to frontend with error

```
<FRONTEND_URL>/auth/error?message=<error_message>
```

---

#### GitHub OAuth

Initiate GitHub OAuth flow

```http
GET /api/auth/github
```

**Rate Limit:** 5 requests per 15 minutes

**Response:** Redirects to GitHub OAuth page

---

#### GitHub OAuth Callback

```http
GET /api/auth/github/callback
```

**Rate Limit:** 5 requests per 15 minutes

**Success Response:** Redirects to frontend with tokens

```
<FRONTEND_URL>/auth/callback?accessToken=<token>&refreshToken=<token>
```

---

### Get Current User

Get authenticated user information

```http
GET /api/auth/me
```

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "id": "clx1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "provider": "GOOGLE",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLoginAt": "2024-01-15T10:30:00.000Z"
}
```

---

### Refresh Token

Obtain new access token using refresh token

```http
POST /api/auth/refresh
```

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Logout

Logout current user (client-side token deletion)

```http
POST /api/auth/logout
```

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

---

## Notes

All notes endpoints require authentication.

### Get User's Notes

Get paginated list of user's own notes

```http
GET /api/notes?page=1&limit=20&search=keyword&includeDeleted=false
```

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| search | string | - | Search in title |
| includeDeleted | boolean | false | Include deleted notes |

**Response:** `200 OK`

```json
{
  "notes": [
    {
      "id": "clx1234567890",
      "title": "My Note",
      "content": { "type": "doc", "children": [] },
      "icon": null,
      "coverImage": null,
      "isDeleted": false,
      "isArchived": false,
      "isPublic": false,
      "publicAccess": null,
      "ownerId": "clx0987654321",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "owner": {
        "id": "clx0987654321",
        "name": "John Doe",
        "email": "user@example.com",
        "avatar": "https://example.com/avatar.jpg"
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### Get Shared Notes

Get notes shared with the authenticated user

```http
GET /api/notes/shared?page=1&limit=20
```

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response:** `200 OK`

```json
{
  "notes": [
    {
      "id": "clx1234567890",
      "title": "Shared Note",
      "content": { "type": "doc", "children": [] },
      "owner": {
        "id": "clx0987654321",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "avatar": "https://example.com/avatar.jpg"
      },
      "sharedAccess": [
        {
          "id": "clx1111111111",
          "accessLevel": "EDIT",
          "userId": "clx0987654321"
        }
      ],
      "isPublic": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### Get Note by ID

Get a single note by ID (requires access permission)

```http
GET /api/notes/:id
```

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Note ID |

**Response:** `200 OK`

```json
{
  "id": "clx1234567890",
  "title": "My Note",
  "content": {
    "type": "doc",
    "children": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Hello world" }]
      }
    ]
  },
  "icon": "",
  "coverImage": null,
  "isDeleted": false,
  "isArchived": false,
  "isPublic": false,
  "publicAccess": null,
  "ownerId": "clx0987654321",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "owner": {
    "id": "clx0987654321",
    "name": "John Doe",
    "email": "user@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "sharedAccess": [
    {
      "id": "clx1111111111",
      "accessLevel": "VIEW",
      "noteId": "clx1234567890",
      "userId": "clx2222222222",
      "user": {
        "id": "clx2222222222",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "avatar": null
      },
      "inviteEmail": null,
      "inviteToken": null,
      "inviteExpiresAt": null,
      "inviteAcceptedAt": "2024-01-10T00:00:00.000Z",
      "createdAt": "2024-01-10T00:00:00.000Z",
      "updatedAt": "2024-01-10T00:00:00.000Z"
    }
  ]
}
```

**Error Response:** `403 Forbidden`

```json
{
  "error": "Forbidden",
  "message": "You do not have access to this note"
}
```

---

### Create Note

Create a new note

```http
POST /api/notes
```

**Authentication:** Required

**Request Body:**

```json
{
  "title": "My New Note",
  "content": {
    "type": "doc",
    "children": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Content here" }]
      }
    ]
  }
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| title | string | No | "Untitled" | Note title |
| content | object | No | Empty doc | Rich text content (JSON) |

**Response:** `201 Created`

```json
{
  "id": "clx1234567890",
  "title": "My New Note",
  "content": { "type": "doc", "children": [] },
  "icon": null,
  "coverImage": null,
  "isDeleted": false,
  "isArchived": false,
  "isPublic": false,
  "publicAccess": null,
  "ownerId": "clx0987654321",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "owner": {
    "id": "clx0987654321",
    "name": "John Doe",
    "email": "user@example.com",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

---

### Update Note

Update an existing note (only owner can update)

```http
PATCH /api/notes/:id
```

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Note ID |

**Request Body:**

```json
{
  "title": "Updated Title",
  "content": { "type": "doc", "children": [] },
  "icon": "",
  "coverImage": "https://example.com/cover.jpg"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | New title |
| content | object | No | New content |
| icon | string | No | Emoji icon |
| coverImage | string | No | Cover image URL |

**Response:** `200 OK`

```json
{
  "id": "clx1234567890",
  "title": "Updated Title",
  "content": { "type": "doc", "children": [] },
  "icon": "",
  "coverImage": "https://example.com/cover.jpg",
  "isDeleted": false,
  "isArchived": false,
  "isPublic": false,
  "publicAccess": null,
  "ownerId": "clx0987654321",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z",
  "owner": {
    "id": "clx0987654321",
    "name": "John Doe",
    "email": "user@example.com",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

---

### Delete Note

Soft delete a note (only owner can delete)

```http
DELETE /api/notes/:id
```

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Note ID |

**Response:** `200 OK`

```json
{
  "message": "Note deleted successfully"
}
```

---

### Archive Note

Archive a note (only owner can archive)

```http
PATCH /api/notes/:id/archive
```

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Note ID |

**Response:** `200 OK`

```json
{
  "id": "clx1234567890",
  "title": "My Note",
  "isDeleted": false,
  "isArchived": true,
  "updatedAt": "2024-01-15T11:00:00.000Z",
  ...
}
```

---

### Restore Note

Restore a deleted or archived note

```http
PATCH /api/notes/:id/restore
```

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Note ID |

**Response:** `200 OK`

```json
{
  "id": "clx1234567890",
  "title": "My Note",
  "isDeleted": false,
  "isArchived": false,
  "updatedAt": "2024-01-15T11:00:00.000Z",
  ...
}
```

---

## Sharing

Manage note sharing and permissions.

### Get Sharing Settings

Get sharing settings for a note (only owner)

```http
GET /api/notes/:id/sharing
```

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Note ID |

**Response:** `200 OK`

```json
{
  "isPublic": false,
  "publicAccess": null,
  "sharedAccess": [
    {
      "id": "clx1111111111",
      "accessLevel": "EDIT",
      "noteId": "clx1234567890",
      "userId": "clx2222222222",
      "user": {
        "id": "clx2222222222",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "avatar": null
      },
      "inviteEmail": null,
      "inviteToken": null,
      "inviteExpiresAt": null,
      "inviteAcceptedAt": "2024-01-10T00:00:00.000Z",
      "createdAt": "2024-01-10T00:00:00.000Z",
      "updatedAt": "2024-01-10T00:00:00.000Z"
    }
  ]
}
```

---

### Make Note Public

Make a note publicly accessible (only owner)

```http
POST /api/notes/:id/sharing/public
```

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Note ID |

**Request Body:**

```json
{
  "accessLevel": "VIEW"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| accessLevel | enum | Yes | "VIEW" or "EDIT" |

**Response:** `200 OK`

```json
{
  "id": "clx1234567890",
  "title": "My Note",
  "isPublic": true,
  "publicAccess": "VIEW",
  "updatedAt": "2024-01-15T11:00:00.000Z",
  ...
}
```

---

### Remove Public Access

Remove public access from a note (only owner)

```http
DELETE /api/notes/:id/sharing/public
```

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Note ID |

**Response:** `200 OK`

```json
{
  "id": "clx1234567890",
  "title": "My Note",
  "isPublic": false,
  "publicAccess": null,
  "updatedAt": "2024-01-15T11:00:00.000Z",
  ...
}
```

---

### Invite User by Email

Invite a user to access a note (only owner)

```http
POST /api/notes/:id/sharing/invite
```

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Note ID |

**Request Body:**

```json
{
  "email": "invitee@example.com",
  "accessLevel": "EDIT"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email to invite |
| accessLevel | enum | Yes | "VIEW" or "EDIT" |

**Response:** `201 Created`

```json
{
  "id": "clx1111111111",
  "accessLevel": "EDIT",
  "noteId": "clx1234567890",
  "userId": "clx2222222222",
  "user": {
    "id": "clx2222222222",
    "name": "Jane Doe",
    "email": "invitee@example.com",
    "avatar": null
  },
  "inviteToken": "abc123def456...",
  "inviteExpiresAt": "2024-01-22T00:00:00.000Z",
  "inviteAcceptedAt": "2024-01-15T00:00:00.000Z",
  "createdAt": "2024-01-15T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z"
}
```

**Note:** If user doesn't exist, `userId` will be `null` and invite must be accepted via token.

---

### Accept Invite

Accept a sharing invitation

```http
POST /api/notes/invite/accept/:token
```

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| token | string | Invite token |

**Response:** `200 OK`

```json
{
  "id": "clx1111111111",
  "accessLevel": "EDIT",
  "noteId": "clx1234567890",
  "userId": "clx2222222222",
  "inviteAcceptedAt": "2024-01-15T11:00:00.000Z",
  "note": {
    "id": "clx1234567890",
    "title": "Shared Note",
    ...
  }
}
```

---

### Remove User Access

Remove a user's access to a note (only owner)

```http
DELETE /api/notes/:id/sharing/:accessId
```

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Note ID |
| accessId | string | Shared access ID |

**Response:** `200 OK`

```json
{
  "message": "Access removed successfully"
}
```

---

### Update Access Level

Update a user's access level (only owner)

```http
PATCH /api/notes/:id/sharing/:accessId
```

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Note ID |
| accessId | string | Shared access ID |

**Request Body:**

```json
{
  "accessLevel": "VIEW"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| accessLevel | enum | Yes | "VIEW" or "EDIT" |

**Response:** `200 OK`

```json
{
  "id": "clx1111111111",
  "accessLevel": "VIEW",
  "noteId": "clx1234567890",
  "userId": "clx2222222222",
  "user": {
    "id": "clx2222222222",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatar": null
  },
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

---

### Get Public Note

Access a public note without authentication

```http
GET /api/notes/public/:id
```

**Authentication:** Optional

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Note ID |

**Response:** `200 OK`

```json
{
  "id": "clx1234567890",
  "title": "Public Note",
  "content": { "type": "doc", "children": [] },
  "isPublic": true,
  "publicAccess": "VIEW",
  "ownerId": "clx0987654321",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "owner": {
    "id": "clx0987654321",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

---

## AI

All AI endpoints require authentication and are rate-limited to 10 requests per minute.

### Generate Content

Generate content from a prompt

```http
POST /api/ai/generate
```

**Authentication:** Required

**Rate Limit:** 10 requests/minute

**Request Body:**

```json
{
  "prompt": "Write a paragraph about AI",
  "context": "This is for a tech blog",
  "noteId": "clx1234567890"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prompt | string | Yes | Content generation prompt |
| context | string | No | Additional context |
| noteId | string | No | Note ID for history tracking |

**Response:** `200 OK`

```json
{
  "content": "Artificial Intelligence is transforming...",
  "model": "gemini-pro"
}
```

---

### Continue Writing

Continue writing from current content

```http
POST /api/ai/continue
```

**Authentication:** Required

**Rate Limit:** 10 requests/minute

**Request Body:**

```json
{
  "currentContent": "The quick brown fox jumps over the lazy dog. This is..."
}
```

**Response:** `200 OK`

```json
{
  "continuation": "a classic example of a pangram, a sentence that contains all letters of the alphabet.",
  "model": "gemini-pro"
}
```

---

### Summarize Document

Summarize document content

```http
POST /api/ai/summarize
```

**Authentication:** Required

**Rate Limit:** 10 requests/minute

**Request Body:**

```json
{
  "content": "Long document content here..."
}
```

**Response:** `200 OK`

```json
{
  "summary": "This document discusses the key points of...",
  "model": "gemini-pro"
}
```

---

### Expand Section

Expand on a specific topic/section

```http
POST /api/ai/expand
```

**Authentication:** Required

**Rate Limit:** 10 requests/minute

**Request Body:**

```json
{
  "section": "Machine learning is a subset of AI.",
  "topic": "Machine Learning"
}
```

**Response:** `200 OK`

```json
{
  "expansion": "Machine learning is a subset of artificial intelligence that focuses on...",
  "model": "gemini-pro"
}
```

---

### Fix Grammar

Fix grammar and improve readability

```http
POST /api/ai/grammar
```

**Authentication:** Required

**Rate Limit:** 10 requests/minute

**Request Body:**

```json
{
  "text": "She dont know nothing about the situation."
}
```

**Response:** `200 OK`

```json
{
  "correctedText": "She doesn't know anything about the situation.",
  "model": "gemini-pro"
}
```

---

### Generate Blog Post

Generate a complete blog post

```http
POST /api/ai/blog
```

**Authentication:** Required

**Rate Limit:** 10 requests/minute

**Request Body:**

```json
{
  "topic": "The Future of Web Development",
  "tone": "professional"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| topic | string | Yes | Blog post topic |
| tone | enum | No | "formal", "casual", or "professional" (default) |

**Response:** `200 OK`

```json
{
  "content": "# The Future of Web Development\n\nWeb development is evolving...",
  "model": "gemini-pro"
}
```

---

### Generate Outline

Generate a document outline

```http
POST /api/ai/outline
```

**Authentication:** Required

**Rate Limit:** 10 requests/minute

**Request Body:**

```json
{
  "topic": "Climate Change Solutions"
}
```

**Response:** `200 OK`

```json
{
  "outline": "## Climate Change Solutions\n\n### I. Introduction\n- Overview of climate change\n- Importance of action\n\n### II. Renewable Energy\n- Solar power\n- Wind energy\n-...",
  "model": "gemini-pro"
}
```

---

### Get Generation History

Get AI generation history for a note

```http
GET /api/ai/history/:noteId
```

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| noteId | string | Note ID |

**Response:** `200 OK`

```json
[
  {
    "id": "clx9999999999",
    "noteId": "clx1234567890",
    "prompt": "Write about AI",
    "generatedContent": "Artificial Intelligence is...",
    "model": "gemini-pro",
    "tokensUsed": null,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

## WebSocket Events

### Connection

Connect to WebSocket server:

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-access-token'
  }
});
```

### Authentication

Send token on connection:

```javascript
socket.emit('authenticate', { token: 'your-access-token' });
```

### Document Events

#### Join Document

```javascript
socket.emit('document:join', { noteId: 'clx1234567890' });
```

**Response Events:**

```javascript
// Receive current users in document
socket.on('document:users', { users: [...] });

// Notify when user joins
socket.on('document:user:joined', {
  userId: 'clx0987654321',
  userName: 'John Doe',
  socketId: 'abc123'
});
```

---

#### Leave Document

```javascript
socket.emit('document:leave', { noteId: 'clx1234567890' });
```

**Response Events:**

```javascript
socket.on('document:user:left', {
  userId: 'clx0987654321',
  socketId: 'abc123'
});
```

---

#### Edit Document

```javascript
socket.emit('document:edit', {
  noteId: 'clx1234567890',
  operations: [{ type: 'insert', position: 0, text: 'Hello' }],
  version: 5
});
```

**Response Events:**

```javascript
// Broadcast to all users in room
socket.on('document:updated', {
  operations: [{ type: 'insert', position: 0, text: 'Hello' }],
  version: 6,
  userId: 'clx0987654321',
  userName: 'John Doe',
  timestamp: '2024-01-15T10:30:00.000Z'
});

// Version conflict
socket.on('document:conflict', {
  currentVersion: 6,
  yourVersion: 5
});
```

---

### Cursor Events

#### Update Cursor

```javascript
socket.emit('cursor:update', {
  noteId: 'clx1234567890',
  position: { line: 5, ch: 10 }
});
```

**Response Events:**

```javascript
socket.on('cursor:moved', {
  userId: 'clx0987654321',
  userName: 'John Doe',
  position: { line: 5, ch: 10 },
  color: '#FF5733'
});
```

---

### Presence Events

#### Subscribe to Presence

```javascript
socket.emit('presence:subscribe', { noteId: 'clx1234567890' });
```

**Response Events:**

```javascript
socket.on('presence:online', {
  noteId: 'clx1234567890',
  users: [
    { userId: 'clx0987654321', userName: 'John Doe', color: '#FF5733' }
  ]
});
```

---

### Error Events

```javascript
socket.on('error', {
  message: 'You do not have access to this document'
});
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error Type",
  "message": "Human readable error message"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Error Types

| Error | Description |
|-------|-------------|
| Unauthorized | No token provided or invalid token |
| Token expired | Access token has expired |
| Bad Request | Invalid request parameters |
| Not Found | Resource not found |
| Forbidden | Insufficient permissions |
| Too many requests | Rate limit exceeded |
| Internal Server Error | Server error |

---

## Rate Limiting

### Rate Limit Categories

| Category | Limit | Window | Endpoints |
|----------|-------|--------|-----------|
| General | 100 requests | 15 minutes | Most API endpoints |
| Auth | 5 requests | 15 minutes | OAuth endpoints, refresh |
| AI | 10 requests | 1 minute | All AI endpoints |

### Rate Limit Headers

All rate-limited responses include these headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567890
```

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "error": "Too many requests",
  "message": "Please try again later"
}
```

---

## Data Models

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  provider: 'GOOGLE' | 'GITHUB';
  createdAt: string;
  lastLoginAt: string;
}
```

### Note

```typescript
interface Note {
  id: string;
  title: string;
  content: object;  // Rich text JSON
  icon: string | null;
  coverImage: string | null;
  isDeleted: boolean;
  isArchived: boolean;
  isPublic: boolean;
  publicAccess: 'VIEW' | 'EDIT' | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  sharedAccess?: SharedAccess[];
}
```

### SharedAccess

```typescript
interface SharedAccess {
  id: string;
  accessLevel: 'VIEW' | 'EDIT';
  noteId: string;
  userId: string | null;
  user?: User;
  inviteEmail: string | null;
  inviteToken: string | null;
  inviteExpiresAt: string | null;
  inviteAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## Environment Variables

Required for API configuration:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/notes_ai

# Redis (optional, for WebSocket scaling)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# AI
GEMINI_API_KEY=your-gemini-api-key

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AI_RATE_LIMIT_MAX=10
```
