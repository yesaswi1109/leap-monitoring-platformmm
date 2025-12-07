# Netlify Deployment Guide - LEAP Monitoring Dashboard

## Quick Setup (5 minutes)

### Step 1: Connect Your GitHub Repository to Netlify

1. Go to [netlify.com](https://netlify.com) and sign in (or create an account)
2. Click **"New site from Git"**
3. Select **GitHub** and authorize Netlify
4. Select repository: `yesaswi1109/leap-monitoring-platformmm`
5. Click **Deploy site**

### Step 2: Configure Build Settings

Netlify auto-detects the build config, but verify these settings:

**Build settings:**
- **Base directory:** `leap-monitoring-platform/nextjs-dashboard`
- **Build command:** `npm run build`
- **Publish directory:** `.next`

**Environment variables** (if using backend API):
```
NEXT_PUBLIC_API_BASE_URL=https://your-collector-backend.com/api
```

### Step 3: Deploy

Netlify auto-deploys on every push to `main`. Monitor the build at your Netlify dashboard.

---

## Frontend Dashboard URL

Once deployed, your dashboard will be available at:

```
https://your-site-name.netlify.app
```

**Features:**
- ✅ JWT Login (email/password)
- ✅ Dashboard Home (metrics widgets: slow APIs, broken APIs, rate-limit violations, avg latency)
- ✅ API Explorer (table with filters: service, endpoint, status code, slow/broken only)
- ✅ Alerts Viewer (triggered alerts with acknowledgment)
- ✅ Issue Management (mark slow/broken endpoints as resolved with concurrency protection)
- ✅ Responsive design (mobile & desktop)

---

## API Endpoints Expected by Dashboard

The dashboard makes requests to these endpoints via `/api` proxy:

### Authentication
- `POST /api/auth/login` - Login user, return JWT token

### Logs & Metrics
- `GET /api/logs` - Fetch API logs (with optional filters: service, endpoint, statusCode)
- `GET /api/logs/slow?threshold=500` - Get slow APIs (latency > threshold)
- `GET /api/logs/broken` - Get broken APIs (5xx status)
- `GET /api/logs/rate-limit` - Get rate-limit violations
- `GET /api/metrics/latency` - Get latency per endpoint
- `GET /api/metrics/top-slow?limit=5` - Get top N slowest endpoints
- `GET /api/metrics/error-rate?period=7d` - Get error rate graph data

### Alerts
- `GET /api/alerts` - Fetch alerts (with optional filters: type, severity, resolved)
- `POST /api/alerts/{id}/acknowledge` - Acknowledge an alert

### Issues
- `GET /api/issues?resolved=false` - Fetch unresolved issues
- `POST /api/issues/{id}/resolve` - Mark issue as resolved (concurrency-safe)

---

## Backend Setup (Spring Boot Collector)

The dashboard proxy at `/api` will route to your backend. Ensure:

1. **Backend API is running** at `http://localhost:8080` (local) or deployed to production
2. **CORS is enabled** for the dashboard domain
3. **All endpoints are protected** by JWT (except `/auth/login`)
4. **Database schema includes:**
   - `logs` table (API requests)
   - `alerts` table (triggered alerts)
   - `issues` table (tracked issues with concurrency tracking)

### Example Gradle Build (with wrapper):
```bash
cd leap-monitoring-platform
./gradlew :central-collector:bootJar
java -jar central-collector/build/libs/central-collector-*.jar
```

---

## Troubleshooting

### Build Fails: "Module not found"
**Fix:** Ensure all dependencies are in `package.json`. Run locally first:
```bash
cd nextjs-dashboard
npm ci
npm run build
```

### Deploy but blank page / API calls fail
**Fix:** Check browser console for errors. Likely causes:
1. Backend API not reachable (check environment variables)
2. CORS not enabled on backend
3. JWT token invalid or expired

### Login not working
**Fix:** Verify backend `/api/auth/login` endpoint:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@leap.io","password":"test123"}'
```

---

## Recruiter Checklist

When presenting to recruiters, provide:

1. **Hosted Frontend URL** (from Netlify)
   ```
   https://your-site-name.netlify.app
   ```

2. **GitHub Repository**
   ```
   https://github.com/yesaswi1109/leap-monitoring-platformmm
   ```

3. **(Optional) Backend API URL** (if exposed)
   ```
   https://your-backend.com/api/v1
   ```

4. **Demo Credentials**
   ```
   Email: demo@leap.io
   Password: demo123
   ```

---

## Files Modified for Netlify

- `nextjs-dashboard/.nvmrc` - Node version pinning
- `nextjs-dashboard/package.json` - Node 18+ requirement, build scripts
- `.github/workflows/deploy.yml` - CI/CD workflow (optional)
- `nextjs-dashboard/src/app/` - All dashboard components
- `leap-monitoring-platform/gradle/wrapper/` - Gradle 8.5 wrapper

---

## Useful Commands

### Local Development
```bash
cd nextjs-dashboard
npm run dev  # Start dev server at http://localhost:3000
```

### Local Build Test (for Netlify simulation)
```bash
cd nextjs-dashboard
npm ci
npm run build
npm run start
```

### Backend Build (Gradle)
```bash
cd leap-monitoring-platform
./gradlew build -x test
```

---

**Status:** ✅ Ready for Netlify deployment
**Dashboard Features:** ✅ Complete
**Backend Integration:** ⏳ Connect your API endpoints (see expected endpoints above)
