/**
 * API Request Explorer - Table with filtering and pagination
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { apiClient } from '../lib/api';

function StatusBadge({ status }) {
  const statusCode = parseInt(status);
  let color = 'gray';
  if (statusCode >= 200 && statusCode < 300) color = 'green';
  else if (statusCode >= 400 && statusCode < 500) color = 'yellow';
  else if (statusCode >= 500) color = 'red';

  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${colorClasses[color]}`}>
      {status}
    </span>
  );
}

function LatencyBadge({ latency }) {
  const ms = parseInt(latency);
  let color = 'green';
  if (ms > 500) color = 'red';
  else if (ms > 200) color = 'yellow';

  const colorClasses = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  return <span className={`font-semibold ${colorClasses[color]}`}>{ms}ms</span>;
}

export function APIExplorer() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  // Filters
  const [filters, setFilters] = useState({
    service: '',
    endpoint: '',
    statusCode: '',
    slowOnly: false,
    brokenOnly: false,
  });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await apiClient.getApiLogs();
        if (response.success) {
          setLogs(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (filters.service) {
      filtered = filtered.filter((log) =>
        log.service?.toLowerCase().includes(filters.service.toLowerCase())
      );
    }

    if (filters.endpoint) {
      filtered = filtered.filter((log) =>
        log.endpoint?.toLowerCase().includes(filters.endpoint.toLowerCase())
      );
    }

    if (filters.statusCode) {
      filtered = filtered.filter((log) => log.statusCode?.toString() === filters.statusCode);
    }

    if (filters.slowOnly) {
      filtered = filtered.filter((log) => parseInt(log.latency) > 500);
    }

    if (filters.brokenOnly) {
      filtered = filtered.filter((log) => parseInt(log.statusCode) >= 500);
    }

    setFilteredLogs(filtered);
    setPage(1);
  }, [logs, filters]);

  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API Request Explorer</h1>
        <p className="text-gray-500 mt-1">Browse and filter all API logs</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Name
            </label>
            <input
              type="text"
              placeholder="e.g., auth-service"
              value={filters.service}
              onChange={(e) => handleFilterChange('service', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endpoint
            </label>
            <input
              type="text"
              placeholder="e.g., /api/users"
              value={filters.endpoint}
              onChange={(e) => handleFilterChange('endpoint', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Code
            </label>
            <select
              value={filters.statusCode}
              onChange={(e) => handleFilterChange('statusCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All</option>
              <option value="200">200</option>
              <option value="400">400</option>
              <option value="500">500</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => handleFilterChange('slowOnly', !filters.slowOnly)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.slowOnly
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Slow Only
            </button>
            <button
              onClick={() => handleFilterChange('brokenOnly', !filters.brokenOnly)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.brokenOnly
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Broken Only
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Latency
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                      {log.service || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700 font-mono">
                      {log.endpoint || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <StatusBadge status={log.statusCode || '—'} />
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <LatencyBadge latency={log.latency || 0} />
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No API logs found matching the filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {paginatedLogs.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(page * pageSize, filteredLogs.length)} of {filteredLogs.length}
            </p>
            <div className="space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
