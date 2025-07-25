#!/bin/bash

# HEIC to JPEG Converter - Deployment Script
echo "🚀 Starting deployment of HEIC to JPEG Converter..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build the React application
echo "📦 Building React application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ React build failed!"
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start the containers
echo "🔨 Building Docker containers..."
docker-compose build --no-cache

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "🚀 Starting containers..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start containers!"
    exit 1
fi

# Wait a moment for containers to start
echo "⏳ Waiting for services to start..."
sleep 5

# Check if the service is running
if curl -f http://localhost:4545/api/health > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
    echo "🌐 Application is running at: http://localhost:4545"
    echo "📊 Analytics endpoint: http://localhost:4545/api/analytics"
    echo "🏥 Health check: http://localhost:4545/api/health"
else
    echo "⚠️  Deployment completed but health check failed"
    echo "📋 Check logs with: docker-compose logs"
fi

echo "📋 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"