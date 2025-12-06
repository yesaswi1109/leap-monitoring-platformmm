# LEAP Monitoring Platform - Complete Setup & Launch Guide

## System Components

This is a three-part monitoring system:

1. **Central Collector** (Port 8080) - Spring Boot Kotlin service that collects API metrics and incidents
2. **Tracking Client Demo** (Port 8081) - Spring Boot Kotlin service that simulates API calls with rate limiting
3. **Next.js Dashboard** (Port 3000) - React frontend to visualize metrics and incidents

## Prerequisites

- Java 21
- Node.js 16+
- MongoDB 4.4+
- Gradle 9.2+
- npm 8+

## Quick Start (All Three Services)

### Option 1: Start All Services Together (Recommended)

```bash
# Make the script executable
chmod +x /workspaces/leap-monitoring-platform/start-all.sh

# Run all services
bash /workspaces/leap-monitoring-platform/start-all.sh
```

### Option 2: Start Services Individually

#### 1. Start MongoDB (if not running)
```bash
mongod --dbpath /data/db &
```

#### 2. Start Central Collector
```bash
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform/central-collector
gradle bootRun
```
- Listens on: **http://localhost:8080**
- Databases: logs_db, metadata_db

#### 3. Start Tracking Client Demo
```bash
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform/tracking-client-demo
gradle bootRun
```
- Listens on: **http://localhost:8081**
- Available endpoints:
  - `/orders/create` - Normal request
  - `/orders/slow-status` - Slow request (>500ms)
  - `/orders/internal-error` - Server error simulation

#### 4. Start Next.js Dashboard
```bash
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform/nextjs-dashboard
npm install  # First time only
npm run dev
```
- Listens on: **http://localhost:3000**
- Displays real-time metrics and incidents

## API Endpoints

### Central Collector (Port 8080)
- `POST /api/v1/logs` - Submit log entry
- `GET /api/v1/logs` - Get all logs
- `POST /api/v1/incidents` - Submit incident
- `GET /api/v1/incidents` - Get all incidents

### Tracking Client Demo (Port 8081)
- `GET /orders/create` - Create normal order
- `GET /orders/slow-status` - Get slow order status
- `GET /orders/internal-error` - Trigger error

### Dashboard (Port 3000)
- `/` - Main dashboard with metrics and incidents

## Configuration

### Central Collector (`application.yml`)
- Primary Database: `logs_db` (for API logs)
- Secondary Database: `metadata_db` (for incidents)
- Latency Threshold: 500ms
- Error Status Min: 500

### Tracking Client Demo (`application.yml`)
- Service Name: ORDERS-SERVICE
- Collector URL: http://localhost:8080/api/v1/logs
- Rate Limit: 100 req/s (default)

### Dashboard
- API Base URL: http://localhost:8080/api/v1
- Auto-refresh: Every 10 seconds

## Troubleshooting

### MongoDB Connection Failed
```bash
# Verify MongoDB is running
ps aux | grep mongod

# Start MongoDB if needed
mongod --dbpath /data/db --fork --logpath /tmp/mongod.log
```

### Port Already in Use
```bash
# Find process using port
lsof -i :8080  # Central Collector
lsof -i :8081  # Tracking Client Demo
lsof -i :3000  # Dashboard

# Kill process
kill -9 <PID>
```

### Build Errors
```bash
# Clean gradle cache
gradle clean

# Rebuild
gradle build
```

### npm Dependencies Issues
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Testing the System

1. **Open Dashboard**
   - Navigate to http://localhost:3000

2. **Generate Test Data**
   ```bash
   # Normal request
   curl http://localhost:8081/orders/create

   # Slow request (triggers SLOW alert)
   curl http://localhost:8081/orders/slow-status

   # Error request (triggers ERROR alert)
   curl http://localhost:8081/orders/internal-error
   ```

3. **Monitor Dashboard**
   - Refresh the dashboard at http://localhost:3000
   - You should see metrics update in real-time

## Files Structure

```
leap-monitoring-platform/
├── central-collector/           # Main collector service
│   ├── build.gradle.kts
│   └── src/main/
│       ├── kotlin/com/leap/collector/
│       │   ├── config/MongoConfig.kt
│       │   ├── data/LogAndIncidentRepositories.kt
│       │   ├── repo/LogAndIncidentRepositories.kt
│       │   ├── service/CollectorService.kt
│       │   └── api/CollectorController.kt
│       └── resources/application.yml
│
├── tracking-client-demo/        # Demo client service
│   ├── build.gradle.kts
│   └── src/main/
│       ├── kotlin/com/leap/monitoring/
│       │   ├── TrackingClientDemoApplication.kt
│       │   └── client/RateLimiterRegistry.kt
│       └── resources/application.yml
│
├── nextjs-dashboard/            # React frontend
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── src/app/
│       ├── page.jsx
│       ├── layout.jsx
│       └── globals.css
│
└── start-all.sh                 # Startup script

```

## Fixed Issues

✅ Central Collector:
- Fixed duplicate LogsMongoConfig class
- Fixed repository configuration

✅ Tracking Client Demo:
- Fixed build.gradle.kts location
- Added bucket4j dependency for rate limiting
- Fixed spring-boot-devtools version

✅ Next.js Dashboard:
- Created package.json with all dependencies
- Added "use client" directive for React hooks
- Created all required config files (tsconfig, eslintrc, etc.)
- Created PostCSS and Tailwind configuration
- Created layout.jsx and globals.css

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review log files in `/tmp/`
3. Verify all services are running on correct ports
4. Ensure MongoDB is accessible
