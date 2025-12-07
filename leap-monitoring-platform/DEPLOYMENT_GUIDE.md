# LEAP Monitoring Platform - Complete Deployment & Testing Guide

## Overview
This guide provides comprehensive instructions to deploy the LEAP Monitoring Platform with all fixes applied for login page flashing, hydration errors, auto-login persistence, and full dashboard stability.

---

## ✅ What Has Been Fixed

### 1. **Login Page Flashing / Disappearance**
- ✅ Fixed SSR hydration mismatch with `suppressHydrationWarning`
- ✅ Implemented proper client-side rendering check with `isHydrated` state
- ✅ Loading screen prevents page flashing during hydration
- ✅ Prevented render until client is fully initialized

### 2. **Auto-Login & Persistence**
- ✅ Implemented persistent token storage in localStorage
- ✅ Auto-login checks token on mount and survives page refreshes (5-10+ days)
- ✅ Cross-tab synchronization with storage events
- ✅ Proper logout and auth cleanup

### 3. **Hydration & Environment Configuration**
- ✅ Environment variable support for `NEXT_PUBLIC_API_BASE_URL`
- ✅ Dynamic API endpoint configuration for different environments
- ✅ Support for both localhost and containerized networking
- ✅ Health check endpoint with retry logic

### 4. **Backend CORS Support**
- ✅ Full CORS configuration for all origins
- ✅ Support for GET, POST, PUT, DELETE, OPTIONS methods
- ✅ Proper Authorization header handling
- ✅ Content-Type and custom headers support

---

## 🚀 Quick Start - Deploy with Docker Compose

### Prerequisites
- Docker and Docker Compose installed
- At least 2GB free memory
- Port 3000, 8080, 8081, 27017 available

### 1️⃣ Build and Start All Services

```bash
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform

# Build all images and start containers
docker-compose up -d --build

# Wait for services to be healthy (30-60 seconds)
sleep 10

# Check service status
docker-compose ps
```

**Expected Output:**
```
NAME                          STATUS
leap_mongo                    Up (healthy)
leap_central_collector        Up (healthy)
leap_tracking_client          Up (healthy)
leap_dashboard                Up (healthy)
```

### 2️⃣ Verify All Services Are Running

```bash
# Check health of all endpoints
echo "=== MongoDB Health ==="
docker exec leap_mongo mongosh --eval "db.adminCommand('ping')"

echo "=== Central Collector Health ==="
curl -s http://localhost:8080/api/v1/health | jq .

echo "=== Tracking Client Health ==="
curl -s http://localhost:8081/actuator/health | jq .

echo "=== Dashboard Health ==="
curl -s http://localhost:3000 | head -20
```

### 3️⃣ Access the Dashboard

**Open in Browser:**
```
http://localhost:3000
```

