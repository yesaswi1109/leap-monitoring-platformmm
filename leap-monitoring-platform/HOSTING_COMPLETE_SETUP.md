# 🚀 HOSTED URL SETUP - BACKEND + FRONTEND TOGETHER

## ❓ THE PROBLEM YOU'RE FACING

```
Error: Cannot connect to API
The application is trying to connect to: https://localhost:8080/api/v1
Please ensure the Central Collector is running at this address
```

**Why?** Frontend and backend need to be running together, not separately.

---

## ✅ THE SOLUTION: RUN EVERYTHING TOGETHER

You have **THREE OPTIONS**:

---

## 🎯 OPTION 1: RUN LOCALLY (Fastest - 5 minutes)

Perfect for testing, development, and 60-user load testing.

### Step 1: Single Command to Start Everything
```bash
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform

# Make script executable
chmod +x RUN_COMPLETE_SETUP.sh

# Run the complete setup
./RUN_COMPLETE_SETUP.sh
```

**What it does:**
- Builds all Docker images
- Starts MongoDB (database)
- Starts Backend (Spring Boot on port 8080)
- Starts Frontend (Next.js on port 3000)
- Waits for all to be healthy
- Gives you the working URL

### Step 2: Open in Browser
```
http://localhost:3000
```

### Step 3: Login
```
Email: demo@leapmonitoring.com
Password: demo123
```

**Time**: 5 minutes first run, 10 seconds subsequent runs

---

## 🌍 OPTION 2: DEPLOY ON AWS (Production - 30 minutes)

For a real hosted URL that works forever and handles 60+ users.

### Step 1: Create EC2 Instance
```bash
# On AWS Console:
# 1. Go to EC2 Dashboard
# 2. Launch new instance:
#    - Ubuntu 24.04 LTS
#    - t3.medium (recommended for 60+ users)
#    - 30GB storage
#    - Security group: Open ports 80, 443, 3000, 8080, 27017
```

### Step 2: SSH into Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip-address

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group
sudo usermod -aG docker ubuntu
```

### Step 3: Clone and Run
```bash
# Clone repository
git clone https://github.com/yesaswi1109/leap-monitoring-platformmm.git
cd leap-monitoring-platformmm/leap-monitoring-platform

# Make setup executable
chmod +x RUN_COMPLETE_SETUP.sh

# Run everything
./RUN_COMPLETE_SETUP.sh
```

### Step 4: Access Your Dashboard
```
http://your-ec2-ip-address:3000
```

**Your hosted URL will be:**
```
http://ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com:3000
```

**Cost**: $10-20/month for t3.medium instance

---

## ☁️ OPTION 3: DEPLOY ON GOOGLE CLOUD RUN (Serverless - 20 minutes)

For automatic scaling and pay-per-request pricing.

### Step 1: Setup gcloud CLI
```bash
# Install gcloud
# Go to: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

### Step 2: Build and Push Docker Images
```bash
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform

# Enable required services
gcloud services enable run.googleapis.com
gcloud services enable compute.googleapis.com

# Build backend image
cd central-collector
docker build -t gcr.io/YOUR_PROJECT/leap-backend .
docker push gcr.io/YOUR_PROJECT/leap-backend

# Build frontend image
cd ../nextjs-dashboard
docker build -t gcr.io/YOUR_PROJECT/leap-dashboard .
docker push gcr.io/YOUR_PROJECT/leap-dashboard

# Go back to root
cd ..
```

### Step 3: Deploy Backend
```bash
gcloud run deploy leap-backend \
  --image gcr.io/YOUR_PROJECT/leap-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SPRING_DATA_MONGODB_URI=mongodb://mongo:27017/logs_db \
  --memory 1024Mi \
  --cpu 2 \
  --max-instances 10
```

### Step 4: Deploy Frontend (with Backend URL)
```bash
BACKEND_URL=$(gcloud run services describe leap-backend \
  --platform managed --region us-central1 \
  --format 'value(status.url)')

gcloud run deploy leap-dashboard \
  --image gcr.io/YOUR_PROJECT/leap-dashboard \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_API_BASE_URL=$BACKEND_URL/api/v1 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 20
```

### Step 5: Get Your Hosted URL
```bash
gcloud run services describe leap-dashboard \
  --platform managed --region us-central1 \
  --format 'value(status.url)'
```

**Your hosted URL will be:**
```
https://leap-dashboard-xxxxx-uc.a.run.app
```

**Cost**: $0.24/million requests + free tier

---

## 🐳 QUICK REFERENCE: RUNNING LOCALLY

### Complete Setup (Recommended)
```bash
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform
chmod +x RUN_COMPLETE_SETUP.sh
./RUN_COMPLETE_SETUP.sh
```

### Manual Setup (If above doesn't work)
```bash
# Stop old containers
docker-compose down -v

# Start all services
docker-compose build --no-cache
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Wait 2-3 minutes, then visit:
# http://localhost:3000
```

### Scaling for 60+ Users (Locally)
```bash
# Add more backend instances
docker-compose up -d --scale central-collector=3

# Or use the docker-compose scale command
docker-compose -f docker-compose.yml up -d
```

---

