/**
 * Alerts Viewer - Display triggered alerts from monitoring system
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { apiClient } from '../lib/api';

function AlertTypeIcon({ type }) {
  const icons = {
    latency: <Clock className="w-5 h-5 text-yellow-600" />,
    error: <AlertTriangle className="w-5 h-5 text-red-600" />,
    'rate-limit': <Zap className="w-5 h-5 text-orange-600" />,
  };
  return icons[type] || <AlertTriangle className="w-5 h-5 text-gray-600" />;
}

function AlertCard({ alert, onAcknowledge }) {
  const [acknowledging, setAcknowledging] = useState(false);

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      await apiClient.acknowledgeAlert(alert.id);
      onAcknowledge(alert.id);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    } finally {
      setAcknowledging(false);
    }
  };

  const typeLabels = {
    latency: 'High Latency',
    error: 'Error Rate',
    'rate-limit': 'Rate Limit',
  };

  const severityColors = {
    critical: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className={`rounded-lg border p-4 ${severityColors[alert.severity] || 'bg-gray-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">{AlertTypeIcon({ type: alert.type })}</div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">
              {typeLabels[alert.type] || alert.type}
            </h4>
            <p className="text-sm text-gray-600 mt-1">{alert.message || alert.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span>Service: {alert.service || '—'}</span>
              <span>Endpoint: {alert.endpoint || '—'}</span>
              {alert.value && <span>Value: {alert.value}</span>}
              <span>{new Date(alert.triggeredAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {!alert.acknowledged && (
          <button
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="ml-4 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {acknowledging ? 'Acknowledging...' : 'Acknowledge'}
          </button>
        )}

        {alert.acknowledged && (
          <div className="ml-4 flex items-center gap-1 text-xs text-green-700">
            <CheckCircle className="w-4 h-4" />
            Acknowledged
          </div>
        )}
      </div>
    </div>
  );
}

export function AlertsViewer() {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unacknowledged'); // unacknowledged, all

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await apiClient.getAlerts({ resolved: false });
        if (response.success) {
          setAlerts(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    // Refresh every 15 seconds
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = alerts;

    if (filter === 'unacknowledged') {
      filtered = filtered.filter((a) => !a.acknowledged);
    }

    setFilteredAlerts(filtered);
  }, [alerts, filter]);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

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
        <h1 className="text-2xl font-bold text-gray-900">Alerts & Incidents</h1>
        <p className="text-gray-500 mt-1">
          Monitor triggered alerts from your API services
        </p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Alerts</p>
          <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Unacknowledged</p>
          <p className="text-2xl font-bold text-yellow-600">{unacknowledgedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Critical</p>
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('unacknowledged')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === 'unacknowledged'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Unacknowledged ({unacknowledgedCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Alerts
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={(id) => {
                setAlerts((prev) =>
                  prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
                );
              }}
            />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center border border-gray-200">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-gray-600">No {filter === 'unacknowledged' ? 'unacknowledged' : ''} alerts</p>
          </div>
        )}
      </div>
    </div>
  );
}
