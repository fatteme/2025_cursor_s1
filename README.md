# MovieSwipe

A mobile application that helps groups of friends, families, or coworkers find movies everyone will enjoy through an interactive swiping mechanism and intelligent recommendation algorithm.

## Project Structure

```
MovieSwipe/
├── android-app/          # Android client (Kotlin)
├── backend/             # Node.js server (TypeScript)
├── docs/               # Documentation
└── README.md
```

## Features

- **Group Management**: Create groups and invite friends with invitation codes
- **Preference Setup**: Specify movie genre preferences
- **Interactive Voting**: Swipe right/left to vote on movie suggestions
- **Intelligent Matching**: Advanced algorithm that considers group preferences
- **Real-time Updates**: Live voting sessions with WebSocket communication
- **External Integration**: TMDB API for movie data, Google/Facebook authentication

## Technology Stack

### Client (Android)
- **Language**: Kotlin
- **Framework**: Android Native
- **Authentication**: Google/Facebook OAuth
- **Real-time**: WebSocket for live voting
- **UI**: Material Design 3

### Backend (Node.js)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT with OAuth integration
- **Real-time**: Socket.io
- **Cloud**: Azure deployment
- **External APIs**: TMDB (The Movie Database)

## Setup Instructions

### Prerequisites
- Android Studio
- Node.js (v18+)
- MongoDB
- Azure account (for deployment)

### Backend Setup
1. Navigate to `backend/`
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start development server: `npm run dev`

### Android App Setup
1. Open `android-app/` in Android Studio
2. Sync Gradle files
3. Configure API endpoints in `Constants.kt`
4. Build and run on device/emulator

## API Documentation

See `docs/api.md` for detailed API documentation.

## Deployment

### Backend (Azure)
- Deploy to Azure App Service
- Configure environment variables
- Set up MongoDB connection

### Android App
- Build APK/AAB
- Distribute through Google Play Store or direct installation

## License

MIT License 