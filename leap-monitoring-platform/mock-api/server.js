const http = require('http');
const url = require('url');
const PORT = process.env.PORT || 8080;

let sampleLogs = [
  { id: 1, message: 'Error: failed to connect', level: 'ERROR', timestamp: Date.now() },
  { id: 2, message: 'User login succeeded', level: 'INFO', timestamp: Date.now() }
];
let sampleIncidents = [
  { id: 1, title: 'High error rate', status: 'open' }
];

function json(res, obj, code = 200) {
  const s = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(s) });
  res.end(s);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const method = req.method;
  const path = parsed.pathname;

  if (path === '/api/v1/health' && method === 'GET') {
    return json(res, { status: 'UP' });
  }

  if (path === '/api/v1/logs' && method === 'GET') {
    return json(res, { logs: sampleLogs.slice(0, 20) });
  }

  if (path === '/api/v1/incidents' && method === 'GET') {
    return json(res, { incidents: sampleIncidents });
  }

  if (path.startsWith('/api/v1/incidents/') && path.endsWith('/resolve') && method === 'POST') {
    const id = parseInt(path.split('/')[4]);
    const idx = sampleIncidents.findIndex(i => i.id === id);
    if (idx >= 0) sampleIncidents[idx].status = 'resolved';
    return json(res, { ok: true });
  }

  if (path === '/api/v1/login' && method === 'POST') {
    // simple mock login: accept any body and return a token
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      return json(res, { token: 'mock-jwt-token', expiresInDays: 7 });
    });
    return;
  }

  // fallback for other API routes
  if (path.startsWith('/api/')) {
    return json(res, { message: 'mock response' });
  }

  // non-API requests
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Mock API listening on http://localhost:${PORT}`);
});
