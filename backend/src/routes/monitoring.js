// src/routes/monitoring.js

const express = require('express');
const router = express.Router();
const {
  startSession,
  endSession,
  addActivity,
  getScreenTimeAnalytics,
  getLearningAnalytics,
  getSafetyAnalytics,
  getWeeklyReport,
  getChildSessions,
  detectUnusualPatterns,
  getMonitoringDashboard
} = require('../controllers/monitoringController');
const { protect, checkChildOwnership } = require('../middleware/auth');
const {
  validateObjectId,
  validateSessionStart,
  validate
} = require('../middleware/validation');
const { checkScreenTimeLimit } = require('../middleware/contentFilter');

// All routes require authentication
router.use(protect);

// Get monitoring dashboard
router.get('/dashboard', getMonitoringDashboard);

// Session management
router.post(
  '/sessions/start',
  validateSessionStart,
  validate,
  checkScreenTimeLimit,
  startSession
);

router.post(
  '/sessions/:sessionId/end',
  validateObjectId,
  validate,
  endSession
);

router.post(
  '/sessions/:sessionId/activity',
  validateObjectId,
  validate,
  addActivity
);

// Child-specific monitoring routes
router.get(
  '/child/:childId/screentime',
  validateObjectId,
  validate,
  checkChildOwnership,
  getScreenTimeAnalytics
);

router.get(
  '/child/:childId/learning',
  validateObjectId,
  validate,
  checkChildOwnership,
  getLearningAnalytics
);

router.get(
  '/child/:childId/safety',
  validateObjectId,
  validate,
  checkChildOwnership,
  getSafetyAnalytics
);

router.get(
  '/child/:childId/report/weekly',
  validateObjectId,
  validate,
  checkChildOwnership,
  getWeeklyReport
);

router.get(
  '/child/:childId/sessions',
  validateObjectId,
  validate,
  checkChildOwnership,
  getChildSessions
);

router.get(
  '/child/:childId/patterns',
  validateObjectId,
  validate,
  checkChildOwnership,
  detectUnusualPatterns
);

module.exports = router;