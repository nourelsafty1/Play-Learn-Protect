// src/services/api.js

import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response (backend not running or network error)
      console.error('API Error: No response from server. Is backend running?', error.request);
    } else {
      // Error setting up request
      console.error('API Error:', error.message);
    }
    
    // If unauthorized, redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Don't redirect if we're already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ======================
// AUTH API CALLS
// ======================

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/updatedetails', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
  logout: () => api.post('/auth/logout')
};

// ======================
// CHILDREN API CALLS
// ======================

export const childrenAPI = {
  create: (childData) => api.post('/children', childData),
  getAll: () => api.get('/children'),
  getOne: (id) => api.get(`/children/${id}`),
  update: (id, data) => api.put(`/children/${id}`, data),
  updateSettings: (id, settings) => api.put(`/children/${id}/settings`, settings),
  delete: (id) => api.delete(`/children/${id}`),
  getDashboard: (id) => api.get(`/children/${id}/dashboard`),
  addPoints: (id, points) => api.post(`/children/${id}/points`, points),
  addTeacher: (id, teacherEmail) => api.post(`/children/${id}/teachers`, { teacherEmail })
};

// ======================
// GAMES API CALLS
// ======================

export const gamesAPI = {
  getAll: (params) => api.get('/games', { params }),
  getOne: (id, childId) => api.get(`/games/${id}`, { params: { childId } }),
  getFeatured: (ageGroup) => api.get('/games/featured', { params: { ageGroup } }),
  getByCategory: (category, ageGroup) => api.get(`/games/category/${category}`, { params: { ageGroup } }),
  start: (id, childId) => api.post(`/games/${id}/start`, { childId }),
  complete: (id, data) => api.post(`/games/${id}/complete`, data),
  rate: (id, rating, childId) => api.post(`/games/${id}/rate`, { rating, childId }),
  create: (gameData) => api.post('/games', gameData),
  update: (id, gameData) => api.put(`/games/${id}`, gameData),
  delete: (id) => api.delete(`/games/${id}`)
};

// ======================
// LEARNING API CALLS
// ======================

export const learningAPI = {
  getAll: (params) => api.get('/learning', { params }),
  getOne: (id, childId) => api.get(`/learning/${id}`, { params: { childId } }),
  getBySubject: (subject, ageGroup) => api.get(`/learning/subject/${subject}`, { params: { ageGroup } }),
  enroll: (id, childId) => api.post(`/learning/${id}/enroll`, { childId }),
  completeLesson: (id, lessonNumber, data) => api.post(`/learning/${id}/lessons/${lessonNumber}/complete`, data),
  submitQuiz: (id, childId, answers) => api.post(`/learning/${id}/quiz`, { childId, answers }),
  rate: (id, rating, childId, feedback) => api.post(`/learning/${id}/rate`, { rating, childId, feedback }),
  create: (moduleData) => api.post('/learning', moduleData),
  update: (id, moduleData) => api.put(`/learning/${id}`, moduleData),
  delete: (id) => api.delete(`/learning/${id}`)
};

// ======================
// PROGRESS API CALLS
// ======================

export const progressAPI = {
  getChildProgress: (childId) => api.get(`/progress/child/${childId}`),
  getModuleProgress: (childId, moduleId) => api.get(`/progress/child/${childId}/module/${moduleId}`),
  completeLesson: (moduleId, childId, lessonNumber, data = {}) => 
    api.post(`/progress/module/${moduleId}/child/${childId}/lesson/${lessonNumber}/complete`, data),
  getLeaderboard: (type, period, ageGroup) => api.get('/progress/leaderboard', { params: { type, period, ageGroup } }),
  getChildRank: (childId, period) => api.get(`/progress/child/${childId}/rank`, { params: { period } }),
  getSubjectProgress: (childId) => api.get(`/progress/child/${childId}/subjects`),
  getAchievements: (childId) => api.get(`/progress/child/${childId}/achievements`),
  updateProgress: (progressId, data) => api.put(`/progress/${progressId}`, data)
};

// ======================
// MONITORING API CALLS
// ======================

export const monitoringAPI = {
  getDashboard: () => api.get('/monitoring/dashboard'),
  startSession: (childId, deviceType) => api.post('/monitoring/sessions/start', { childId, deviceType }),
  endSession: (sessionId) => api.post(`/monitoring/sessions/${sessionId}/end`),
  addActivity: (sessionId, activityData) => api.post(`/monitoring/sessions/${sessionId}/activity`, activityData),
  getScreenTime: (childId, period) => api.get(`/monitoring/child/${childId}/screentime`, { params: { period } }),
  getLearningAnalytics: (childId, period) => api.get(`/monitoring/child/${childId}/learning`, { params: { period } }),
  getSafetyAnalytics: (childId, period) => api.get(`/monitoring/child/${childId}/safety`, { params: { period } }),
  getWeeklyReport: (childId) => api.get(`/monitoring/child/${childId}/report/weekly`),
  getSessions: (childId, params) => api.get(`/monitoring/child/${childId}/sessions`, { params }),
  detectPatterns: (childId) => api.get(`/monitoring/child/${childId}/patterns`)
};

// ======================
// SAFETY API CALLS
// ======================

export const safetyAPI = {
  getAlerts: (childId, params) => api.get(`/safety/child/${childId}/alerts`, { params }),
  getAlert: (id) => api.get(`/safety/alerts/${id}`),
  viewAlert: (id) => api.put(`/safety/alerts/${id}/view`),
  resolveAlert: (id, data) => api.put(`/safety/alerts/${id}/resolve`, data),
  acknowledgeAlert: (id) => api.put(`/safety/alerts/${id}/acknowledge`),
  getFlags: (childId, params) => api.get(`/safety/child/${childId}/flags`, { params }),
  reportContent: (data) => api.post('/safety/flags', data),
  analyzeText: (text, childId, sessionId) => api.post('/safety/analyze-text', { text, childId, sessionId }),
  getRiskScore: (childId) => api.get(`/safety/child/${childId}/risk-score`),
  getSafetyDashboard: (childId) => api.get(`/safety/child/${childId}/dashboard`)
};

export default api;