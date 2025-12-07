#!/bin/bash

# LEAP Monitoring Platform - Simplified One-Command Setup
# Runs: MongoDB + Mock API + Next.js Frontend (All in Docker)

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   🚀 LEAP Monitoring Platform - Simple Setup                  ║"
echo "║   MongoDB + API + Frontend Running Together                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check Docker
echo "Step 1️⃣  Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker."
    exit 1
fi
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi
echo "✅ Docker is installed"
echo ""

# Step 2: Clean up old containers
echo "Step 2️⃣  Cleaning up old containers..."
docker-compose -f docker-compose-simple.yml down -v 2>/dev/null || true
echo "✅ Old containers removed"
echo ""

# Step 3: Start services
echo "Step 3️⃣  Building and starting services..."
echo "   This will take 1-2 minutes on first run..."
echo ""

docker-compose -f docker-compose-simple.yml up -d --build

echo ""
echo "Step 4️⃣  Waiting for services to be healthy..."
echo ""

# Wait for MongoDB
echo "⏳ Waiting for MongoDB..."
timeout 60 bash -c 'until docker exec leap_mongo mongosh --eval "db.adminCommand(\"ping\")" > /dev/null 2>&1; do sleep 1; done'
echo "✅ MongoDB is healthy"

# Wait for API
echo "⏳ Waiting for API Server..."
timeout 60 bash -c 'until curl -f http://localhost:8080/api/v1/health > /dev/null 2>&1; do sleep 1; done'
echo "✅ API Server is healthy"

# Wait for Frontend
echo "⏳ Waiting for Frontend..."
timeout 60 bash -c 'until curl -f http://localhost:3000 > /dev/null 2>&1; do sleep 1; done'
echo "✅ Frontend is healthy"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ ALL SYSTEMS RUNNING!                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Dashboard URL:     http://localhost:3000"
echo "📍 API URL:           http://localhost:8080/api/v1"
echo "📍 Database:          mongodb://localhost:27017"
echo ""
echo "🔐 Login Credentials:"
echo "   Email:    demo@leapmonitoring.com"
echo "   Password: demo123"
echo ""
echo "📊 Dashboard Features:"
echo "   ✓ Login & Authentication"
echo "   ✓ Real-time Metrics"
echo "   ✓ Log Explorer"
echo "   ✓ Alert Management"
echo "   ✓ Incident Resolution"
echo ""
echo "🎯 Next Steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Login with credentials above"
echo "   3. Explore the dashboard"
echo ""
echo "📝 Useful Commands:"
echo "   View logs:        docker-compose -f docker-compose-simple.yml logs -f"
echo "   Stop services:    docker-compose -f docker-compose-simple.yml down"
echo "   Restart services: docker-compose -f docker-compose-simple.yml restart"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
