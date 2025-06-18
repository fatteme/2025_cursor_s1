#!/bin/bash

echo "🎬 Setting up MovieSwipe project..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..

# Check if Android Studio and Android SDK are available
if ! command -v adb &> /dev/null; then
    echo "⚠️  Android SDK not found in PATH. Please make sure Android Studio is installed and ANDROID_HOME is set."
    echo "   You can still build the backend, but Android app development will require Android Studio setup."
else
    echo "✅ Android SDK found"
fi

# Create environment file for backend
echo "🔧 Creating backend environment file..."
if [ ! -f backend/.env ]; then
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env file"
    echo "⚠️  Please update backend/.env with your actual API keys and configuration"
else
    echo "✅ Backend environment file already exists"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your API keys:"
echo "   - TMDB_API_KEY (get from https://www.themoviedb.org/settings/api)"
echo "   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
echo "   - FACEBOOK_APP_ID and FACEBOOK_APP_SECRET"
echo "   - JWT_SECRET (generate a secure random string)"
echo ""
echo "2. Start the backend server:"
echo "   cd backend && npm run dev"
echo ""
echo "3. For Android development:"
echo "   - Open android-app/ in Android Studio"
echo "   - Sync Gradle files"
echo "   - Build and run on device/emulator"
echo ""
echo "4. For production deployment:"
echo "   - Deploy backend to Azure App Service"
echo "   - Update API endpoints in android-app/app/build.gradle"
echo "   - Build and distribute Android APK/AAB"
echo ""
echo "📚 Documentation:"
echo "   - API docs: docs/api.md"
echo "   - Project overview: README.md" 