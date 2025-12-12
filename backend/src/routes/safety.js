// src/routes/safety.js

const express = require('express');
const router = express.Router();
const {
  getChildAlerts,
  getAlert,
  viewAlert,
  resolveAlert,
  acknowledgeAlert,
  createAlert,
  getContentFlags,
  getContentFlag,
  reviewContentFlag,
  reportContent,
  analyzeText,
  getRiskScore,
  getSafetyDashboard,
  getAlertStatistics
} = require('../controllers/safetyController');
const { protect, authorize, checkChildOwnership } = require('../middleware/auth');
const {
  validateObjectId,
  validateContentFlag,
  validate
} = require('../middleware/validation');
const { filterRequestContent } = require('../middleware/contentFilter');

// All routes require authentication
router.use(protect);

// Alert routes
router.get(
  '/child/:childId/alerts',
  validateObjectId,
  validate,
  checkChildOwnership,
  getChildAlerts
);

router.get(
  '/alerts/:id',
  validateObjectId,
  validate,
  getAlert
);

router.put(
  '/alerts/:id/view',
  validateObjectId,
  validate,
  viewAlert
);

router.put(
  '/alerts/:id/resolve',
  validateObjectId,
  validate,
  authorize('parent', 'teacher', 'admin'),
  resolveAlert
);

router.put(
  '/alerts/:id/acknowledge',
  validateObjectId,
  validate,
  acknowledgeAlert
);

router.post(
  '/alerts',
  authorize('parent', 'teacher', 'admin'),
  createAlert
);

// Content flag routes
router.get(
  '/child/:childId/flags',
  validateObjectId,
  validate,
  checkChildOwnership,
  getContentFlags
);

router.get(
  '/flags/:id',
  validateObjectId,
  validate,
  getContentFlag
);

router.put(
  '/flags/:id/review',
  validateObjectId,
  validate,
  authorize('admin', 'teacher'),
  reviewContentFlag
);

router.post(
  '/flags',
  validateContentFlag,
  validate,
  reportContent
);

// Safety analysis
router.post(
  '/analyze-text',
  filterRequestContent,
  analyzeText
);

router.get(
  '/child/:childId/risk-score',
  validateObjectId,
  validate,
  checkChildOwnership,
  getRiskScore
);

router.get(
  '/child/:childId/dashboard',
  validateObjectId,
  validate,
  checkChildOwnership,
  getSafetyDashboard
);

// Admin only - statistics
router.get(
  '/statistics',
  authorize('admin'),
  getAlertStatistics
);

module.exports = router;