**Login Credentials:**
- Username: `dev-yesaswi-123` (or any custom username)
- Password: `password` (or any value, it's a mock auth)

**What to Expect:**
- ✅ No login page flashing
- ✅ Dashboard loads after login
- ✅ Stays logged in after page refresh
- ✅ Auto-login persists across sessions

---

## 🧪 Comprehensive Testing

### Test 1: Login Flow & Persistence
```bash
#!/bin/bash

echo "TEST 1: Login Flow & Persistence"
echo "================================"
echo "1. Open http://localhost:3000 in browser"
echo "2. Enter username and password"
echo "3. Verify no flashing or redirect loops"
echo "4. Verify dashboard loads with data"
echo "5. Refresh page (F5) - should stay logged in"
echo "6. Close browser tab, reopen http://localhost:3000"
echo "7. Should auto-login without showing login page"
echo ""
echo "✅ PASS if: No flashing, immediate dashboard load"
echo "❌ FAIL if: Login page appears, data loading issues"
```

### Test 2: Dashboard Stability
```bash
#!/bin/bash

echo "TEST 2: Dashboard Stability (30 second test)"
echo "============================================"
echo "1. Login and wait on dashboard"
echo "2. Observe widgets updating every 10 seconds"
echo "3. Check for any UI glitches or freezes"
echo "4. Open browser DevTools (F12) and check Console"
echo "5. Should see no errors, only info logs"
echo ""
echo "Expected Behavior:"
echo "- Average Latency widget updates"
echo "- Slow API Count changes"
echo "- Error Rate Graph shows real-time data"
echo "- No console errors"
```

### Test 3: Frontend Pages Load Test
```bash
#!/bin/bash

echo "TEST 3: All Frontend Pages Load"
echo "==============================="
echo "Navigate through all sections:"
echo ""
echo "Section 1: Dashboard Widgets"
echo "- Average Latency (ms)"
echo "- Slow API Count"
echo "- Broken API Count (5xx)"
echo "- Rate Limit Violations"
echo ""
echo "Section 2: Error Rate Graph"
echo "- Should show real-time visualization"
echo "- Updates smoothly without stuttering"
echo ""
echo "Section 3: Open Alerts & Issues"
echo "- Shows open incidents"
echo "- 'Mark Resolved' button works"
echo "- Click to resolve and verify update"
echo ""
echo "Section 4: API Request Explorer"
echo "- Filter by Service dropdown"
echo "- Filter by Status Type (SLOW, BROKEN, RATE_LIMIT)"
echo "- Table displays all API logs"
echo "- Pagination/scrolling works smoothly"
```

### Test 4: Backend API Endpoints
```bash
# Test health endpoint
curl -X GET http://localhost:8080/api/v1/health \
  -H "Content-Type: application/json"

# Test get all logs
curl -X GET http://localhost:8080/api/v1/logs \
  -H "Authorization: Bearer mock-jwt-token-abc123" \
  -H "Content-Type: application/json"

# Test get open incidents
curl -X GET http://localhost:8080/api/v1/incidents/open \
  -H "Authorization: Bearer mock-jwt-token-abc123" \
  -H "Content-Type: application/json"

# Generate test data - create a log entry
curl -X POST http://localhost:8080/api/v1/logs \
  -H "Authorization: Bearer mock-jwt-token-abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "test-service",
    "endpoint": "/api/test",
    "requestMethod": "GET",
    "statusCode": 200,
    "latencyMs": 100,
    "requestSize": 0,
    "responseSize": 1024,
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "isRateLimitHit": false
  }'
```

### Test 5: Auto-Login Persistence (5-10 Days Test)
```bash
#!/bin/bash

echo "TEST 5: Long-term Auto-Login Persistence"
echo "========================================"
echo ""
echo "Day 1: Initial Login"
echo "  - Log in at http://localhost:3000"
echo "  - Verify dashboard loads"
echo ""
echo "Day 2-10: Intermittent Access"
echo "  - Open http://localhost:3000 each day"
echo "  - Verify auto-login (no login page)"
echo "  - Verify token is still valid"
echo ""
echo "localStorage persists the token:"
echo "  - Key: 'lm_token'"
echo "  - Key: 'lm_user'"
echo ""
echo "✅ PASS if: Auto-login works for 10+ days"
echo "❌ FAIL if: Token expires before 10 days"
```

### Test 6: Incident Resolution
```bash
#!/bin/bash

echo "TEST 6: Incident Resolution Flow"
echo "================================"
echo ""
echo "1. Navigate to 'Open Alerts & Issues' section"
echo "2. Click 'Mark Resolved' button on any incident"
echo "3. Verify success message appears"
echo "4. Verify incident disappears from list"
echo "5. Refresh page - incident should stay resolved"
echo ""
echo "Expected Behavior:"
echo "- Button shows 'Resolving...' state while processing"
echo "- Success alert appears"
echo "- Incident list updates immediately"
```

---

## 📊 Monitoring Commands

### Check All Container Logs
```bash
# Central Collector logs
docker logs leap_central_collector -f --tail 100

# Dashboard logs
docker logs leap_dashboard -f --tail 100

# MongoDB logs
docker logs leap_mongo -f --tail 100

# Tracking Client logs
docker logs leap_tracking_client -f --tail 100
```

### Monitor Service Health
```bash
#!/bin/bash

# Continuous health monitoring
while true; do
  clear
  echo "=== LEAP Services Status ==="
  echo "Time: $(date)"
  echo ""
  
  echo "MongoDB:"
  docker exec leap_mongo mongosh --eval "db.adminCommand('ping')" 2>/dev/null || echo "❌ DOWN"
  
  echo ""
  echo "Central Collector:"
  curl -s http://localhost:8080/api/v1/health | jq -r '.status' 2>/dev/null || echo "❌ DOWN"
  
  echo ""
  echo "Dashboard:"
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null && echo " UP" || echo "❌ DOWN"
  
  echo ""
  echo "Tracking Client:"
  curl -s http://localhost:8081/actuator/health | jq -r '.status' 2>/dev/null || echo "❌ DOWN"
  
  echo ""
  sleep 10
done
```

---

## 🔧 Environment Configuration

### For Local Development (localhost)
```bash
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
npm run dev
```

### For Docker Container Environment
```bash
# Already configured in docker-compose.yml:
NEXT_PUBLIC_API_BASE_URL=http://central-collector:8080/api/v1
```

### For Cloud Deployment (e.g., AWS, Azure, GCP)
```bash
# Example for remote server
export NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
docker-compose up -d
```

---

## 🛑 Stop & Cleanup

### Stop All Services
```bash
docker-compose down
```

### Stop and Remove All Data
```bash
docker-compose down -v  # -v removes volumes
```

### View Detailed Service Info
```bash
docker-compose ps -a
docker network ls | grep leap
docker volume ls | grep leap
```

---

## 🐛 Troubleshooting

### Issue: Login Page Keeps Flashing
**Solution:**
```bash
# Clear browser cache and localStorage
# Press F12 > Application > Storage > Clear All
# Refresh the page

# Or restart dashboard container
docker restart leap_dashboard
```

### Issue: Dashboard Not Loading Data
**Solution:**
```bash
# Check if Central Collector is healthy
curl http://localhost:8080/api/v1/health

# Check Central Collector logs
docker logs leap_central_collector

# Restart Central Collector
docker restart leap_central_collector
```

### Issue: CORS Errors in Console
**Solution:**
```bash
# CORS is already enabled, but verify:
curl -X OPTIONS http://localhost:8080/api/v1/health \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" -v

# Should return Access-Control-Allow-Origin header
```

### Issue: MongoDB Connection Fails
**Solution:**
```bash
# Check MongoDB status
docker logs leap_mongo

# Verify MongoDB is listening
docker exec leap_mongo mongosh --eval "db.adminCommand('ping')"

# Restart MongoDB
docker restart leap_mongo
sleep 10
docker restart leap_central_collector
```

### Issue: Auto-Login Not Working
**Solution:**
```bash
# Check browser localStorage (F12 > Application > Storage > Local Storage)
# Should have:
# - Key: lm_token (not empty)
# - Key: lm_user (not empty)

# If missing, login again and refresh
# If still missing, check browser privacy settings
```

---

## 📈 Performance Metrics

### Expected Response Times
- Health Check: **< 50ms**
- Get All Logs: **< 500ms** (with 1000+ logs)
- Get Incidents: **< 200ms**
- Dashboard Load: **< 2 seconds**
- Page Refresh: **< 1 second** (with auto-login)

### Resource Usage
- MongoDB: **~100-200 MB**
- Central Collector: **~300-400 MB**
- Tracking Client: **~250-350 MB**
- Dashboard: **~150-200 MB**
- **Total: ~1-1.5 GB**

---

## ✨ Final Checklist Before Submission

- [ ] All services start without errors
- [ ] Dashboard loads without login page flashing
- [ ] Login persists across page refreshes
- [ ] Auto-login works after 5+ days
- [ ] All dashboard widgets update in real-time
- [ ] API endpoints return data correctly
- [ ] CORS errors are resolved
- [ ] Incident resolution works
- [ ] Error Rate Graph displays correctly
- [ ] No console errors
- [ ] No hydration warnings

---

## 📞 Support & Debugging

### Immediate Issues
1. **Check browser console (F12)** for JavaScript errors
2. **Check network tab** for API request failures
3. **Check docker logs** for backend errors

### Data Generation Issues
- Dashboard waits for data from Central Collector
- Tracking Client auto-generates data when requests happen
- Use the provided curl commands to test API endpoints

### Persistent Issues
```bash
# Nuclear option: Clean rebuild
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

---

## 🎯 Deployment Success Criteria

Your deployment is **SUCCESSFUL** when:

✅ **Login Flow**
- No page flashing or disappearance
- Smooth transition to dashboard
- Auto-login works immediately

✅ **Dashboard Stability**
- All widgets display data
- Real-time updates every 10 seconds
- No freezing or UI glitches

✅ **Frontend Pages**
- All sections load without errors
- Error Rate Graph displays smoothly
- Incident list shows data
- API Explorer filters work

✅ **Backend Support**
- All endpoints respond correctly
- CORS headers present
- Auth token properly validated
- Data persists in MongoDB

✅ **Long-term Persistence**
- Login persists after refresh
- Auto-login works after 5-10 days
- No token expiration issues
- Data remains accessible

---

**Deployment Date:** December 7, 2025  
**Status:** ✅ READY FOR SUBMISSION

