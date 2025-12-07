/**
 * Dashboard Home - Main metrics and overview widgets
 */

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  TrendingDown,
  Activity,
  Zap,
  BarChart3,
  Clock,
} from 'lucide-react';
import { apiClient } from '../lib/api';

function MetricWidget({ icon: Icon, label, value, change, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <p className={`text-xs mt-2 ${change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% this week
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function TopEndpointsWidget({ endpoints = [] }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
        Top 5 Slow Endpoints
      </h3>
      <div className="space-y-3">
        {endpoints.length > 0 ? (
          endpoints.map((ep, idx) => (
            <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-b-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{ep.endpoint}</p>
                <p className="text-xs text-gray-500">{ep.service}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-600">{ep.avgLatency}ms</p>
                <p className="text-xs text-gray-500">{ep.count} calls</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm">No slow endpoints detected</p>
        )}
      </div>
    </div>
  );
}

function ErrorRateWidget({ data = [] }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
        Error Rate (7 days)
      </h3>
      <div className="space-y-2">
        {data.length > 0 ? (
          data.map((day, idx) => (
            <div key={idx} className="flex items-center">
              <span className="text-xs text-gray-500 w-12">{day.date}</span>
              <div className="flex-1 mx-2 bg-gray-200 rounded h-4">
                <div
                  className="bg-red-500 h-4 rounded"
                  style={{ width: `${day.errorRate}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-12 text-right">
                {day.errorRate.toFixed(1)}%
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm">No error data available</p>
        )}
      </div>
    </div>
  );
}

export function DashboardHome({ user }) {
  const [metrics, setMetrics] = useState({
    slowCount: 0,
    brokenCount: 0,
    rateLimitCount: 0,
    avgLatency: 0,
  });
  const [topEndpoints, setTopEndpoints] = useState([]);
  const [errorRate, setErrorRate] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all metrics in parallel
        const [slowRes, brokenRes, rateLimitRes, latencyRes, endpointsRes, errorRes] =
          await Promise.all([
            apiClient.getSlowApis(),
            apiClient.getBrokenApis(),
            apiClient.getRateLimitViolations(),
            apiClient.getLatencyPerEndpoint(),
            apiClient.getTopSlowEndpoints(5),
            apiClient.getErrorRateGraph('7d'),
          ]);

        if (slowRes.success) {
          setMetrics((prev) => ({
            ...prev,
            slowCount: slowRes.data?.length || 0,
          }));
        }

        if (brokenRes.success) {
          setMetrics((prev) => ({
            ...prev,
            brokenCount: brokenRes.data?.length || 0,
          }));
        }

        if (rateLimitRes.success) {
          setMetrics((prev) => ({
            ...prev,
            rateLimitCount: rateLimitRes.data?.length || 0,
          }));
        }

        if (latencyRes.success && Array.isArray(latencyRes.data)) {
          const avgLatency = latencyRes.data.reduce((sum, ep) => sum + ep.latency, 0) /
            (latencyRes.data.length || 1);
          setMetrics((prev) => ({
            ...prev,
            avgLatency: Math.round(avgLatency),
          }));
        }

        if (endpointsRes.success) {
          setTopEndpoints(endpointsRes.data || []);
        }

        if (errorRes.success) {
          setErrorRate(errorRes.data || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

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
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.email || 'User'}
        </h1>
        <p className="text-gray-500 mt-1">Real-time API monitoring and incident tracking</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricWidget
          icon={TrendingDown}
          label="Slow API Count"
          value={metrics.slowCount}
          change={12}
          color="yellow"
        />
        <MetricWidget
          icon={AlertCircle}
          label="Broken API Count"
          value={metrics.brokenCount}
          change={-5}
          color="red"
        />
        <MetricWidget
          icon={Zap}
          label="Rate-Limit Violations"
          value={metrics.rateLimitCount}
          change={8}
          color="orange"
        />
        <MetricWidget
          icon={Clock}
          label="Avg Latency"
          value={`${metrics.avgLatency}ms`}
          change={3}
          color="blue"
        />
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopEndpointsWidget endpoints={topEndpoints} />
        <ErrorRateWidget data={errorRate} />
      </div>
    </div>
  );
}
