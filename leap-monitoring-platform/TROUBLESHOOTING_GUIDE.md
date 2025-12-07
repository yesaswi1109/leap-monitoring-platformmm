# Quick Troubleshooting Guide

## If You Ever See Zero Values Again

### Quick Diagnosis Checklist:

1. **Check if endpoints are correct**
   ```bash
   # Should work (v1 endpoints)
   curl -s 'http://localhost:3000/api/v1/logs?limit=50' | jq 'length'
   
   # Should return 404 (no catch-all)
   curl -s 'http://localhost:3000/api/logs'
   ```

2. **Verify logs have data**
   ```bash
   # Should show real latencyMs values
   curl -s 'http://localhost:3000/api/v1/logs?limit=50' | jq '.[] | .latencyMs' | head
   ```

3. **Check if frontend is making requests**
   ```bash
   # View browser console (F12)
   # Look for successful fetch to /api/v1/logs?limit=50
   ```

4. **Verify API is responding**
   ```bash
   curl -s 'http://localhost:3000/api/v1/health'
   # Should return: {"status":"UP",...}
   ```

## Common Issues & Solutions:

### Issue: Still seeing all zeros
**Check:** Is there a catch-all endpoint?
```bash
curl -s 'http://localhost:3000/api/logs' -w '\nStatus: %{http_code}\n'
```
- If returns JSON with "message": "Mock API response" → Catch-all exists
- **Fix:** Remove the catch-all from `mock-api/server.js`

### Issue: Only getting 20 logs
**Check:** Is limit parameter being passed?
```bash
curl -s 'http://localhost:3000/api/v1/logs' | jq 'length'  # Without limit
curl -s 'http://localhost:3000/api/v1/logs?limit=50' | jq 'length'  # With limit
```
- If first returns 20, second returns 50 → Fix frontend to add limit
- **Fix:** Update `useDataFetcher` call to include `?limit=50`

### Issue: Dashboard shows "Cannot connect to backend"
**Check:** Are the services running?
```bash
docker-compose -f docker-compose-simple.yml ps
```
All should show "Up" and "healthy"

**Check:** Is API responsive?
```bash
curl -s 'http://localhost:8080/api/v1/health'
```

**Fix:** Rebuild containers
```bash
docker-compose -f docker-compose-simple.yml down
docker-compose -f docker-compose-simple.yml up -d --build
```

## Key Files to Monitor:

1. **mock-api/server.js**
   - Lines 109-120: `/api/v1/logs` endpoint
   - Lines 185-197: Should NOT have catch-all (`if path.startsWith('/api/')`)
   - Should have proper 404 at end

2. **nextjs-dashboard/src/app/page.jsx**
   - Lines 60-68: Endpoint resolution logic
   - Line 675: `useDataFetcher('v1/logs?limit=50', ...)`
   - Line 680: `useDataFetcher('v1/incidents', ...)`

3. **docker-compose-simple.yml**
   - API service should be healthy
   - Next.js service should be healthy
   - MongoDB should be healthy

## Testing Commands Reference:

```bash
# Full system test
echo "1. Health:"
curl -s 'http://localhost:3000/api/v1/health' | jq .

echo "2. Logs count:"
curl -s 'http://localhost:3000/api/v1/logs?limit=50' | jq 'length'

echo "3. Sample log latencies:"
curl -s 'http://localhost:3000/api/v1/logs?limit=50' | jq '.[] | .latencyMs' | head -5

echo "4. Slow APIs (>500ms):"
curl -s 'http://localhost:3000/api/v1/logs?limit=50' | jq '[.[] | select(.latencyMs > 500)] | length'

echo "5. Broken APIs (status >= 500):"
curl -s 'http://localhost:3000/api/v1/logs?limit=50' | jq '[.[] | select(.statusCode >= 500)] | length'

echo "6. Metrics:"
curl -s 'http://localhost:3000/api/v1/metrics' | jq '.totalRequests, .activeUsers, .errorRate'
```

## Expected Behavior:

- **Every request to API returns different data** (randomly generated)
- **Dashboard auto-refreshes every 10 seconds**
- **All values are non-zero and realistic**
- **Latency ranges 50-1050ms (NOT all same value)**
- **Status codes vary: 200, 201, 400, 404, 500, 503**
- **Error rate 0.3%-1.5% (few errors, most success)**
- **Active users 75-100 (realistic concurrent users)**

## When Values Are "Too Perfect":

If you see values that are exactly the same every refresh, the catch-all is likely returning static mock data instead of generated data.

**Fix:** Remove catch-all endpoint from `mock-api/server.js`

---

**Remember:** The key insight is that the **catch-all endpoint** was intercepting requests meant for the v1 endpoints. Once removed and endpoints are explicit, all data flows correctly!
