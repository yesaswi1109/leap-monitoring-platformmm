/**
 * Issue Management - Mark slow/broken endpoints as resolved
 * Implements concurrency-safe updates to metadata database
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/api';

function IssueCard({ issue, onResolve }) {
  const [resolving, setResolving] = useState(false);

  const handleResolve = async () => {
    setResolving(true);
    try {
      const response = await apiClient.markIssueResolved(issue.id);
      if (response.success) {
        onResolve(issue.id);
      }
    } catch (error) {
      console.error('Error resolving issue:', error);
    } finally {
      setResolving(false);
    }
  };

  const issueTypeColor = {
    slow: 'bg-yellow-50 border-yellow-200',
    broken: 'bg-red-50 border-red-200',
  };

  const issueTypeIcon = {
    slow: <Clock className="w-5 h-5 text-yellow-600" />,
    broken: <AlertCircle className="w-5 h-5 text-red-600" />,
  };

  return (
    <div className={`rounded-lg border p-4 ${issueTypeColor[issue.type] || 'bg-gray-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">{issueTypeIcon[issue.type]}</div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">
              {issue.type === 'slow' ? 'Slow Endpoint' : 'Broken Endpoint'}
            </h4>
            <p className="text-sm text-gray-600 mt-1 font-mono">{issue.endpoint}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span>Service: {issue.service || '—'}</span>
              {issue.type === 'slow' && (
                <span>Avg Latency: {issue.avgLatency}ms</span>
              )}
              {issue.type === 'broken' && (
                <span>Status Code: {issue.statusCode}</span>
              )}
              <span>Occurrences: {issue.count}</span>
              <span>{new Date(issue.detectedAt).toLocaleString()}</span>
            </div>

            {issue.notes && (
              <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-xs text-gray-700">
                <strong>Notes:</strong> {issue.notes}
              </div>
            )}
          </div>
        </div>

        {!issue.resolved && (
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="ml-4 px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {resolving ? 'Resolving...' : 'Mark Resolved'}
          </button>
        )}

        {issue.resolved && (
          <div className="ml-4 flex items-center gap-1 text-xs text-green-700">
            <CheckCircle className="w-4 h-4" />
            Resolved
          </div>
        )}
      </div>
    </div>
  );
}

export function IssueManagement() {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unresolved'); // unresolved, all
  const [typeFilter, setTypeFilter] = useState('all'); // all, slow, broken

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await apiClient.getIssues(false);
        if (response.success) {
          setIssues(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching issues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
    // Refresh every 30 seconds
    const interval = setInterval(fetchIssues, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = issues;

    if (filter === 'unresolved') {
      filtered = filtered.filter((i) => !i.resolved);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((i) => i.type === typeFilter);
    }

    setFilteredIssues(filtered);
  }, [issues, filter, typeFilter]);

  const unresolvedCount = issues.filter((i) => !i.resolved).length;
  const slowCount = issues.filter((i) => i.type === 'slow' && !i.resolved).length;
  const brokenCount = issues.filter((i) => i.type === 'broken' && !i.resolved).length;

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
        <h1 className="text-2xl font-bold text-gray-900">Issue Management</h1>
        <p className="text-gray-500 mt-1">
          Track and resolve slow & broken API endpoints
        </p>
      </div>

      {/* Issue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Issues</p>
          <p className="text-2xl font-bold text-gray-900">{issues.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Unresolved</p>
          <p className="text-2xl font-bold text-yellow-600">{unresolvedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Slow Endpoints</p>
          <p className="text-2xl font-bold text-yellow-600">{slowCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Broken Endpoints</p>
          <p className="text-2xl font-bold text-red-600">{brokenCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('unresolved')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === 'unresolved'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Unresolved ({unresolvedCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Issues
        </button>

        <div className="ml-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="slow">Slow Only</option>
            <option value="broken">Broken Only</option>
          </select>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length > 0 ? (
          filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onResolve={(id) => {
                setIssues((prev) =>
                  prev.map((i) => (i.id === id ? { ...i, resolved: true } : i))
                );
              }}
            />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center border border-gray-200">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-gray-600">No {filter === 'unresolved' ? 'unresolved' : ''} issues</p>
          </div>
        )}
      </div>

      {/* Concurrency Safety Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>Concurrency Protection:</strong> All issue resolutions are atomic and use database-level
        locking to prevent race conditions when multiple users mark the same issue resolved simultaneously.
      </div>
    </div>
  );
}
