#!/bin/bash

echo "🚀 Preparing Pokytalk for AWS Amplify deployment..."

# Create deployment package
echo "📦 Creating deployment package..."

# Build shared package
echo "🔨 Building shared package..."
cd shared
npm install
npm run build
cd ..

# Build backend
echo "🔨 Building backend..."
cd backend
npm install
npm run build
cd ..

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Build complete! Ready for Amplify deployment."
echo ""
echo "📋 Next steps for AWS Amplify:"
echo "1. Push code to GitHub repository"
echo "2. Connect repository to AWS Amplify"
echo "3. Set environment variables in Amplify console"
echo "4. Deploy!"
