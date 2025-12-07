const http = require('http');
const url = require('url');
const PORT = process.env.PORT || 8080;

// Generate dynamic sample data with REALISTIC values (not zeros)
function generateLogs() {
  const endpoints = ['/api/users', '/api/products', '/api/orders', '/api/auth/login', '/api/dashboard'];
  const services = ['api-gateway', 'database', 'auth-service', 'cache'];
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
    requestMethod: methods[Math.floor(Math.random() * methods.length)],
    serviceName: services[Math.floor(Math.random() * services.length)],
    statusCode: [200, 201, 400, 404, 500, 503][Math.floor(Math.random() * 6)],
    latencyMs: Math.round(Math.random() * 1000) + 50, // 50-1050ms
    timestamp: Date.now() - (i * 1000),
    isRateLimitHit: Math.random() > 0.95, // 5% rate limit hits
    level: ['ERROR', 'INFO', 'WARN', 'DEBUG'][Math.floor(Math.random() * 4)],
    details: `Log details for endpoint ${endpoints[Math.floor(Math.random() * endpoints.length)]}`
  }));
}

function generateIncidents() {
  return Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    title: `Incident ${i + 1}`,
    status: i === 0 ? 'open' : (Math.random() > 0.5 ? 'open' : 'resolved'),
    severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)],
    createdAt: Date.now() - (i * 86400000),
    description: `Description for incident ${i + 1}`
  }));
}

// Generate REALISTIC metrics (not zeros or random values)
function generateMetrics() {
  // Base values that represent a healthy system
  const baseRequests = 42500;  // ~42.5k requests
  const baseResponseTime = 245; // ~245ms average
  const baseUsers = 87; // ~87 active users
  const baseRPS = 487; // ~487 requests/second
  
  // Add small variations (±10-15%) to look realistic but consistent
  return {
    totalRequests: Math.round(baseRequests + (Math.random() - 0.5) * 5000), // 40k-45k
    averageResponseTime: Math.round(baseResponseTime + (Math.random() - 0.5) * 60), // 215-275ms
    errorRate: parseFloat((0.3 + (Math.random() * 1.2)).toFixed(2)), // 0.3%-1.5% errors (good)
    uptime: parseFloat((99.85 + (Math.random() * 0.13)).toFixed(2)), // 99.85%-99.98% uptime
    activeUsers: Math.round(baseUsers + (Math.random() - 0.5) * 20), // 75-100 users
    requestsPerSecond: Math.round(baseRPS + (Math.random() - 0.5) * 100), // 437-537 RPS
    peakLatency: Math.round(450 + (Math.random() - 0.5) * 150), // 375-525ms
    successRate: parseFloat((98.5 + (Math.random() * 1.2)).toFixed(2)), // 98.5%-99.7% success
    dbConnections: 23, // Stable value
    cacheHitRate: parseFloat((94.2 + (Math.random() * 2)).toFixed(2)), // 94-96% cache hits
    avgDBQueryTime: Math.round(45 + (Math.random() - 0.5) * 20), // 35-55ms
    memoryUsage: parseFloat((62.5 + (Math.random() * 8)).toFixed(1)), // 62-71% memory
    cpuUsage: parseFloat((35.2 + (Math.random() * 15)).toFixed(1)) // 35-50% CPU
  };
}

function json(res, obj, code = 200) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  const s = JSON.stringify(obj);
  res.end(s);
}

function handleCORS(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }
  return false;
}

const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (handleCORS(req, res)) return;

  const parsed = url.parse(req.url, true);
  const method = req.method;
  const path = parsed.pathname;

  console.log(`[${new Date().toISOString()}] [${method}] ${path}`);

  // Health check
  if (path === '/api/v1/health' && method === 'GET') {
    return json(res, { 
      status: 'UP', 
      service: 'api-server',
      timestamp: new Date().toISOString()
    });
  }

  // Metrics endpoint - returns dynamic data
  if (path === '/api/v1/metrics' && method === 'GET') {
    return json(res, generateMetrics());
  }

  // Logs endpoint - returns dynamic logs
  if (path === '/api/v1/logs' && method === 'GET') {
    const limit = parseInt(parsed.query.limit) || 20;
    return json(res, generateLogs().slice(0, limit));
  }

  // Incidents endpoint - returns dynamic incidents
  if (path === '/api/v1/incidents' && method === 'GET') {
    return json(res, generateIncidents());
  }

  // Resolve incident
  if (path.startsWith('/api/v1/incidents/') && path.endsWith('/resolve') && method === 'POST') {
    const id = parseInt(path.split('/')[4]);
    const incidents = generateIncidents();
    const incident = incidents.find(i => i.id === id);
    if (incident) {
      incident.status = 'resolved';
      return json(res, { ok: true, id, status: 'resolved' });
    }
    return json(res, { error: 'Not found' }, 404);
  }

  // Get single incident
  if (path.startsWith('/api/v1/incidents/') && method === 'GET') {
    const id = parseInt(path.split('/')[4]);
    const incidents = generateIncidents();
    const incident = incidents.find(i => i.id === id);
    if (incident) {
      return json(res, incident);
    }
    return json(res, { error: 'Not found' }, 404);
  }

  // Login endpoint
  if (path === '/api/v1/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        return json(res, {
          token: 'mock-jwt-token-' + Math.random().toString(36).substr(2, 16),
          expiresIn: 86400,
          user: {
            email: data.email || 'user@example.com',
            id: 'user-' + Math.random().toString(36).substr(2, 9)
          }
        });
      } catch (e) {
        return json(res, { error: 'Invalid request' }, 400);
      }
    });
    return;
  }

  // Dashboard data endpoint - comprehensive metrics
  if (path === '/api/v1/dashboard' && method === 'GET') {
    return json(res, {
      metrics: generateMetrics(),
      recentLogs: generateLogs().slice(0, 10),
      incidents: generateIncidents(),
      lastUpdated: new Date().toISOString()
    });
  }

  // Catch-all: Return 404 for unknown endpoints (prevents fallback to mock data)
  res.writeHead(404, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify({ error: 'Not found', path }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Mock API Server listening on port ${PORT}`);
  console.log(`   🔄 All endpoints return DYNAMIC DATA that changes on each request`);
  console.log(`   Endpoints:`);
  console.log(`     Health:     http://localhost:${PORT}/api/v1/health`);
  console.log(`     Metrics:    http://localhost:${PORT}/api/v1/metrics (DYNAMIC)`);
  console.log(`     Logs:       http://localhost:${PORT}/api/v1/logs (DYNAMIC)`);
  console.log(`     Incidents:  http://localhost:${PORT}/api/v1/incidents (DYNAMIC)`);
  console.log(`     Dashboard:  http://localhost:${PORT}/api/v1/dashboard (DYNAMIC)`);
});

