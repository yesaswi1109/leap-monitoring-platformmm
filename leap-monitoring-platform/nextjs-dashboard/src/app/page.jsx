import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Icons from Lucide for a professional look
import { Gauge, Zap, TrendingDown, Clock, CheckCircle } from 'lucide-react';

// --- CONFIGURATION ---
// This URL must match your Central Collector Service (Port 8080)
const API_BASE_URL = 'http://localhost:8080/api/v1';
const MOCK_USER_ID = 'dev-yesaswi-123';
const MOCK_TOKEN = 'mock-jwt-token-abc123'; // Placeholder for JWT Auth requirement

/**
 * Custom hook for fetching data from the Collector API with state management.
 */
const useDataFetcher = (endpoint, dependencies = []) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // NOTE: We pass the MOCK_TOKEN in the Authorization header to satisfy the JWT Auth requirement
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${MOCK_TOKEN}`, // Satisfies JWT requirement
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      setData(json);
    } catch (e) {
      setError(e.message);
      console.error(`Error fetching ${endpoint}:`, e);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Fetch data and refresh every 10 seconds for real-time feel
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
};


// --- UTILITY COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition duration-300 hover:shadow-xl">
    <div className={`flex items-center space-x-4 p-2 rounded-full ${color} bg-opacity-10 w-fit`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <h3 className="mt-4 text-sm font-medium text-gray-500">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

const Badge = ({ children, status }) => {
  let classes = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  switch (status) {
    case 'SLOW':
      classes += " bg-yellow-100 text-yellow-800";
      break;
    case 'ERROR':
      classes += " bg-red-100 text-red-800";
      break;
    case 'RATE_LIMIT':
      classes += " bg-purple-100 text-purple-800";
      break;
    case 200:
    case 201:
      classes += " bg-green-100 text-green-800";
      break;
    case 500:
    case 503:
      classes += " bg-red-100 text-red-800";
      break;
    default:
      classes += " bg-gray-100 text-gray-800";
  }
  return <span className={classes}>{children}</span>;
};

// --- WIDGETS (Section B: Dashboard Widgets) ---

const DashboardWidgets = ({ logs }) => {
  const { slowCount, brokenCount, rateLimitCount, avgLatency } = useMemo(() => {
    if (logs.length === 0) return { slowCount: 0, brokenCount: 0, rateLimitCount: 0, avgLatency: 0 };

    const totalLatency = logs.reduce((sum, log) => sum + log.latencyMs, 0);
    // Filters based on assignment requirements (Latency > 500ms, Status 5xx, Rate Limit Hit)
    const slowCount = logs.filter(log => log.latencyMs > 500).length;
    const brokenCount = logs.filter(log => log.statusCode >= 500).length;
    const rateLimitCount = logs.filter(log => log.isRateLimitHit).length;
    const avgLatency = (totalLatency / logs.length).toFixed(2);

    return { slowCount, brokenCount, rateLimitCount, avgLatency };
  }, [logs]);

  // Calculate Top 5 Slow Endpoints
  const topSlowEndpoints = useMemo(() => {
    const endpointData = logs.reduce((acc, log) => {
      acc[log.endpoint] = acc[log.endpoint] || { totalLatency: 0, count: 0 };
      acc[log.endpoint].totalLatency += log.latencyMs;
      acc[log.endpoint].count += 1;
      return acc;
    }, {});

    return Object.entries(endpointData)
      .map(([endpoint, data]) => ({
        endpoint,
        avgLatency: (data.totalLatency / data.count).toFixed(2)
      }))
      .sort((a, b) => b.avgLatency - a.avgLatency)
      .slice(0, 5);
  }, [logs]);


  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-gray-800">Dashboard Analytics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Avg Latency (ms)" value={avgLatency} icon={Gauge} color="text-indigo-500" />
        <StatCard title="Slow API Count" value={slowCount} icon={TrendingDown} color="text-yellow-500" />
        <StatCard title="Broken API Count (5xx)" value={brokenCount} icon={Zap} color="text-red-500" />
        <StatCard title="Rate Limit Violations" value={rateLimitCount} icon={Clock} color="text-purple-500" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-medium text-gray-800 mb-4">Top 5 Slow Endpoints</h3>
        <ul className="divide-y divide-gray-200">
          {topSlowEndpoints.map((item, index) => (
            <li key={item.endpoint} className="py-3 flex justify-between items-center">
              <span className="text-gray-700">{index + 1}. {item.endpoint}</span>
              <Badge status={'SLOW'}>{item.avgLatency} ms</Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// --- ISSUE MANAGEMENT (Section C: Issue Management) ---

const IssueManagement = ({ incidents, refreshIncidents }) => {
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async (id) => {
    setIsResolving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/incidents/${id}/resolve?userId=${MOCK_USER_ID}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${MOCK_TOKEN}` },
      });

      if (!response.ok) {
        // Catches concurrency failures (Optimistic Locking) and other errors
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to resolve incident. Check if it was resolved concurrently.');
      }
      refreshIncidents();
      alert('Incident successfully marked as RESOLVED.');
    } catch (error) {
      console.error('Resolution Error:', error.message);
      alert(`Resolution Failed: ${error.message}`); 
    } finally {
      setIsResolving(false);
    }
  };

  if (incidents.length === 0) {
    return (
        <div className="bg-green-50 p-6 rounded-xl shadow-md border border-green-200">
            <p className="font-semibold text-green-700 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                No Open Incidents! All systems operating nominally.
            </p>
        </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Open Alerts & Issues</h2>
      <div className="space-y-4">
        {incidents.map(incident => (
          <div key={incident.id} className="p-4 border border-red-200 bg-red-50 rounded-lg flex justify-between items-start">
            <div>
              <p className="text-lg font-bold text-gray-800 flex items-center">
                <Badge status={incident.severity}>{incident.severity}</Badge>
                <span className='ml-2 text-red-800'>{incident.serviceName}</span>
              </p>
              <p className="text-sm text-gray-700 mt-1">Endpoint: <code className='bg-gray-100 p-1 rounded text-xs'>{incident.endpoint}</code></p>
              <p className="text-sm text-gray-600 mt-1 font-medium">{incident.description}</p>
              <p className="text-xs text-gray-500 mt-2">Occurred At: {new Date(incident.occurredAt).toLocaleString()}</p>
            </div>
            <button
              onClick={() => handleResolve(incident.id)}
              disabled={isResolving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-150 disabled:opacity-50 text-sm"
            >
              {isResolving ? 'Resolving...' : 'Mark Resolved'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- REQUEST EXPLORER (Section A: API Request Explorer) ---

const RequestExplorer = ({ logs }) => {
  const [filter, setFilter] = useState({
    service: '',
    statusType: 'ALL', 
  });

  const uniqueServices = useMemo(() => {
    const services = logs.map(log => log.serviceName);
    return [...new Set(services)].sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Filter 1: Service Name
      if (filter.service && log.serviceName !== filter.service) return false;

      // Filter 2: Status Type
      switch (filter.statusType) {
        case 'SLOW':
          return log.latencyMs > 500;
        case 'BROKEN':
          return log.statusCode >= 500 && log.statusCode <= 599;
        case 'RATE_LIMIT':
          return log.isRateLimitHit;
        case 'ALL':
        default:
          return true;
      }
    });
  }, [logs, filter]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">API Request Explorer</h2>

      {/* Filters (Service and Status Type) */}
      <div className="bg-white p-4 rounded-xl shadow-lg flex flex-wrap gap-4 items-center">
        <label className="text-sm font-medium text-gray-700">Service:</label>
        <select
          value={filter.service}
          onChange={(e) => setFilter(prev => ({ ...prev, service: e.target.value }))}
          className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Services</option>
          {uniqueServices.map(service => (
            <option key={service} value={service}>{service}</option>
          ))}
        </select>

        <label className="text-sm font-medium text-gray-700">Status Type:</label>
        <select
          value={filter.statusType}
          onChange={(e) => setFilter(prev => ({ ...prev, statusType: e.target.value }))}
          className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="ALL">All Requests</option>
          <option value="SLOW">Slow APIs (&gt; 500ms)</option>
          <option value="BROKEN">Broken APIs (5xx)</option>
          <option value="RATE_LIMIT">Rate-Limit Hits</option>
        </select>

        <span className="text-sm text-gray-600 ml-auto">
          Showing {filteredLogs.length} of {logs.length} Total Logs
        </span>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <tr key={log.id} className={log.statusCode >= 500 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {log.serviceName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className='font-semibold mr-1 text-gray-700'>{log.requestMethod}</span> {log.endpoint}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Badge status={log.statusCode}>{log.statusCode}</Badge>
                  {log.isRateLimitHit && <Badge status="RATE_LIMIT" >Rate Limit Hit</Badge>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={log.latencyMs > 500 ? 'text-red-600 font-bold' : 'text-gray-700'}>
                    {log.latencyMs} ms
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- AUTH/ROOT COMPONENT (Handles JWT Login Placeholder) ---

const LoginPage = ({ onLogin }) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Leap Monitoring Login</h2>
            <p className='text-sm text-gray-500 text-center mb-6'>JWT Authentication Placeholder</p>
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Username (e.g., dev-yesaswi-123)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    defaultValue={MOCK_USER_ID}
                />
                <input
                    type="password"
                    placeholder="Password (Mock)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    defaultValue="password"
                />
                <button
                    onClick={onLogin}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md transition duration-150"
                >
                    Login
                </button>
            </div>
            <p className="mt-6 text-center text-sm text-gray-500">
                Using mock user <code className='text-indigo-600'>{MOCK_USER_ID}</code> for API calls.
            </p>
        </div>
    </div>
);

const DashboardContent = () => {
  const { data: logs, isLoading: logsLoading, error: logsError } = useDataFetcher('logs');
  const { data: incidents, isLoading: incidentsLoading, error: incidentsError, refresh: refreshIncidents } = useDataFetcher('incidents/open');

  if (logsLoading || incidentsLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-medium text-indigo-600">
        Loading Observability Data...
      </div>
    );
  }

  if (logsError || incidentsError) {
    return (
        <div className="p-10 bg-red-100 border border-red-400 rounded-lg m-10">
            <h2 className="text-xl font-bold text-red-800">Error Connecting to Collector Backend</h2>
            <p className="text-red-700 mt-2">Please ensure the Central Collector Service is running on `http://localhost:8080` and MongoDB is running.</p>
            <p className="text-sm text-red-600 mt-1">Logs Error: {logsError || 'N/A'}</p>
            <p className="text-sm text-red-600">Incidents Error: {incidentsError || 'N/A'}</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <header className="mb-10 border-b pb-4">
        <h1 className="text-4xl font-extrabold text-gray-900">Leap API Observability Platform</h1>
        <p className="text-gray-500 mt-1">Logged in as: <span className="font-semibold text-indigo-600">{MOCK_USER_ID}</span></p>
      </header>

      <main className="space-y-12">
        <DashboardWidgets logs={logs} />
        <IssueManagement incidents={incidents} refreshIncidents={refreshIncidents} />
        <RequestExplorer logs={logs} />
      </main>

      <footer className="mt-12 text-center text-sm text-gray-500 pt-6 border-t">
        Developed by {MOCK_USER_ID} for the Leap Assignment.
      </footer>
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(true);
  }, []);

  return isLoggedIn ? <DashboardContent /> : <LoginPage onLogin={() => setIsLoggedIn(true)} />;
}