import axios from 'axios';

// Generate or get session ID for guest users
const getSessionId = () => {
  let sessionId = localStorage.getItem('guest_session_id');
  if (!sessionId) {
    sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('guest_session_id', sessionId);
  }
  return sessionId;
};

// Create axios instance with default configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5050/api',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token or session ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // For guest users, add session ID
      const sessionId = getSessionId();
      config.headers['X-Session-ID'] = sessionId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - clear token and session, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('guest_session_id');
        window.location.href = '/login';
      }
      
      // Return error data for component handling
      return Promise.reject(data.error || error);
    } else if (error.request) {
      // Request made but no response received
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
      });
    } else {
      // Something else happened
      return Promise.reject({
        code: 'UNKNOWN_ERROR',
        message: error.message
      });
    }
  }
);

// Export utility functions
export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('guest_session_id');
};

export { getSessionId };

export default api;
