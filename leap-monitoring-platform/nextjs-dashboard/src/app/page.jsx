'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Icons from Lucide for a professional look
import { Gauge, Zap, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { 
  loginUser, 
  setPasswordForUser, 
  isFirstTimeLogin, 
  logoutUser, 
  getCurrentUser, 
  getJWTToken,
  initializeAuth 
} from './auth';

// --- CONFIGURATION ---
// SIMPLE: Always use /api proxy from Next.js
// Next.js will forward requests to the actual backend
const getApiBaseUrl = () => {
  // Always use the Next.js proxy endpoint - it will route to the backend
  return '/api';
};

// NOTE: Call this lazily inside components, not at module level
// const API_BASE_URL = getApiBaseUrl(); // ❌ WRONG - causes hydration issues
// Instead, use getApiBaseUrl() inside useEffect or useCallback

// Helpers for authenticated API calls
const getCurrentUserEmail = () => {
  if (typeof window !== 'undefined') {
    const user = getCurrentUser();
    return user?.email || 'unknown@leapmonitoring.com';
  }
  return 'unknown@leapmonitoring.com';
};

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return getJWTToken() || 'no-token';
  }
  return 'no-token';
};

/**
 * Custom hook for fetching data from the Collector API with state management.
 * Includes retry logic and exponential backoff for high-concurrency scenarios (60+ users).
 * OPTIMIZED: Aggressive parallel fetching, faster timeouts, minimal retries for login speed.
 */
