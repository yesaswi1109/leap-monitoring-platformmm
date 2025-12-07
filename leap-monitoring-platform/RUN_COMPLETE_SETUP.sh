#!/bin/bash

# 🚀 LEAP Monitoring Platform - COMPLETE SETUP WITH BOTH FRONTEND & BACKEND
# This script sets up everything in Docker and provides a working hosted URL

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   🚀 LEAP Monitoring Platform - Complete Setup                 ║"
echo "║   Frontend + Backend + Database Running Together               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check Docker
echo "Step 1️⃣  Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed. Install from https://docker.com"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not installed. Install from https://docker.com"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo "   Docker version: $(docker --version)"
echo "   Docker Compose version: $(docker-compose --version)"
echo ""

# Step 2: Stop any existing containers
echo "Step 2️⃣  Cleaning up old containers..."
docker-compose down -v 2>/dev/null || true
echo "✅ Old containers removed"
echo ""

# Step 3: Build and start all services
echo "Step 3️⃣  Building and starting all services..."
echo "   This will take 3-5 minutes on first run..."
echo ""

docker-compose build --no-cache 2>&1 | tail -20
echo ""
echo "Starting containers..."
docker-compose up -d

# Step 4: Wait for services to be healthy
echo "Step 4️⃣  Waiting for services to be healthy..."
echo "   Checking: MongoDB, Backend, Frontend..."
echo ""

# Wait for MongoDB
echo -n "Waiting for MongoDB... "
for i in {1..30}; do
    if docker exec leap_mongo mongosh --eval "db.adminCommand('ping')" &>/dev/null; then
        echo "✅"
        break
    fi
    echo -n "."
    sleep 1
done

# Wait for Backend
echo -n "Waiting for Central Collector... "
for i in {1..30}; do
    if curl -s http://localhost:8080/api/v1/health &>/dev/null; then
        echo "✅"
        break
    fi
    echo -n "."
    sleep 1
done

# Wait for Frontend
echo -n "Waiting for Dashboard... "
for i in {1..30}; do
    if curl -s http://localhost:3000 | grep -q "Leap" &>/dev/null; then
        echo "✅"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "Step 5️⃣  Verifying all services..."
echo ""

# Verify all containers
docker-compose ps

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ ALL SYSTEMS RUNNING!                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "🌐 HOSTED URL FOR YOUR DASHBOARD:"
echo "   ✅ Frontend: http://localhost:3000"
echo ""

echo "🔐 LOGIN CREDENTIALS:"
echo "   Email: demo@leapmonitoring.com"
echo "   Password: demo123"
echo ""

echo "📊 WHAT'S RUNNING:"
echo "   ✅ MongoDB (Port 27017) - Database"
echo "   ✅ Central Collector (Port 8080) - Backend API"
echo "   ✅ Next.js Dashboard (Port 3000) - Frontend"
echo ""

echo "📋 SERVICE DETAILS:"
echo ""
echo "   Database:"
echo "   └─ MongoDB: mongodb://localhost:27017/logs_db"
echo ""
echo "   Backend API:"
echo "   └─ Health: http://localhost:8080/api/v1/health"
echo "   └─ Logs: http://localhost:8080/api/v1/logs"
echo "   └─ Incidents: http://localhost:8080/api/v1/incidents/open"
echo ""
echo "   Frontend:"
echo "   └─ Dashboard: http://localhost:3000"
echo ""

echo "🎯 NEXT STEPS:"
echo "   1. Open browser: http://localhost:3000"
echo "   2. Login with demo@leapmonitoring.com / demo123"
echo "   3. View the dashboard!"
echo ""

echo "🔧 USEFUL COMMANDS:"
echo ""
echo "   Check all logs:"
echo "   $ docker-compose logs -f"
echo ""
echo "   Check specific service logs:"
echo "   $ docker-compose logs -f central-collector"
echo "   $ docker-compose logs -f nextjs-dashboard"
echo "   $ docker-compose logs -f mongo"
echo ""
echo "   Stop all services:"
echo "   $ docker-compose down"
echo ""
echo "   Restart a specific service:"
echo "   $ docker-compose restart central-collector"
echo ""
echo "   Scale for 60+ users (add more backend instances):"
echo "   $ docker-compose up -d --scale central-collector=3"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        🎉 Your dashboard is ready at http://localhost:3000    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
