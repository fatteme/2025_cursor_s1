# MovieSwipe API Documentation

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-production-api.com/api`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### Verify Token
```
GET /auth/verify
```
**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "preferences": {
      "genres": ["Action", "Comedy"],
      "maxRating": 10,
      "minYear": 2000,
      "maxYear": 2024
    }
  }
}
```

#### Get Profile
```
GET /auth/profile
```
**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "preferences": {
      "genres": ["Action", "Comedy"],
      "maxRating": 10,
      "minYear": 2000,
      "maxYear": 2024
    },
    "groups": [
      {
        "id": "group_id",
        "name": "Movie Night",
        "invitationCode": "ABC12345"
      }
    ]
  }
}
```

#### Update Preferences
```
PUT /auth/preferences
```
**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "genres": ["Action", "Comedy", "Drama"],
  "maxRating": 8,
  "minYear": 2010,
  "maxYear": 2024
}
```

### Groups

#### Get User's Groups
```
GET /groups
```
**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "groups": [
    {
      "id": "group_id",
      "name": "Movie Night",
      "invitationCode": "ABC12345",
      "owner": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "https://example.com/avatar.jpg"
      },
      "members": [
        {
          "id": "user_id",
          "name": "John Doe",
          "email": "john@example.com",
          "avatar": "https://example.com/avatar.jpg"
        }
      ],
      "memberCount": 1,
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Group
```
POST /groups
```
**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Movie Night"
}
```

#### Join Group
```
POST /groups/join
```
**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "invitationCode": "ABC12345"
}
```

#### Get Group Details
```
GET /groups/{groupId}
```
**Headers:**
- `Authorization: Bearer <token>`

#### Leave Group
```
POST /groups/{groupId}/leave
```
**Headers:**
- `Authorization: Bearer <token>`

#### Delete Group (Owner Only)
```
DELETE /groups/{groupId}
```
**Headers:**
- `Authorization: Bearer <token>`

### Voting Sessions

#### Start Voting Session
```
POST /voting/{groupId}/start
```
**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session_id",
    "groupId": "group_id",
    "status": "pending",
    "movies": [
      {
        "id": "movie_id",
        "title": "Movie Title",
        "overview": "Movie description...",
        "posterPath": "https://image.tmdb.org/t/p/w500/poster.jpg",
        "releaseDate": "2024-01-01",
        "voteAverage": 7.5,
        "genres": ["Action", "Adventure"]
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Current Voting Session
```
GET /voting/{groupId}/current
```
**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session_id",
    "groupId": "group_id",
    "status": "active",
    "movies": [...],
    "userVotes": [
      {
        "movieId": "movie_id",
        "vote": "yes"
      }
    ],
    "progress": 50,
    "startedAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Vote on Movie
```
POST /voting/{groupId}/vote
```
**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "movieId": "movie_id",
  "vote": "yes"
}
```

#### End Voting Session
```
POST /voting/{groupId}/end
```
**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Voting session ended",
  "session": {
    "id": "session_id",
    "groupId": "group_id",
    "status": "completed",
    "selectedMovie": {
      "id": "movie_id",
      "title": "Selected Movie",
      "overview": "Movie description...",
      "posterPath": "https://image.tmdb.org/t/p/w500/poster.jpg",
      "releaseDate": "2024-01-01",
      "voteAverage": 8.0,
      "genres": ["Action", "Adventure"]
    },
    "voteResults": {
      "movie_id": {
        "yes": 3,
        "no": 1,
        "total": 4
      }
    },
    "endedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Voting Results
```
GET /voting/{groupId}/results/{sessionId}
```
**Headers:**
- `Authorization: Bearer <token>`

#### Get Voting History
```
GET /voting/{groupId}/history
```
**Headers:**
- `Authorization: Bearer <token>`

### Movies

#### Search Movies
```
GET /movies/search?query=inception&limit=10
```

**Response:**
```json
{
  "success": true,
  "movies": [
    {
      "id": "movie_id",
      "title": "Inception",
      "overview": "Movie description...",
      "posterPath": "https://image.tmdb.org/t/p/w500/poster.jpg",
      "releaseDate": "2010-07-16",
      "voteAverage": 8.4,
      "genres": ["Action", "Sci-Fi", "Thriller"]
    }
  ]
}
```

#### Get Movie Details
```
GET /movies/{movieId}
```

**Response:**
```json
{
  "success": true,
  "movie": {
    "id": "movie_id",
    "title": "Movie Title",
    "overview": "Detailed movie description...",
    "posterPath": "https://image.tmdb.org/t/p/w500/poster.jpg",
    "backdropPath": "https://image.tmdb.org/t/p/original/backdrop.jpg",
    "releaseDate": "2024-01-01",
    "voteAverage": 7.5,
    "voteCount": 1000,
    "genres": [
      {
        "id": 28,
        "name": "Action"
      }
    ],
    "runtime": 120,
    "director": "Director Name",
    "cast": [
      {
        "id": 1,
        "name": "Actor Name",
        "character": "Character Name",
        "profilePath": "https://image.tmdb.org/t/p/w185/profile.jpg"
      }
    ],
    "videos": [
      {
        "id": "video_id",
        "key": "video_key",
        "name": "Trailer",
        "site": "YouTube",
        "type": "Trailer"
      }
    ]
  }
}
```

## WebSocket Events

### Client to Server

#### Join Voting Session
```json
{
  "event": "join-voting-session",
  "data": {
    "groupId": "group_id"
  }
}
```

#### Vote on Movie
```json
{
  "event": "vote-movie",
  "data": {
    "movieId": "movie_id",
    "vote": "yes"
  }
}
```

#### Start Voting Session
```json
{
  "event": "start-voting-session",
  "data": {
    "groupId": "group_id"
  }
}
```

#### End Voting Session
```json
{
  "event": "end-voting-session",
  "data": {
    "groupId": "group_id",
    "selectedMovie": {
      "id": "movie_id",
      "title": "Selected Movie"
    }
  }
}
```

### Server to Client

#### User Joined Voting
```json
{
  "event": "user-joined-voting",
  "data": {
    "userId": "user_id",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Movie Voted
```json
{
  "event": "movie-voted",
  "data": {
    "userId": "user_id",
    "movieId": "movie_id",
    "vote": "yes",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Voting Session Started
```json
{
  "event": "voting-session-started",
  "data": {
    "groupId": "group_id",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Voting Session Ended
```json
{
  "event": "voting-session-ended",
  "data": {
    "groupId": "group_id",
    "selectedMovie": {
      "id": "movie_id",
      "title": "Selected Movie"
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### User Left Voting
```json
{
  "event": "user-left-voting",
  "data": {
    "userId": "user_id",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error 