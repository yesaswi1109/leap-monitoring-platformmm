#!/bin/bash

echo "========================================="
echo "LEAP Monitoring Platform - Full Stack"
echo "========================================="
echo ""
echo "Starting all three services..."
echo ""

# Check if MongoDB is running
echo "1. Checking MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "   ⚠️  MongoDB is not running. Starting MongoDB..."
    mongod --dbpath /data/db --logpath /tmp/mongod.log --fork
    sleep 2
else
    echo "   ✅ MongoDB is already running"
fi

echo ""
echo "2. Starting Central Collector (Port 8080)..."
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform/central-collector
gradle bootRun > /tmp/central-collector.log 2>&1 &
COLLECTOR_PID=$!
echo "   Central Collector PID: $COLLECTOR_PID"
sleep 5

echo ""
echo "3. Starting Tracking Client Demo (Port 8081)..."
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform/tracking-client-demo
gradle bootRun > /tmp/tracking-client-demo.log 2>&1 &
TRACKING_PID=$!
echo "   Tracking Client Demo PID: $TRACKING_PID"
sleep 5

echo ""
echo "4. Starting Next.js Dashboard (Port 3000)..."
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform/nextjs-dashboard
npm run dev > /tmp/nextjs-dashboard.log 2>&1 &
NEXTJS_PID=$!
echo "   Next.js Dashboard PID: $NEXTJS_PID"
sleep 5

echo ""
echo "========================================="
echo "✅ All services started!"
echo "========================================="
echo ""
echo "Access the services at:"
echo "  • Central Collector: http://localhost:8080"
echo "  • Tracking Client Demo: http://localhost:8081"
echo "  • Dashboard: http://localhost:3000"
echo ""
echo "Log files:"
echo "  • MongoDB: /tmp/mongod.log"
echo "  • Central Collector: /tmp/central-collector.log"
echo "  • Tracking Client Demo: /tmp/tracking-client-demo.log"
echo "  • Next.js Dashboard: /tmp/nextjs-dashboard.log"
echo ""
echo "To stop all services, run:"
echo "  kill $COLLECTOR_PID $TRACKING_PID $NEXTJS_PID"
echo ""
