/**
 * API client for LEAP Monitoring Platform Dashboard
 * Handles all HTTP requests with auth, retry logic, and error handling
 */

const API_TIMEOUT = 10000; // 10s timeout
const MAX_RETRIES = 2;

export class APIClient {
  constructor() {
    this.baseURL = typeof window !== 'undefined' ? '/api' : '';
  }

  getAuthToken() {
    if (typeof window === 'undefined') return null;
    try {
      const token = localStorage.getItem('jwt_token');
      return token || null;
    } catch {
      return null;
    }
  }

  async request(endpoint, options = {}) {
    const { method = 'GET', body = null, retry = MAX_RETRIES } = options;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseURL}${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
        signal: controller.signal,
        ...options.fetchOptions,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - clear token and redirect
          if (typeof window !== 'undefined') {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('current_user');
            window.location.href = '/login';
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      if (retry > 0 && error.name === 'AbortError') {
        // Retry on timeout
        return this.request(endpoint, { ...options, retry: retry - 1 });
      }
      console.error(`API Error [${method} ${endpoint}]:`, error);
      return { success: false, error: error.message };
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // API logs endpoints
  async getApiLogs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.service) params.append('service', filters.service);
    if (filters.endpoint) params.append('endpoint', filters.endpoint);
    if (filters.statusCode) params.append('statusCode', filters.statusCode);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    return this.request(`/logs?${params.toString()}`);
  }

  async getSlowApis(threshold = 500) {
    return this.request(`/logs/slow?threshold=${threshold}`);
  }

  async getBrokenApis() {
    return this.request('/logs/broken');
  }

  async getRateLimitViolations() {
    return this.request('/logs/rate-limit');
  }

  // Metrics endpoints
  async getMetrics() {
    return this.request('/metrics');
  }

  async getLatencyPerEndpoint() {
    return this.request('/metrics/latency');
  }

  async getErrorRateGraph(period = '7d') {
    return this.request(`/metrics/error-rate?period=${period}`);
  }

  async getTopSlowEndpoints(limit = 5) {
    return this.request(`/metrics/top-slow?limit=${limit}`);
  }

  // Alerts endpoints
  async getAlerts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.resolved !== undefined) params.append('resolved', filters.resolved);

    return this.request(`/alerts?${params.toString()}`);
  }

  async acknowledgeAlert(alertId) {
    return this.request(`/alerts/${alertId}/acknowledge`, { method: 'POST' });
  }

  // Issue management endpoints
  async markIssueResolved(issueId) {
    return this.request(`/issues/${issueId}/resolve`, {
      method: 'POST',
      body: { resolvedAt: new Date().toISOString() },
    });
  }

  async getIssues(resolved = false) {
    return this.request(`/issues?resolved=${resolved}`);
  }
}

export const apiClient = new APIClient();
