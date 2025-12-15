// src/middleware/validation.js

const { body, param, query, validationResult } = require('express-validator');

// Helper function to check validation results
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Validation rules for user registration
exports.validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('role')
    .optional()
    .isIn(['parent', 'teacher', 'admin'])
    .withMessage('Role must be parent, teacher, or admin')
];

// Validation rules for user login
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation rules for creating a child
exports.validateCreateChild = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Child name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      const age = Math.floor((Date.now() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 3 || age > 12) {
        throw new Error('Child must be between 3 and 12 years old');
      }
      return true;
    }),

  body('ageGroup')
    .notEmpty()
    .withMessage('Age group is required')
    .isIn(['3-5', '6-8', '9-12'])
    .withMessage('Age group must be 3-5, 6-8, or 9-12'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other')
];

// Validation rules for updating child settings
exports.validateUpdateChildSettings = [
  body('dailyScreenTimeLimit')
    .optional()
    .isInt({ min: 0, max: 480 })
    .withMessage('Screen time limit must be between 0 and 480 minutes (8 hours)'),

  body('contentFilterLevel')
    .optional()
    .isIn(['strict', 'moderate', 'minimal'])
    .withMessage('Content filter level must be strict, moderate, or minimal'),

  body('language')
    .optional()
    .isIn(['en', 'ar'])
    .withMessage('Language must be en or ar')
];

// Validation rules for creating a game
exports.validateCreateGame = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Game title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Game description is required'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['math', 'science', 'language', 'coding', 'physics', 'chemistry', 'creative', 'social', 'memory', 'logic'])
    .withMessage('Invalid category'),

  body('type')
    .notEmpty()
    .withMessage('Game type is required')
    .isIn(['serious', 'creative', 'casual'])
    .withMessage('Type must be serious, creative, or casual'),

  body('ageGroups')
    .isArray({ min: 1 })
    .withMessage('At least one age group is required')
    .custom((value) => {
      const validAgeGroups = ['3-5', '6-8', '9-12'];
      return value.every(age => validAgeGroups.includes(age));
    })
    .withMessage('Invalid age group'),

  body('gameUrl')
    .trim()
    .notEmpty()
    .withMessage('Game URL is required')
    .isURL()
    .withMessage('Please provide a valid URL'),

  body('thumbnail')
    .trim()
    .notEmpty()
    .withMessage('Thumbnail is required')
];

// Validation rules for MongoDB ObjectId
exports.validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// Validation rules for pagination
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Validation for progress updates
exports.validateProgressUpdate = [
  body('score')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100'),

  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a positive number'),

  body('status')
    .optional()
    .isIn(['not-started', 'in-progress', 'completed'])
    .withMessage('Invalid status')
];

// Validation for session tracking
exports.validateSessionStart = [
  body('childId')
    .notEmpty()
    .withMessage('Child ID is required')
    .isMongoId()
    .withMessage('Invalid child ID format'),

  body('deviceType')
    .optional()
    .isIn(['mobile', 'tablet', 'desktop'])
    .withMessage('Device type must be mobile, tablet, or desktop')
];

// Validation for content flagging
exports.validateContentFlag = [
  body('childId')
    .notEmpty()
    .withMessage('Child ID is required')
    .isMongoId()
    .withMessage('Invalid child ID'),

  body('contentType')
    .notEmpty()
    .withMessage('Content type is required')
    .isIn(['game', 'learning-module', 'user-generated', 'external-link', 'chat-message'])
    .withMessage('Invalid content type'),

  body('flagReason')
    .notEmpty()
    .withMessage('Flag reason is required')
    .isIn([
      'inappropriate-language',
      'violence',
      'cyberbullying',
      'explicit-content',
      'suspicious-link',
      'personal-info-request',
      'age-inappropriate',
      'misleading-content',
      'other'
    ])
    .withMessage('Invalid flag reason'),

  body('contentDescription')
    .trim()
    .notEmpty()
    .withMessage('Content description is required')
];

// Validation for rating/feedback
exports.validateRating = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Feedback cannot exceed 500 characters')
];

// Validation for Child ID parameter
exports.validateChildId = [
  param('childId')
    .isMongoId()
    .withMessage('Invalid child ID format')
];

// Validation for Progress parameters involved in completion
exports.validateProgressParams = [
  param('moduleId')
    .optional()
    .isMongoId()
    .withMessage('Invalid module ID format'),
  param('childId')
    .optional()
    .isMongoId()
    .withMessage('Invalid child ID format'),
  param('lessonNumber')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Lesson number must be a positive integer')
];