# 🚀 VERCEL DEPLOYMENT - FRONTEND ONLY (Backend stays on Docker)

## ⚠️ IMPORTANT: How It Works

**Vercel hosts:** Next.js Frontend (UI)  
**Your computer hosts:** Backend API + Database (Docker)  
**They communicate:** Through your Codespaces/public IP

---

## 🎯 STEP-BY-STEP DEPLOYMENT

### STEP 1: Prepare Your Backend (Already Done ✅)

Your backend is already running in Docker on port 8080.

```bash
# Verify backend is running:
curl http://localhost:8080/api/v1/metrics
```

### STEP 2: Update Frontend Config for Vercel

The frontend needs to know where the backend is. Since Vercel is in the cloud, it can't use `localhost`.

**Two Options:**

#### Option A: Use Codespaces Backend (Recommended - Easiest)
Your backend stays in Docker in Codespaces.
Frontend talks to Codespaces public URL.

**Steps:**
```bash
# 1. Get your Codespaces backend URL:
echo "https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"

# 2. The URL will look like:
# https://glowing-succotash-6v457g5qvvqf5g6q-8080.app.github.dev
```

#### Option B: Deploy Backend to Cloud (Advanced)
Deploy backend to Render.com or Railway.app for permanent hosting.

---

## 🔧 CONFIGURE FRONTEND FOR VERCEL

We need to tell the frontend where to find the backend API.

### Edit `nextjs-dashboard/next.config.mjs`:

Change the rewrite URL from Docker to Codespaces public URL:

**OLD (Docker):**
```javascript
rewrites: async () => {
  return {
    beforeFiles: [
      {
        source: '/api/:path*',
        destination: 'http://api-server:8080/api/:path*'  // ❌ Won't work on Vercel
      }
    ]
  }
}
```

**NEW (Codespaces Public):**
```javascript
rewrites: async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://api-server:8080'
  return {
    beforeFiles: [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`  // ✅ Uses environment variable
      }
    ]
  }
}
```

---

## 📋 EXACT DEPLOYMENT STEPS

### STEP 1: Get Your Backend URL

```bash
# Copy this URL - you'll need it for Vercel:
echo "https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"

# Example output:
# https://glowing-succotash-6v457g5qvvqf5g6q-8080.app.github.dev
```

**Save this URL** - you'll use it in Step 3!

---

### STEP 2: Update next.config.mjs

Replace the old config with this:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://api-server:8080'
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`
        }
      ]
    }
  }
}

export default nextConfig
```

---

### STEP 3: Push to GitHub

```bash
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform

git add nextjs-dashboard/next.config.mjs
git commit -m "✅ Update backend URL configuration for Vercel deployment"
git push origin main
```

---

### STEP 4: Deploy to Vercel

**Go to:** https://vercel.com/new

**Steps:**
1. Click **"Import Project"**
2. Paste: `https://github.com/yesaswi1109/leap-monitoring-platformmm`
3. Click **"Continue"**
4. Configure:
   - **Root Directory:** `leap-monitoring-platform/nextjs-dashboard`
   - **Environment Variables:** Add the following:
     ```
     NEXT_PUBLIC_BACKEND_URL = https://glowing-succotash-6v457g5qvvqf5g6q-8080.app.github.dev
     ```
     *(Replace with YOUR actual backend URL from Step 1)*
5. Click **"Deploy"**
6. Wait 2-3 minutes
7. Copy your Vercel URL (looks like: `https://leap-monitoring-platform-xxx.vercel.app`)

---

## ✅ IMPORTANT REQUIREMENTS

For Vercel frontend to work:

✅ **Backend must be running:**
```bash
docker-compose -f docker-compose-simple.yml ps
# Should show api-server HEALTHY
```

✅ **Backend URL must be accessible publicly:**
```bash
# Test from any browser:
https://[YOUR-BACKEND-URL]/api/v1/metrics
# Should return real data (no 404)
```

✅ **Backend must have CORS enabled:**
```bash
# Already enabled in server.js ✅
```

---

## 🎯 COMPLETE WORKFLOW

### During Development (What you do now):

1. **Keep Docker running** on your Codespaces
   ```bash
   # Check backend is healthy:
   curl http://localhost:8080/api/v1/metrics
   ```

