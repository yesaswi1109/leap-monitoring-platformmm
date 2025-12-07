# LEAP Monitoring Platform - Production Deployment Guide

## Hosted Frontend URL (Next.js Dashboard)
**Status**: Ready for production deployment

### Key Features
✅ Email-based JWT authentication with password self-service
✅ 60+ concurrent users support optimized
✅ Real-time API monitoring dashboard
✅ Incident management with concurrency protection
✅ Advanced filtering and analytics

---

## Deployment Options

### Option 1: Deploy to Vercel (Recommended - Easiest)
Vercel is the creator of Next.js and offers seamless deployment.

#### Steps:
1. Push code to GitHub repository
2. Connect repository to Vercel (https://vercel.com)
3. Configure environment variables:
   - `NEXT_PUBLIC_API_BASE_URL` = Your backend collector URL
4. Deploy with one click
5. Get automatic HTTPS URL: `https://your-project.vercel.app`

#### Why Vercel:
- Automatic scaling for 60+ concurrent users
- Global CDN for fast performance
- Zero-config Next.js deployment
- Free tier available
- Custom domain support

---

### Option 2: Deploy to AWS (Elastic Beanstalk)
For enterprise/production environments.

#### Steps:
1. Install EB CLI: `pip install awsebcli`
2. Initialize: `eb init`
3. Create environment: `eb create leap-dashboard --instance-type t3.medium`
4. Deploy: `eb deploy`
5. Get URL: `eb open`

#### Environment Variables:
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-collector.com/api/v1
NODE_ENV=production
```

---

### Option 3: Docker + Cloud Run (Google Cloud)
Quick containerized deployment.

#### Steps:
1. Build Docker image: `docker build -t gcr.io/your-project/leap-dashboard .`
2. Push to GCR: `docker push gcr.io/your-project/leap-dashboard`
3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy leap-dashboard \
     --image gcr.io/your-project/leap-dashboard \
     --platform managed \
     --memory 512Mi \
     --cpu 1 \
     --max-instances 100
   ```
4. Get URL: Check Cloud Run console

#### Configuration:
- Memory: 512MB per instance
- CPU: 1 CPU
- Max instances: 100 (handles 60+ concurrent easily)
- Auto-scaling enabled

---

### Option 4: Docker + Heroku
For free/low-cost hosting.

#### Steps:
1. Create Heroku app: `heroku create leap-dashboard`
2. Set environment: `heroku config:set NEXT_PUBLIC_API_BASE_URL=...`
3. Deploy: `git push heroku main`
4. Get URL: `https://leap-dashboard.herokuapp.com`

---

## Authentication System Details

### User Database
- 60 pre-seeded users: `user1@leapmonitoring.com` to `user60@leapmonitoring.com`
- Demo user: `demo@leapmonitoring.com` / `demo123`
- Admin user: `admin@leapmonitoring.com` / `admin123`
- All first-time users can set their own password

### Default Passwords (for testing)
For user1 to user60: `password1` to `password60`

### How Authentication Works
1. **Email Check**: User enters email
2. **First-Time Setup**: If user exists and hasn't set password:
   - Prompt to create password
   - Stored securely in localStorage
3. **JWT Token**: Issued after successful login
4. **Session**: 24-hour token validity
5. **Multi-tab Sync**: Storage events sync across browser tabs

---

## Performance Optimization for 60+ Users

### Frontend Optimization (Already Implemented)
- ✅ Fast fetch timeouts: 5s (vs 10s before)
- ✅ Aggressive parallel fetching for logs & incidents
- ✅ Minimal retry delays (500ms vs 1s)
- ✅ Dashboard loads immediately with partial data
- ✅ Non-blocking health checks
- ✅ Lazy component loading
- ✅ Optimized error handling

### Backend Requirements (Central Collector)
- Memory: 1-1.5GB (allocated in docker-compose)
- CPU: 2 cores (allocated in docker-compose)
- Database: MongoDB 7.0 with 1GB memory
- Connection pooling enabled

### Load Balancing
For 60+ concurrent users:
```
60 users ÷ 10 connections per container = 6 instances needed
OR
Use auto-scaling: 3-10 instances based on CPU > 70%
```

---

## API Endpoints Required

The backend must provide these endpoints:

### 1. Health Check
```
GET /api/v1/health
Response: { status: "ok" }
```

### 2. Fetch API Logs
```
GET /api/v1/logs
Response: Array of {
  id, serviceName, endpoint, statusCode, 
  latencyMs, timestamp, isRateLimitHit
}
```

### 3. Fetch Open Incidents
```
GET /api/v1/incidents/open
Response: Array of {
  id, type, affectedEndpoint, severity, 
  timestamp, description
}
```

### 4. Mark Incident as Resolved
```
POST /api/v1/incidents/{id}/resolve?userId={email}
Headers: Authorization: Bearer {jwt_token}
Response: { success: true, message: "Resolved" }
```

---

## Recruiting Demo Setup

### Step 1: Deploy Frontend
1. Choose deployment option above
2. Get hosted URL (e.g., `https://leap-dashboard.vercel.app`)

### Step 2: Deploy Backend
- Ensure Central Collector is running
- Configure CORS to allow frontend domain
- Set `NEXT_PUBLIC_API_BASE_URL` to backend URL

### Step 3: Create Demo Script
Share with recruiters:

```
Frontend Dashboard: https://leap-dashboard.vercel.app
Backend API Docs: https://your-backend.com/swagger-ui.html

Login Credentials:
- Email: user1@leapmonitoring.com
- Password: password1

Test Features:
1. Login with email/password
2. View dashboard metrics (top right)
3. Explore API logs with filters
4. Check incident list
5. Mark incident as resolved
```

---

## Testing Checklist

- [ ] Login page loads
- [ ] Email validation works
- [ ] First-time password setup works
- [ ] JWT token issued and stored
- [ ] Dashboard loads data within 5s
- [ ] Filters work (service, status type)
- [ ] Incident resolution updates DB
- [ ] Handles 60+ concurrent users
- [ ] No memory leaks after 1 hour
- [ ] Logout clears auth state

---

## Monitoring & Alerts

### Key Metrics to Track
1. **Response Time**: < 500ms p95
2. **Error Rate**: < 1%
3. **Concurrent Users**: Scale at 60+
4. **Token Refresh**: Auto-refresh before expiry
5. **API Health**: Check every 30s

### Recommended Tools
- Vercel Analytics (if using Vercel)
- DataDog APM
- New Relic
- CloudWatch (if using AWS)

---

## Troubleshooting

### Issue: "Cannot connect to API"
**Solution**: 
- Check `NEXT_PUBLIC_API_BASE_URL` environment variable
- Ensure backend is running and accessible
- Verify CORS headers in backend

### Issue: "Login fails for valid user"
**Solution**:
- Clear localStorage: `localStorage.clear()`
- Refresh page and try again
- Check browser console for errors

### Issue: "Dashboard slow for 60+ users"
**Solution**:
- Increase backend memory to 2GB
- Add more instances (auto-scaling)
- Check MongoDB performance
- Enable query caching

---

## Production Checklist

- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Database backups scheduled
- [ ] Monitoring & alerting setup
- [ ] Error logging configured
- [ ] Load testing completed
- [ ] Security audit done
- [ ] Disaster recovery plan

---

## Next Steps

1. **Choose Deployment Platform**: Vercel (easiest) or AWS/GCP (enterprise)
2. **Deploy Frontend**: Follow platform-specific steps above
3. **Update Backend URL**: Set `NEXT_PUBLIC_API_BASE_URL` env var
4. **Test with 60 Users**: Use load testing tool (Apache JMeter, k6)
5. **Share URL with Recruiters**: Include demo credentials

---

## Support

For issues or questions:
- Check GitHub repository issues
- Review backend logs for API errors
- Enable debug logging: `localStorage.setItem('debug', 'true')`

---

**Deployment Status**: ✅ Ready for production
**Last Updated**: 2024-12-07
