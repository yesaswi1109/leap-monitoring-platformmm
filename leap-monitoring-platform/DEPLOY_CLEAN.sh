#!/bin/bash

echo "🚀 CLEAN DEPLOY - Starting..."
echo "================================"

# Go to project directory
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform || exit 1

# Step 1: Clean everything
echo "Step 1: Cleaning old containers and volumes..."
docker-compose down -v 2>/dev/null || true
docker system prune -f >/dev/null 2>&1 || true

# Clean build directories
rm -rf nextjs-dashboard/.next
rm -rf nextjs-dashboard/node_modules
rm -rf nextjs-dashboard/dist

# Create necessary directories
mkdir -p nextjs-dashboard/public
mkdir -p nextjs-dashboard/.next

echo "✅ Cleaned"

# Step 2: Build
echo ""
echo "Step 2: Building containers (this may take 2-3 minutes)..."
docker-compose build --no-cache 2>&1 | tail -20

echo "✅ Build complete"

# Step 3: Start services
echo ""
echo "Step 3: Starting services..."
docker-compose up -d

echo "✅ Services started"

# Step 4: Wait for health
echo ""
echo "Step 4: Waiting for services to become healthy..."
sleep 30

# Step 5: Check status
echo ""
echo "Step 5: Checking service status..."
docker-compose ps

echo ""
echo "================================"
echo "✅ DEPLOYMENT COMPLETE"
echo ""
echo "Dashboard URL: http://localhost:3000"
echo "Username: dev-yesaswi-123"
echo "Password: password"
echo ""
echo "API: http://localhost:8080/api/v1"
echo ""
echo "Check logs if there are issues:"
echo "  docker-compose logs nextjs-dashboard"
echo "  docker-compose logs central-collector"
echo "  docker-compose logs mongodb"
echo ""
