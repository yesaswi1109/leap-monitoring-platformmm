'use client';

import React, { useState, useEffect } from 'react';
import { Menu, LogOut, Home, Search, AlertCircle, CheckSquare } from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { DashboardHome } from './components/DashboardHome';
import { APIExplorer } from './components/APIExplorer';
import { AlertsViewer } from './components/AlertsViewer';
import { IssueManagement } from './components/IssueManagement';

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Initialize auth on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('current_user');
        const token = localStorage.getItem('jwt_token');
        if (userStr && token) {
          setCurrentUser(JSON.parse(userStr));
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('current_user');
    }
    setCurrentUser(null);
    setCurrentPage('home');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Main dashboard layout
  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'explorer', label: 'API Explorer', icon: Search },
    { id: 'alerts', label: 'Alerts', icon: AlertCircle },
    { id: 'issues', label: 'Issues', icon: CheckSquare },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 shadow-sm transition-all duration-300`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && <h1 className="text-xl font-bold text-blue-600">LEAP</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 shadow-sm px-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {navItems.find((i) => i.id === currentPage)?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-700">
                  {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden sm:inline">{currentUser?.email}</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {currentPage === 'home' && <DashboardHome user={currentUser} />}
          {currentPage === 'explorer' && <APIExplorer />}
          {currentPage === 'alerts' && <AlertsViewer />}
          {currentPage === 'issues' && <IssueManagement />}
        </div>
      </div>
    </div>
  );
}
