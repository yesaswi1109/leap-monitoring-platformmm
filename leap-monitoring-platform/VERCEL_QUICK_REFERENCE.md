# 🚀 VERCEL + BACKEND - QUICK REFERENCE

## Your Backend URL (Copy This)
```
https://glowing-succotash-6v457g5qvvqf5g6q-8080.app.github.dev
```

## 7 Quick Steps

### Step 1: Enable Port 8080 (30 sec)
- Ctrl + Shift + P → "Ports View"
- Find port 8080 → Right-click → "Make Public"

### Step 2: Open Vercel (1 min)
- Go to: https://vercel.com/new
- Click: "Continue with GitHub"
- Authorize

### Step 3: Import Project (30 sec)
- Click: "Import Project"
- Paste: https://github.com/yesaswi1109/leap-monitoring-platformmm
- Click: "Continue"

### Step 4: Configure (30 sec)
- Root Directory: `leap-monitoring-platform/nextjs-dashboard`
- Leave others default

### Step 5: Environment Variable (1 min)
- Scroll to: "Environment Variables"
- Name: `NEXT_PUBLIC_BACKEND_URL`
- Value: `https://glowing-succotash-6v457g5qvvqf5g6q-8080.app.github.dev`

### Step 6: Deploy (3 min)
- Click: "Deploy"
- Wait for completion

### Step 7: Get URL (10 sec)
- Copy your Vercel URL from success page
- Example: `https://leap-monitoring-platform-xxxxx.vercel.app`

## Test & Share
1. Open Vercel URL → Login with demo@leapmonitoring.com / demo123
2. Verify real data shows (Avg Latency ~525ms, NOT zeros)
3. Test on mobile
4. Share with reviewers

## Important
- Keep Codespaces open (backend needs to stay running)
- Port 8080 must be "Public"
- Environment variable must have correct backend URL

## Done!
Total time: 10 minutes

Your reviewers can now access from any device!
