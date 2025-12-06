# LEAP Monitoring Platform - Docker Compose Setup

## Overview
This Docker Compose setup runs the complete LEAP monitoring platform stack with:
- **MongoDB** (database)
- **Central Collector** (port 8080) - Spring Boot service
- **Tracking Client Demo** (port 8081) - Spring Boot service  
- **Next.js Dashboard** (port 3000) - React frontend with login

## Prerequisites
- Docker Desktop or Docker Engine
- Docker Compose
- At least 4GB RAM available

## Quick Start

### 1. Build and Start the Stack
```bash
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform

# Build and start all services in detached mode
docker-compose up -d --build

# Or, to see real-time logs while starting
docker-compose up --build
```

### 2. Verify All Services Are Running
```bash
docker-compose ps

# Expected output:
# NAME                           IMAGE              STATUS
# leap_mongo                      mongo:7.0          Up (healthy)
# leap_central_collector         leap-...           Up (healthy)
# leap_tracking_client           leap-...           Up (healthy)
# leap_dashboard                 leap-...           Up (healthy)
```

### 3. Check Logs
```bash
# View logs for specific service
docker-compose logs central-collector
docker-compose logs tracking-client-demo
docker-compose logs nextjs-dashboard
docker-compose logs mongo

# Follow logs in real-time
docker-compose logs -f central-collector
```

### 4. Access the Services

#### **Dashboard (Login Page First)**
```
http://localhost:3000
```
- Username: `dev-yesaswi-123` (default shown)
- Password: `password` (any value)
- After login: see full dashboard with widgets, logs, incidents, error graph

#### **Central Collector API**
```
Health:              http://localhost:8080/api/v1/health
Logs:                http://localhost:8080/api/v1/logs
Open Incidents:      http://localhost:8080/api/v1/incidents/open
Resolve Incident:    POST http://localhost:8080/api/v1/incidents/{id}/resolve
```

#### **Tracking Client Demo (Order Simulator)**
```
Create Order:        http://localhost:8081/orders/create
Slow Status:         http://localhost:8081/orders/slow-status
Internal Error:      http://localhost:8081/orders/internal-error
Health:              http://localhost:8081/actuator/health
```

#### **MongoDB**
```
Host: localhost
Port: 27017
Database: logs_db
```

## Verification Commands

### Test Health Endpoints
```bash
# Collector health
curl http://localhost:8080/api/v1/health

# Tracking client health
curl http://localhost:8081/actuator/health

# Dashboard (returns HTML)
curl http://localhost:3000
```

### Generate Sample Data
```bash
# Create sample orders (generates logs in collector)
curl http://localhost:8081/orders/create
curl http://localhost:8081/orders/create
curl http://localhost:8081/orders/slow-status

# Fetch stored logs from collector
curl http://localhost:8080/api/v1/logs | jq '.'

# View open incidents
curl http://localhost:8080/api/v1/incidents/open | jq '.'
```

## Stopping the Stack

### Stop all services (keep volumes)
```bash
docker-compose stop
```

### Stop and remove all containers (keep volumes)
```bash
docker-compose down
```

### Stop and remove everything including volumes
```bash
docker-compose down -v
```

## Rebuild Services (if code changes)
```bash
# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose build central-collector --no-cache
docker-compose up -d central-collector
```

## Troubleshooting

### Services not starting
```bash
# Check detailed logs
docker-compose logs [service-name]

# Verify service health
docker-compose ps

# Inspect network
docker network inspect leap-monitoring-network
```

### Port already in use
```bash
# Free up port 3000
lsof -i :3000
kill -9 <PID>

# Or change docker-compose port mappings:
# Change ports in docker-compose.yml:
# - "3001:3000" (host:container)
```

### MongoDB connection issues
```bash
# Verify Mongo is running
docker exec leap_mongo mongosh --eval "db.adminCommand('ping')"

# Check Mongo logs
docker-compose logs mongo
```

### Gradle build errors in container
```bash
# Clear gradle cache and rebuild
docker-compose down -v
docker-compose up -d --build --remove-orphans
```

## Environment Configuration

All environment variables are set in `docker-compose.yml`. Common ones:
- `SPRING_DATA_MONGODB_URI`: MongoDB connection string
- `NEXT_TELEMETRY_DISABLED`: Disable Next.js telemetry
- `PORT`: Next.js port (3000)
- `JAVA_OPTS`: JVM memory settings

## Dashboard Features

After logging in at http://localhost:3000, you'll see:

1. **Dashboard Analytics**
   - Average Latency (ms)
   - Slow API Count (> 500ms)
   - Broken API Count (5xx errors)
   - Rate-limit Violations

2. **Top 5 Slow Endpoints**
   - List of slowest endpoints with average latency

3. **Error Rate Graph**
   - Real-time visualization of error percentage by time bucket

4. **Open Alerts & Issues**
   - List of incidents with "Mark Resolved" button
   - Shows severity, endpoint, and timestamp

5. **API Request Explorer**
   - Filterable table of all API logs
   - Filter by service name and status type (SLOW, BROKEN, RATE_LIMIT)

## API Endpoints Reference

### Collector API (8080)
```
GET    /api/v1/health                 - Health check
GET    /api/v1/logs                    - Get all logs
POST   /api/v1/logs                    - Create new log entry
GET    /api/v1/incidents               - Get all incidents
GET    /api/v1/incidents/open          - Get open incidents
POST   /api/v1/incidents/{id}/resolve  - Mark incident resolved
```

### Tracking Client (8081)
```
GET    /orders/create        - Create order (simulates normal request)
GET    /orders/slow-status   - Create slow order (latency > 500ms)
GET    /orders/internal-error - Create error (500 status code)
GET    /actuator/health      - Health check
```

## Performance Tips

1. **Increase Memory**
   - Edit `JAVA_OPTS` in docker-compose.yml if services slow
   - Default: collector: 256m-1024m, client: 128m-512m

2. **Use Prod Build**
   - Current: dev mode with hot-reload
   - For production: Remove `--build` flag after initial build

3. **Monitor Logs**
   - Use `docker-compose logs -f` to monitor in real-time
   - Check for any warnings or errors

## Next Steps

1. **View the Dashboard**
   - Open http://localhost:3000
   - Login with any username
   - Generate sample data by hitting tracking client endpoints

2. **Integrate Your APIs**
   - Send logs from your services to: `http://localhost:8080/api/v1/logs`
   - Follow the LogEntry schema in collector service

3. **Customize Thresholds**
   - Edit `alerting.latency-threshold-ms` in collector's `application.yml`
   - Edit `alerting.error-status-min` for error threshold

## Support

For issues or questions:
- Check logs: `docker-compose logs [service]`
- Verify connectivity: `curl http://localhost:[port]/health`
- Restart stack: `docker-compose restart`
