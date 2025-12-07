/**
 * Simple email-based authentication system
 * Users can set their own password on first login
 * Passwords stored in localStorage (for demo purposes)
 */

const AUTH_STORAGE_KEY = 'leap_auth_users';
const CURRENT_USER_KEY = 'leap_current_user';
const JWT_TOKEN_KEY = 'leap_jwt_token';

/**
 * Initialize default test users (60 users for recruitment demo)
 */
const initializeDefaultUsers = () => {
  if (typeof window === 'undefined') return;
  
  const existing = localStorage.getItem(AUTH_STORAGE_KEY);
  if (existing) return;

  // Create 60 test users
  const users = {};
  for (let i = 1; i <= 60; i++) {
    users[`user${i}@leapmonitoring.com`] = {
      email: `user${i}@leapmonitoring.com`,
      passwordHash: btoa(`password${i}`), // Simple base64 hash for demo
      name: `Test User ${i}`,
      createdAt: new Date().toISOString(),
      isFirstLogin: true
    };
  }

  // Add demo users
  users['demo@leapmonitoring.com'] = {
    email: 'demo@leapmonitoring.com',
    passwordHash: btoa('demo123'),
    name: 'Demo User',
    createdAt: new Date().toISOString(),
    isFirstLogin: false
  };

  users['admin@leapmonitoring.com'] = {
    email: 'admin@leapmonitoring.com',
    passwordHash: btoa('admin123'),
    name: 'Admin User',
    createdAt: new Date().toISOString(),
    isFirstLogin: false
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
};

/**
 * Hash a password (simple for demo - use proper hashing in production)
 */
const hashPassword = (password) => {
  return btoa(password);
};

/**
 * Register a new user (for first-time setup)
 */
export const registerUser = (email, password, name = '') => {
  if (typeof window === 'undefined') return { success: false, error: 'Server-side call' };

  initializeDefaultUsers();

  const usersJson = localStorage.getItem(AUTH_STORAGE_KEY) || '{}';
  const users = JSON.parse(usersJson);

  if (users[email]) {
    return { success: false, error: 'User already exists' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  users[email] = {
    email,
    passwordHash: hashPassword(password),
    name: name || email.split('@')[0],
    createdAt: new Date().toISOString(),
    isFirstLogin: false
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
  return { success: true, message: 'User registered successfully' };
};

/**
 * Login user
 */
export const loginUser = (email, password) => {
  if (typeof window === 'undefined') return { success: false, error: 'Server-side call' };

  initializeDefaultUsers();

  const usersJson = localStorage.getItem(AUTH_STORAGE_KEY) || '{}';
  const users = JSON.parse(usersJson);

  const user = users[email];
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.passwordHash !== hashPassword(password)) {
    return { success: false, error: 'Invalid password' };
  }

  // Generate a simple JWT-like token
  const token = btoa(JSON.stringify({
    email: email,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  }));

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  localStorage.setItem(JWT_TOKEN_KEY, token);

  return { success: true, user, token };
};

/**
 * Set password for first-time users (email already exists)
 */
export const setPasswordForUser = (email, newPassword) => {
  if (typeof window === 'undefined') return { success: false, error: 'Server-side call' };

  initializeDefaultUsers();

  const usersJson = localStorage.getItem(AUTH_STORAGE_KEY) || '{}';
  const users = JSON.parse(usersJson);

  const user = users[email];
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  // Update password
  users[email].passwordHash = hashPassword(newPassword);
  users[email].isFirstLogin = false;

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));

  return { success: true, message: 'Password set successfully. Please log in.' };
};

/**
 * Check if user is first-time login
 */
export const isFirstTimeLogin = (email) => {
  if (typeof window === 'undefined') return false;

  initializeDefaultUsers();

  const usersJson = localStorage.getItem(AUTH_STORAGE_KEY) || '{}';
  const users = JSON.parse(usersJson);

  return users[email]?.isFirstLogin || false;
};

/**
 * Get current logged-in user
 */
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;

  const userJson = localStorage.getItem(CURRENT_USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

/**
 * Get current JWT token
 */
export const getJWTToken = () => {
  if (typeof window === 'undefined') return null;

  return localStorage.getItem(JWT_TOKEN_KEY);
};

/**
 * Logout user
 */
export const logoutUser = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(JWT_TOKEN_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem(JWT_TOKEN_KEY);
  const user = localStorage.getItem(CURRENT_USER_KEY);

  if (!token || !user) return false;

  // Check if token is expired
  try {
    const decoded = JSON.parse(atob(token));
    if (decoded.exp && decoded.exp < Date.now()) {
      logoutUser();
      return false;
    }
  } catch (e) {
    logoutUser();
    return false;
  }

  return true;
};

/**
 * Initialize auth on app startup
 */
export const initializeAuth = () => {
  if (typeof window !== 'undefined') {
    initializeDefaultUsers();
  }
};
