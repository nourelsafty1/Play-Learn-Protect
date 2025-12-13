// src/routes/progress.js

const express = require('express');
const router = express.Router();
const {
  getChildProgress,
  getProgress,
  updateProgress,
  getLeaderboard,
  getChildRank,
  getSubjectProgress,
  getChildAchievements,
  completeLesson,
  getModuleProgress
} = require('../controllers/progressController');
const { protect, checkChildOwnership } = require('../middleware/auth');
const {
  validateObjectId,
  validateProgressUpdate,
  validate
} = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// Get leaderboard (public to authenticated users)
router.get('/leaderboard', getLeaderboard);

// Child-specific progress routes
router.get(
  '/child/:childId',
  validateObjectId,
  validate,
  checkChildOwnership,
  getChildProgress
);

router.get(
  '/child/:childId/rank',
  validateObjectId,
  validate,
  checkChildOwnership,
  getChildRank
);

router.get(
  '/child/:childId/subjects',
  validateObjectId,
  validate,
  checkChildOwnership,
  getSubjectProgress
);

router.get(
  '/child/:childId/achievements',
  validateObjectId,
  validate,
  checkChildOwnership,
  getChildAchievements
);

// Module progress routes
router.get(
  '/child/:childId/module/:moduleId',
  validateObjectId,
  validate,
  checkChildOwnership,
  getModuleProgress
);

// Complete lesson route
router.post(
  '/module/:moduleId/child/:childId/lesson/:lessonNumber/complete',
  validateObjectId,
  validate,
  checkChildOwnership,
  completeLesson
);

// Single progress record routes
router.get(
  '/:progressId',
  validateObjectId,
  validate,
  getProgress
);

router.put(
  '/:progressId',
  validateObjectId,
  validateProgressUpdate,
  validate,
  updateProgress
);

module.exports = router;