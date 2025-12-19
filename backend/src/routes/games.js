// src/routes/games.js

const express = require('express');
const router = express.Router();
const {
  getAllGames,
  getGame,
  createGame,
  updateGame,
  deleteGame,
  getGamesByCategory,
  getFeaturedGames,
  rateGame,
  startGame,
  completeGame
} = require('../controllers/gameController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const {
  validateCreateGame,
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
  getAllGames
);

router.get('/featured', optionalAuth, getFeaturedGames);

router.get(
  '/category/:category',
  optionalAuth,
  getGamesByCategory
);

router.get(
  '/:id',
  validateObjectId,
  validate,
  optionalAuth,
  getGame
);

// Protected routes
router.use(protect);

// Start playing a game
router.post(
  '/:id/start',
  validateObjectId,
  validate,
  startGame
);

// Complete a game and submit score
router.post(
  '/:id/complete',
  validateObjectId,
  validate,
  completeGame
);

// Rate a game
router.post(
  '/:id/rate',
  validateObjectId,
  validateRating,
  validate,
  rateGame
);

// Admin/Teacher only routes
router.post(
  '/',
  authorize('admin', 'teacher'),
  validateCreateGame,
  validate,
  createGame
);

router.put(
  '/:id',
  validateObjectId,
  validate,
  authorize('admin', 'teacher'),
  updateGame
);

router.delete(
  '/:id',
  validateObjectId,
  validate,
  authorize('admin'),
  deleteGame
);

module.exports = router;