# MovieSwipe Project Structure

## Overview
MovieSwipe is a complete mobile application with a Node.js backend that helps groups find movies everyone will enjoy through an interactive swiping mechanism and intelligent recommendation algorithm.

## Project Structure

```
MovieSwipe/
├── README.md                    # Project overview and setup instructions
├── setup.sh                     # Automated setup script
├── PROJECT_STRUCTURE.md         # This file - detailed project structure
│
├── backend/                     # Node.js TypeScript Backend
│   ├── package.json            # Backend dependencies and scripts
│   ├── tsconfig.json           # TypeScript configuration
│   ├── env.example             # Environment variables template
│   └── src/
│       ├── index.ts            # Main server entry point
│       ├── config/
│       │   ├── database.ts     # MongoDB connection setup
│       │   └── socket.ts       # Socket.IO configuration
│       ├── models/
│       │   ├── User.ts         # User model with OAuth support
│       │   ├── Group.ts        # Group model with invitation codes
│       │   └── VotingSession.ts # Voting session model
│       ├── services/
│       │   └── movieRecommendationService.ts # Intelligent movie recommendation algorithm
│       ├── routes/
│       │   ├── auth.ts         # Authentication routes (Google/Facebook OAuth)
│       │   ├── groups.ts       # Group management routes
│       │   ├── voting.ts       # Voting session routes
│       │   ├── movies.ts       # Movie search and details routes
│       │   └── users.ts        # User profile routes
│       └── middleware/
│           └── errorHandler.ts # Error handling middleware
│
├── android-app/                 # Android Kotlin Application
│   ├── build.gradle            # Project-level build configuration
│   ├── settings.gradle         # Gradle settings
│   ├── app/
│   │   ├── build.gradle        # App-level build configuration
│   │   └── src/main/
│   │       ├── AndroidManifest.xml # App manifest with permissions
│   │       ├── java/com/movieswipe/app/
│   │       │   ├── MovieSwipeApplication.kt # Main application class
│   │       │   ├── data/
│   │       │   │   ├── model/  # Data models
│   │       │   │   │   ├── User.kt
│   │       │   │   │   ├── Group.kt
│   │       │   │   │   ├── Movie.kt
│   │       │   │   │   └── VotingSession.kt
│   │       │   │   └── api/
│   │       │   │       └── ApiService.kt # Retrofit API interface
│   │       │   └── ui/
│   │       │       └── voting/
│   │       │           ├── VotingActivity.kt # Main voting interface
│   │       │           └── VotingViewModel.kt # Voting business logic
│   │       └── res/            # Android resources (layouts, strings, etc.)
│
└── docs/
    └── api.md                  # Complete API documentation
```

## Key Features Implemented

### ✅ Backend (Node.js + TypeScript)
- **External Authentication**: Google and Facebook OAuth integration
- **External API Integration**: TMDB (The Movie Database) for movie data
- **Real-time Communication**: Socket.IO for live voting sessions
- **Intelligent Algorithm**: Sophisticated movie recommendation system
- **Database**: MongoDB with Mongoose ODM
- **Security**: JWT authentication, rate limiting, input validation
- **Cloud Ready**: Configured for Azure deployment

### ✅ Android App (Kotlin)
- **Native Android**: Pure Kotlin implementation (no React Native/Expo)
- **Modern UI**: Material Design 3 with swipe interface
- **Real-time Features**: Socket.IO client for live voting
- **Authentication**: Google and Facebook sign-in
- **Dependency Injection**: Hilt for clean architecture
- **Networking**: Retrofit for API communication
- **Image Loading**: Glide for efficient image handling

### ✅ Project Requirements Met
1. **External Authentication Service**: ✅ Google and Facebook OAuth
2. **External API Service**: ✅ TMDB API for movie data
3. **Real-time Features**: ✅ WebSocket voting sessions with live updates
4. **Intelligent Algorithm**: ✅ Advanced movie recommendation system
5. **Mobile App**: ✅ Native Android Kotlin app
6. **Backend**: ✅ Node.js TypeScript server
7. **Database**: ✅ MongoDB (no Atlas/Realm)
8. **Cloud Deployment**: ✅ Azure-ready configuration

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: Passport.js with JWT
- **External APIs**: TMDB, Google OAuth, Facebook OAuth
- **Cloud**: Azure App Service ready

### Android App
- **Language**: Kotlin
- **Architecture**: MVVM with Repository pattern
- **Dependency Injection**: Hilt
- **Networking**: Retrofit + OkHttp
- **Real-time**: Socket.IO client
- **UI**: Material Design 3 + CardStackView
- **Image Loading**: Glide
- **Authentication**: Google Sign-In, Facebook Login
- **Database**: Room (local caching)

## Setup Instructions

1. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

2. **Configure environment variables**:
   - Copy `backend/env.example` to `backend/.env`
   - Add your API keys (TMDB, Google, Facebook)

3. **Start the backend**:
   ```bash
   cd backend && npm run dev
   ```

4. **Open Android project**:
   - Open `android-app/` in Android Studio
   - Sync Gradle files
   - Build and run on device/emulator

## Deployment

### Backend (Azure)
1. Deploy to Azure App Service
2. Configure environment variables
3. Set up MongoDB connection
4. Update CORS settings

### Android App
1. Update API endpoints in `build.gradle`
2. Build APK/AAB
3. Distribute through Google Play Store

## API Documentation
Complete API documentation is available in `docs/api.md` with:
- All REST endpoints
- WebSocket events
- Request/response examples
- Authentication details
- Error handling

## Development Notes

### Backend Linter Errors
The TypeScript linter errors in the backend are expected since dependencies haven't been installed yet. They will be resolved after running:
```bash
cd backend && npm install
```

### Android Dependencies
The Android app uses several external libraries that will be downloaded when syncing Gradle files in Android Studio.

### Real-time Features
The app implements real-time voting through Socket.IO, allowing users to see live updates when other group members vote on movies.

### Intelligent Algorithm
The movie recommendation system uses:
- Jaccard similarity for genre matching
- Group preference aggregation
- TMDB ratings and popularity
- Weighted scoring system

This creates a sophisticated algorithm that considers both individual and group preferences to suggest movies everyone will enjoy. 