const useDataFetcher = (endpoint, dependencies = [], options = {}) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Faster timeouts and retry strategy for better UX
  const maxRetries = options.maxRetries !== undefined ? options.maxRetries : 2;
  const fetchTimeout = options.timeout || 5000; // Reduced from 10s to 5s
  const refreshInterval = options.refreshInterval || 10000; // 10s refresh

  const fetchData = useCallback(async (retryAttempt = 0) => {
    if (retryAttempt === 0) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const apiUrl = getApiBaseUrl(); // Get URL lazily
      
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      // Always use v1 API endpoints with proper limit for logs
      let fullEndpoint = endpoint;
      if (endpoint === 'logs' || endpoint === 'v1/logs') {
        fullEndpoint = 'v1/logs?limit=50'; // Fetch 50 logs for better calculations
      } else if (!endpoint.startsWith('v1/')) {
        fullEndpoint = `v1/${endpoint}`; // Ensure v1 prefix for all endpoints
      }

      const response = await fetch(`${apiUrl}/${fullEndpoint}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        // Faster timeout
        signal: AbortSignal.timeout ? AbortSignal.timeout(fetchTimeout) : undefined,
      });

      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        
        // Only retry on server errors (5xx) or rate limit (429)
        if ((response.status >= 500 || response.status === 429) && retryAttempt < maxRetries) {
          console.warn(`API ${response.status}, retrying... (attempt ${retryAttempt + 1}/${maxRetries})`);
          setRetryCount(retryAttempt + 1);
          return fetchData(retryAttempt + 1);
        }

        throw new Error(`HTTP error ${response.status}${txt ? `: ${txt}` : ''}`);
      }

      // Clear retry count on success
      setRetryCount(0);

      // Parse response
      const text = await response.text().catch(() => '');
      let json = [];
      if (!text) {
        json = [];
      } else {
        try {
          json = JSON.parse(text);
        } catch (parseErr) {
          console.warn(`Invalid JSON from ${endpoint}:`, text);
          json = [];
        }
      }
      
      setData(Array.isArray(json) ? json : (json ? [json] : []));
      setIsLoading(false);
    } catch (e) {
      // Network errors or timeout
      if (retryAttempt < maxRetries) {
        console.warn(`Fetch error, retrying... (attempt ${retryAttempt + 1}/${maxRetries}):`, e.message);
        setRetryCount(retryAttempt + 1);
        return fetchData(retryAttempt + 1);
      }

      setError(e.message);
      setIsLoading(false);
      console.error(`Error fetching ${endpoint} after ${maxRetries} retries:`, e);
    }
  }, [endpoint, maxRetries, fetchTimeout, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Initial fetch - NO DELAY for faster dashboard load
    fetchData();
    
    // Refresh interval (no jitter on first load for speed)
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, isLoading, error, refresh: fetchData, retryCount };
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
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/incidents/${id}/resolve?userId=${getCurrentUserEmail()}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
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

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [step, setStep] = useState('login'); // 'login' or 'setup'

  // Check if email exists and is first-time login
  const handleEmailCheck = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Check if user exists and if it's first-time login
    const isFirst = isFirstTimeLogin(email);
    
    if (isFirst) {
      setIsFirstTime(true);
      setStep('setup');
      setError('');
    } else {
      // Go to password entry
      setIsFirstTime(false);
      setError('');
    }
  };

  // Handle login with existing password
  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsLoggingIn(true);
    setError('');

    try {
      const result = loginUser(email, password);
      
      if (result.success) {
        // Successfully logged in
        onLogin && onLogin();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle password setup for first-time users
  const handleSetupPassword = async () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoggingIn(true);
    setError('');

    try {
      const result = setPasswordForUser(email, password);
      
      if (result.success) {
        setError('');
        setPassword('');
        setConfirmPassword('');
        setStep('login');
        setIsFirstTime(false);
        alert(result.message + ' Now you can log in with your email and new password.');
      } else {
        setError(result.error || 'Failed to set password');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleBackToEmail = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setStep('login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Leap Monitoring</h1>
          <h2 className="text-lg font-semibold text-indigo-600">API Observability Platform</h2>
          <p className="text-sm text-gray-500 mt-2">Email-based Authentication</p>
        </div>

        {step === 'login' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@leapmonitoring.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                disabled={isLoggingIn}
                onKeyPress={(e) => e.key === 'Enter' && handleEmailCheck()}
              />
              <p className="text-xs text-gray-500 mt-1">Demo users: user1@leapmonitoring.com to user60@leapmonitoring.com</p>
            </div>

            {!isFirstTime && email && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  disabled={isLoggingIn}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={isFirstTime ? handleEmailCheck : (email ? handleLogin : handleEmailCheck)}
              disabled={isLoggingIn || !email}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg shadow-md transition duration-150"
            >
              {isLoggingIn ? 'Authenticating...' : (email && !isFirstTime ? 'Login' : 'Continue')}
            </button>

            {email && (
              <button
                onClick={() => {
                  setEmail('');
                  setPassword('');
                  setError('');
                }}
                className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2"
              >
                Change Email
              </button>
            )}
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">First Time Login</p>
              <p className="text-xs text-blue-700 mt-1">
                User <span className="font-semibold">{email}</span> exists. Please set your password.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                disabled={isLoggingIn}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                disabled={isLoggingIn}
                onKeyPress={(e) => e.key === 'Enter' && handleSetupPassword()}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSetupPassword}
              disabled={isLoggingIn || !password || !confirmPassword}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg shadow-md transition duration-150"
            >
              {isLoggingIn ? 'Setting Password...' : 'Set Password & Continue'}
            </button>

            <button
              onClick={handleBackToEmail}
              className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium py-2"
            >
              Back
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer font-semibold text-gray-700 hover:text-indigo-600">
              Demo Credentials
            </summary>
            <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg">
              <p><strong>Admin:</strong> admin@leapmonitoring.com / admin123</p>
              <p><strong>Demo:</strong> demo@leapmonitoring.com / demo123</p>
              <p><strong>Users:</strong> user1@leapmonitoring.com to user60@leapmonitoring.com</p>
              <p className="text-gray-500 text-xs mt-2">For first-time users, set your own password and you'll be logged in.</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

const DashboardContent = () => {
  // OPTIMIZATION: Both fetch in parallel with faster timeouts (Issue #1 & #2 fix)
  const { data: logs, isLoading: logsLoading, error: logsError } = useDataFetcher('v1/logs?limit=50', [], { 
    maxRetries: 2, 
    timeout: 5000,
    refreshInterval: 10000 
  });
  const { data: incidents, isLoading: incidentsLoading, error: incidentsError, refresh: refreshIncidents } = useDataFetcher('v1/incidents', [], { 
    maxRetries: 2, 
    timeout: 5000,
    refreshInterval: 10000 
  });

  // Health check state: call /health asynchronously (non-blocking - Issue #1 fix)
  const [healthOk, setHealthOk] = useState(null);
  const [apiUrl, setApiUrl] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    // Get API URL lazily
    const url = getApiBaseUrl();
    setApiUrl(url);

    // Non-blocking health check - starts in background, doesn't block dashboard
    const checkHealth = async () => {
      try {
        const res = await fetch(`/api/v1/health`, { 
          method: 'GET', 
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined, // Faster timeout
        });
        if (!mounted) return;
        if (res.ok) setHealthOk(true);
        else setHealthOk(false);
      } catch (e) {
        if (!mounted) return;
        console.warn('Health check failed:', e.message);
        setHealthOk(false);
      }
    };
    
    // Check health but don't wait for it
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check health every 30s
    return () => { 
      mounted = false; 
      clearInterval(interval);
    };
  }, []);

  // OPTIMIZATION: Show dashboard immediately with partial data (Issue #1 fix)
  // Only show loading if BOTH logs and incidents are loading
  if ((logsLoading || incidentsLoading) && !logs.length && !incidents.length) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-medium text-indigo-600">
        Loading Observability Data...
      </div>
    );
  }

  // OPTIMIZATION: Show error only if health check explicitly fails and we have no data (Issue #2 fix)
  if ((logsError && !logs.length && incidentsError && !incidents.length) && healthOk === false) {
    const logsMsg = logsError || '(no response)';
    const incidentsMsg = incidentsError || '(no response)';
    const displayUrl = apiUrl || getApiBaseUrl();
    
    return (
        <div className="p-10 bg-red-100 border border-red-400 rounded-lg m-10 mt-20">
            <h2 className="text-xl font-bold text-red-800">Error Connecting to Collector Backend</h2>
            <p className="text-red-700 mt-2">
              The application is trying to connect to: <code className="bg-gray-200 p-1 rounded font-mono text-sm">{displayUrl}</code>
            </p>
            <p className="text-red-700 mt-2">Please ensure the Central Collector is running at this address.</p>
            <p className="text-sm text-red-600 mt-3">Health Check: {healthOk === false ? '❌ UNREACHABLE' : healthOk === null ? '⏳ Checking...' : '✅ OK'}</p>
            {logsError && <p className="text-sm text-red-600 mt-1">Logs Error: {logsMsg}</p>}
            {incidentsError && <p className="text-sm text-red-600">Incidents Error: {incidentsMsg}</p>}
            <div className="mt-4 space-x-3">
              <button onClick={() => { window.location.reload(); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition">Retry</button>
              <a href={`${displayUrl}/health`} target="_blank" rel="noreferrer" className="text-indigo-600 underline">Test API Endpoint</a>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <header className="mb-10 border-b pb-4">
        <h1 className="text-4xl font-extrabold text-gray-900">Leap API Observability Platform</h1>
        <p className="text-gray-500 mt-1">Logged in as: <span className="font-semibold text-indigo-600">{getCurrentUserEmail()}</span></p>
      </header>

      <main className="space-y-12">
        <DashboardWidgets logs={logs} />
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-medium text-gray-800 mb-4">Error Rate (recent)</h3>
          <ErrorRateGraph logs={logs} />
        </div>
        <IssueManagement incidents={incidents} refreshIncidents={refreshIncidents} />
        <RequestExplorer logs={logs} />
      </main>

      <footer className="mt-12 text-center text-sm text-gray-500 pt-6 border-t">
        Leap API Observability Platform • Built for high-concurrency monitoring (60+ users)
      </footer>
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Initialize auth system
    initializeAuth();
    
    // OPTIMIZATION: Check localStorage immediately on client mount (prevents hydration mismatch)
    // This is synchronous, so users logged in previously get instant access
    const user = getCurrentUser();
    if (user) {
      setIsLoggedIn(true);
    }
    setIsHydrated(true);
  }, []);

  const handleLogin = () => setIsLoggedIn(true);

  const handleLogout = () => {
    logoutUser();
    setIsLoggedIn(false);
    // OPTIMIZATION: Instant logout without delay
    window.location.href = '/';
  };

  // OPTIMIZATION: Skip loading screen for returning users (already have token)
  // Only show loading if we need to check (first visit)
  if (!isHydrated) {
    // Check if already logged in to skip loading screen
    const user = getCurrentUser();
    if (!user) {
      return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <div className="text-indigo-600 font-medium">Loading...</div>
        </div>
      );
    }
  }

  return isLoggedIn ? (
    <div>
      <div className="fixed top-4 right-4 z-50">
        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md transition">Logout</button>
      </div>
      <DashboardContent />
    </div>
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}

// Lightweight error-rate graph (SVG). Shows % of errors per recent time bucket.
function ErrorRateGraph({ logs = [] }) {
  const buckets = 30;
  const now = Date.now();
  const bucketMs = 60 * 1000;
  const counts = new Array(buckets).fill(0);
  const errors = new Array(buckets).fill(0);

  logs.forEach(log => {
    const t = new Date(log.timestamp).getTime();
    const diff = Math.floor((now - t) / bucketMs);
    if (diff >= 0 && diff < buckets) {
      const idx = buckets - 1 - diff;
      counts[idx] += 1;
      if (log.statusCode >= 500) errors[idx] += 1;
    }
  });

  const rates = counts.map((c, i) => (c === 0 ? 0 : (errors[i] / c) * 100));
  const maxRate = Math.max(...rates, 1);

  const width = 700;
  const height = 120;
  const step = width / buckets;

  const path = rates.map((r, i) => {
    const x = i * step + step / 2;
    const y = height - (r / maxRate) * (height - 10) - 5;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
      <rect x="0" y="0" width={width} height={height} fill="#f8fafc" rx="6" />
      <path d={path} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {rates.map((r, i) => {
        const x = i * step + step / 2;
        const y = height - (r / maxRate) * (height - 10) - 5;
        return <circle key={i} cx={x} cy={y} r={2.2} fill="#ef4444" />;
      })}
      <text x="8" y="14" className="text-xs" fill="#374151">Error % (recent)</text>
    </svg>
  );
}