2. **Get your backend public URL:**
   ```bash
   echo "https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
   ```

3. **Deploy to Vercel** with backend URL in environment variables

4. **Vercel hosts frontend**
   - Users access: `https://your-app.vercel.app`
   - Frontend fetches from: `https://your-backend-url-8080.app.github.dev/api/...`

---

## 📱 WHAT REVIEWERS WILL SEE

### On Vercel Frontend:

**URL:** `https://your-app.vercel.app`

**Features:**
- ✅ Login page loads
- ✅ Dashboard shows real metrics (from backend)
- ✅ API logs update every 10 seconds
- ✅ Incidents display correctly
- ✅ Error graph shows real data
- ✅ Works on desktop, mobile, tablet
- ✅ 60+ users supported

**As long as:**
- ✅ Vercel is running (always on)
- ✅ Your backend stays running in Docker
- ✅ Your backend is publicly accessible

---

## 🔑 Login Credentials (Same)

```
Email: demo@leapmonitoring.com
Password: demo123

Or: user1-60@leapmonitoring.com / password1-60
```

---

## ⚠️ KEEP YOUR BACKEND RUNNING

**Important:** For Vercel frontend to show real data:

```bash
# Keep these running while reviewers test:
docker-compose -f docker-compose-simple.yml up -d

# Monitor if needed:
docker-compose -f docker-compose-simple.yml logs -f api-server
```

**If backend stops:**
- Frontend loads but shows "Cannot fetch data" or blank values
- Restart: `docker-compose up -d`

---

## 🚨 TROUBLESHOOTING

### Problem: "Failed to fetch from backend"

**Solution 1:** Check backend is running
```bash
curl https://your-backend-url-8080.app.github.dev/api/v1/metrics
# Should return: {"totalRequests": ...}
```

**Solution 2:** Check environment variable in Vercel
```
Go to Vercel → Project Settings → Environment Variables
Check: NEXT_PUBLIC_BACKEND_URL is set correctly
(Should match your Codespaces backend URL)
```

**Solution 3:** Restart Vercel deployment
```
In Vercel: Project → Deployments → More → Redeploy
```

### Problem: "CORS error"

**Already fixed in backend ✅**
Backend has CORS enabled for all origins.

### Problem: "Backend URL not accessible"

**Check:**
1. Is Docker running? `docker-compose ps`
2. Is port 8080 published? `docker-compose ps` (should show `8080->8080`)
3. Try the URL in browser: `https://your-backend-url-8080.app.github.dev/api/v1/metrics`

---

## 📊 FINAL ARCHITECTURE

```
Reviewer's Browser
        ↓
   Vercel Frontend (Next.js)
   https://your-app.vercel.app
        ↓ (fetches from)
   Your Codespaces Backend
   https://your-backend-url-8080.app.github.dev/api/...
        ↓
   Docker Containers (API + MongoDB)
   localhost:8080, localhost:27017
```

---

## 🎯 READY TO DEPLOY?

### Quick Checklist:

- [ ] Backend running: `docker-compose ps`
- [ ] Backend healthy: `curl http://localhost:8080/api/v1/metrics`
- [ ] Get backend URL: `echo https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
- [ ] Update next.config.mjs (copy config above)
- [ ] Push to GitHub: `git push origin main`
- [ ] Deploy to Vercel: https://vercel.com/new
- [ ] Set environment variable in Vercel: `NEXT_PUBLIC_BACKEND_URL=[your-backend-url]`
- [ ] Wait for deployment
- [ ] Test: Open Vercel URL → Login → See real data
- [ ] Share with reviewers!

---

## 📞 NEED HELP?

**Backend not accessible?**
→ Check Docker: `docker-compose ps`
→ Check port: `netstat -tulpn | grep 8080`
→ Check logs: `docker-compose logs api-server`

**Vercel can't connect to backend?**
→ Test URL in browser: `https://your-backend-url-8080.app.github.dev/api/v1/metrics`
→ Check environment variable in Vercel
→ Redeploy in Vercel

**Still having issues?**
→ See TROUBLESHOOTING_GUIDE.md for more details

---

## ✅ YOU'RE READY!

1. Get your backend URL
2. Deploy to Vercel with environment variable
3. Share Vercel URL with reviewers
4. Keep Docker running
5. Done! 🚀
