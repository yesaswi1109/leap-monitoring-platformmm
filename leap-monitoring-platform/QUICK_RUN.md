# ⚡ WORKING HOSTED URL - 5 MINUTE SETUP

## 🎯 THE PROBLEM
Frontend shows: "Error Connecting to Backend - localhost:8080/api/v1"

## ✅ THE SOLUTION
Run **ONE command** to start everything together.

---

## 🚀 RUN THIS NOW (Copy & Paste)

```bash
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform
chmod +x RUN_COMPLETE_SETUP.sh
./RUN_COMPLETE_SETUP.sh
```

**Time**: 3-5 minutes first run, then 10 seconds

---

## 📍 YOUR HOSTED URL

```
http://localhost:3000
```

---

## 🔑 LOGIN

```
Email: demo@leapmonitoring.com
Password: demo123
```

---

## 📊 WHAT'S RUNNING

```
✅ MongoDB (Database) ........... Port 27017
✅ Backend API (Spring Boot) .... Port 8080 → /api/v1
✅ Frontend (Next.js) ........... Port 3000 → http://localhost:3000
```

---

## ✨ YOU'LL SEE

1. Login page with email/password
2. Dashboard with real-time metrics
3. API logs with filters
4. Real-time alerts
5. Incident resolution button

---

## 🎯 NEXT STEPS

1. **Run the command above**
2. **Wait 2-3 minutes**
3. **Open**: http://localhost:3000
4. **Login**: demo@leapmonitoring.com / demo123
5. **Done!** 🎉

---

## 🐛 TROUBLESHOOTING

### "Port 3000 already in use"
```bash
# Kill the process
lsof -i :3000
kill -9 <PID>

# Then run again
./RUN_COMPLETE_SETUP.sh
```

### "Cannot connect to backend"
```bash
# Wait 5-10 more seconds
# Backend takes time to start

# Check status
docker-compose ps

# All should show "Up" and "healthy"
```

### "Docker not found"
Install Docker from https://docker.com

---

## 📋 USEFUL COMMANDS

```bash
# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Scale for 60+ users
docker-compose up -d --scale central-collector=3

# Clean restart
docker-compose down -v
./RUN_COMPLETE_SETUP.sh
```

---

## 🌍 FOR PRODUCTION HOSTING

See: `HOSTING_COMPLETE_SETUP.md`

Options:
- AWS EC2: 30 min setup, $10-20/month
- Google Cloud Run: 20 min setup, $0.24/million requests
- Heroku: 10 min setup, Free/$7+/month

---

**Status**: ✅ READY TO RUN
**Time**: 5 minutes
**Cost**: FREE (local)

Let's go! 🚀
