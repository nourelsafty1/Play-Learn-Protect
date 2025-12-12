// src/routes/children.js

const express = require('express');
const router = express.Router();
const {
  createChild,
  getMyChildren,
  getChild,
  updateChild,
  updateChildSettings,
  addPoints,
  getChildDashboard,
  deleteChild,
  addTeacher
} = require('../controllers/childController');
const { protect, authorize, checkChildOwnership } = require('../middleware/auth');
const {
  validateCreateChild,
  validateUpdateChildSettings,
  validateObjectId,
  validate
} = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// Create child and get all children for logged in user
router.route('/')
  .post(
    authorize('parent', 'teacher', 'admin'),
    validateCreateChild,
    validate,
    createChild
  )
  .get(getMyChildren);

// Get child dashboard
router.get(
  '/:id/dashboard',
  validateObjectId,
  validate,
  checkChildOwnership,
  getChildDashboard
);

// Update child settings (parent only)
router.put(
  '/:id/settings',
  validateObjectId,
  validateUpdateChildSettings,
  validate,
  authorize('parent', 'admin'),
  updateChildSettings
);

// Add points to child
router.post(
  '/:id/points',
  validateObjectId,
  validate,
  checkChildOwnership,
  addPoints
);

// Add teacher to child
router.post(
  '/:id/teachers',
  validateObjectId,
  validate,
  authorize('parent', 'admin'),
  addTeacher
);

// Get, update, delete child
router.route('/:id')
  .get(validateObjectId, validate, getChild)
  .put(
    validateObjectId,
    validate,
    authorize('parent', 'admin'),
    updateChild
  )
  .delete(
    validateObjectId,
    validate,
    authorize('parent', 'admin'),
    deleteChild
  );

module.exports = router;