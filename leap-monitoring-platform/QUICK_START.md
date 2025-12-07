# LEAP Monitoring Platform - QUICK REFERENCE

## 🚀 ONE-COMMAND DEPLOYMENT

```bash
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform
./DEPLOY.sh
```

That's it! The script will:
- ✅ Check all prerequisites
- ✅ Build Docker images
- ✅ Start all services
- ✅ Verify health
Quick start (deliverable — local reviewer-ready)

This repository includes a fast fallback mode so reviewers can open a working dashboard quickly without waiting for the full Java backend build.

Summary (what you'll get immediately):
- Mock API running: http://localhost:8080/api/v1
- Dashboard (Next.js) running: http://localhost:3000
- Mock login returns a token and persists ~7 days (for demo)

One-command start (recommended)

```bash
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform
./scripts/start_local.sh
```

What the script does:
- Starts a tiny mock API on port 8080
- Builds the Next.js dashboard (if needed) and starts it on port 3000

Quick verification

```bash
curl http://localhost:8080/api/v1/health
curl -X POST -H "Content-Type: application/json" -d '{"email":"user","password":"pass"}' http://localhost:8080/api/v1/login
curl -I http://localhost:3000/
```

Make it public (optional)

To expose the dashboard to external reviewers, run:

```bash
./scripts/start_ngrok.sh <YOUR_NGROK_AUTH_TOKEN>
```

This will download ngrok (if needed), configure your auth token and create a public tunnel to `http://localhost:3000`. The script prints the public URL you can share.

If you'd rather I create the public tunnel here, paste your ngrok auth token and I'll start it for you.

Notes & caveats
- The full Java backend failed to build inside the container in this environment (Gradle script errors). I can continue fixing the Docker/Gradle setup, but it takes longer — the fallback above is the fastest way to get a working demo for reviewers.
- The mock API is intentionally simple and provides the endpoints the dashboard expects (`/api/v1/health`, `/api/v1/login`, `/api/v1/logs`, `/api/v1/incidents`).

Files added to support quick delivery
- `mock-api/server.js` — lightweight mock API
- `scripts/start_local.sh` — start mock API + build/start dashboard
- `scripts/start_ngrok.sh` — helper to download/configure/run ngrok (requires auth token)

If you want me to make the tunnel now, paste your ngrok token and I will start it and return the public URL.
