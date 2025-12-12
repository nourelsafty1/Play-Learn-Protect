// src/routes/learning.js

const express = require('express');
const router = express.Router();
const {
  getAllModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
  enrollModule,
  completeLesson,
  submitQuiz,
  getModulesBySubject,
  rateModule
} = require('../controllers/learningController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const {
  validateObjectId,
  validatePagination,
  validateRating,
  validate
} = require('../middleware/validation');

// Public routes (with optional authentication)
router.get(
  '/',
  validatePagination,
  validate,
  optionalAuth,
  getAllModules
);

router.get(
  '/subject/:subject',
  optionalAuth,
  getModulesBySubject
);

router.get(
  '/:id',
  validateObjectId,
  validate,
  optionalAuth,
  getModule
);

// Protected routes
router.use(protect);

// Enroll in module
router.post(
  '/:id/enroll',
  validateObjectId,
  validate,
  enrollModule
);

// Complete a lesson
router.post(
  '/:id/lessons/:lessonNumber/complete',
  validateObjectId,
  validate,
  completeLesson
);

// Submit quiz
router.post(
  '/:id/quiz',
  validateObjectId,
  validate,
  submitQuiz
);

// Rate module
router.post(
  '/:id/rate',
  validateObjectId,
  validateRating,
  validate,
  rateModule
);

// Admin/Teacher only routes
router.post(
  '/',
  authorize('admin', 'teacher'),
  createModule
);

router.put(
  '/:id',
  validateObjectId,
  validate,
  authorize('admin', 'teacher'),
  updateModule
);

router.delete(
  '/:id',
  validateObjectId,
  validate,
  authorize('admin'),
  deleteModule
);

module.exports = router;