## 🔑 LOGIN CREDENTIALS

**All accounts work across all deployment options:**

```
Demo (Easy Login):
  Email: demo@leapmonitoring.com
  Password: demo123

Admin (Full Access):
  Email: admin@leapmonitoring.com
  Password: admin123

60 Test Users (For Load Testing):
  user1@leapmonitoring.com → password1
  user2@leapmonitoring.com → password2
  ...
  user60@leapmonitoring.com → password60
```

---

## 📊 WHAT YOU'LL SEE AT HOSTED URL

1. **Login Page** - Professional email/password login
2. **Dashboard** - Real-time metrics
3. **API Explorer** - Filterable request logs
4. **Alerts** - Real-time incident detection
5. **Resolution** - Mark incidents as fixed

---

## ⚡ USEFUL COMMANDS

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f central-collector
docker-compose logs -f nextjs-dashboard
docker-compose logs -f mongo
```

### Stop Everything
```bash
docker-compose down
```

### Remove Everything (Clean Slate)
```bash
docker-compose down -v
```

### Restart a Service
```bash
docker-compose restart central-collector
```

### Check Service Health
```bash
# Backend health
curl http://localhost:8080/api/v1/health

# Frontend health
curl http://localhost:3000 | grep Leap
```

### View Database
```bash
# Connect to MongoDB
docker exec -it leap_mongo mongosh

# In MongoDB shell:
> use logs_db
> db.logs.countDocuments()
> db.incidents.countDocuments()
```

---

## 🎯 WHICH OPTION TO CHOOSE?

### ✅ LOCAL (Option 1) - Best For:
- Testing the dashboard quickly
- Development
- Load testing with 60 users
- Understanding the system
- No cost
- **Setup time**: 5 minutes

### ✅ AWS EC2 (Option 2) - Best For:
- Production deployment
- Showing recruiters a real hosted URL
- Full control & customization
- Scaling flexibility
- **Cost**: $10-20/month
- **Setup time**: 30 minutes

### ✅ GCP Cloud Run (Option 3) - Best For:
- Serverless deployment
- Pay-only-for-usage pricing
- Automatic scaling
- Minimal operations
- **Cost**: $0.24/million requests
- **Setup time**: 20 minutes

---

## ✅ TESTING YOUR DEPLOYMENT

### Step 1: Verify All Services Running
```bash
docker-compose ps

# Should show:
# NAME              STATUS
# leap_mongo        Up (healthy)
# leap_central_collector  Up (healthy)
# leap_dashboard    Up (healthy)
```

### Step 2: Test Backend API
```bash
# Health check
curl http://localhost:8080/api/v1/health

# Fetch logs (should return [] initially)
curl http://localhost:8080/api/v1/logs \
  -H "Authorization: Bearer test-token"
```

### Step 3: Test Frontend
```bash
# Open in browser
http://localhost:3000

# You should see login page
```

### Step 4: Complete Login Flow
1. Visit http://localhost:3000
2. Enter: demo@leapmonitoring.com
3. Enter: demo123
4. Click Login
5. Should see dashboard with metrics

---

## 🐛 TROUBLESHOOTING

### Frontend Says "Cannot connect to API"
**Problem**: Backend is not running or frontend can't reach it
**Solution**:
```bash
# Check backend is running
docker-compose ps central-collector

# Check backend health
curl http://localhost:8080/api/v1/health

# Check frontend env variable
docker-compose exec nextjs-dashboard env | grep API_BASE_URL

# Restart both
docker-compose restart central-collector nextjs-dashboard
```

### Port Already in Use
**Problem**: Port 3000 or 8080 already in use
**Solution**:
```bash
# Find process using port
lsof -i :3000
lsof -i :8080

# Kill it
kill -9 <PID>

# Or change docker-compose.yml port mapping
```

### Database Connection Error
**Problem**: MongoDB not responding
**Solution**:
```bash
# Check MongoDB
docker-compose ps mongo

# Restart MongoDB
docker-compose restart mongo

# Wait 10 seconds, then try again
```

### Slow Performance
**Problem**: Dashboard is slow with many users
**Solution**:
```bash
# Scale backend to 3 instances
docker-compose up -d --scale central-collector=3

# Or increase container memory in docker-compose.yml
```

---

## 🎯 FINAL HOSTED URL

**For Local Testing:**
```
http://localhost:3000
```

**For Production (AWS):**
```
http://your-ec2-ip:3000
```

**For Serverless (GCP):**
```
https://leap-dashboard-xxxxx-uc.a.run.app
```

---

## 🚀 QUICK START (Copy & Paste)

```bash
# Navigate to project
cd /workspaces/leap-monitoring-platformmm/leap-monitoring-platform

# Run everything
chmod +x RUN_COMPLETE_SETUP.sh
./RUN_COMPLETE_SETUP.sh

# Wait 2-3 minutes
# Then open: http://localhost:3000
# Login: demo@leapmonitoring.com / demo123
```

---

**Status**: ✅ Ready to run
**Time**: 5 minutes for local, 30 min for AWS, 20 min for GCP
**Result**: Full working dashboard with backend + frontend

Let's go! 🚀
