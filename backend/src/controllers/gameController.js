// src/controllers/gameController.js

const Game = require('../models/Game');
const Progress = require('../models/Progress');
const Child = require('../models/Child');
const crypto = require('crypto');

// @desc    Get all games
// @route   GET /api/games
// @access  Public
exports.getAllGames = async (req, res, next) => {
  try {
    // Query parameters for filtering
    const {
      category,
      ageGroup,
      difficulty,
      type,
      search,
      page = 1,
      limit = 20,
      sort = '-playCount'
    } = req.query;

    // Build query
    const query = { isActive: true, isPublished: true };

    if (category) query.category = category;
    if (ageGroup) query.ageGroups = ageGroup;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;

    // Search by title or description
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const games = await Game.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    // Get total count
    const count = await Game.countDocuments(query);

    res.status(200).json({
      success: true,
      count: games.length,
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      data: games
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single game
// @route   GET /api/games/:id
// @access  Public
exports.getGame = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // If user is logged in, get their progress
    let userProgress = null;
    if (req.user && req.query.childId) {
      userProgress = await Progress.findOne({
        child: req.query.childId,
        game: game._id
      });
    }

    res.status(200).json({
      success: true,
      data: game,
      userProgress: userProgress
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Create new game
// @route   POST /api/games
// @access  Private (Admin/Teacher)
exports.createGame = async (req, res, next) => {
  try {
    // Add user as creator
    req.body.createdBy = req.user._id;

    const game = await Game.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      data: game
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update game
// @route   PUT /api/games/:id
// @access  Private (Admin/Creator)
exports.updateGame = async (req, res, next) => {
  try {
    let game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Check if user is creator or admin
    if (game.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this game'
      });
    }

    game = await Game.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Game updated successfully',
      data: game
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete game
// @route   DELETE /api/games/:id
// @access  Private (Admin only)
exports.deleteGame = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Soft delete
    game.isActive = false;
    await game.save();

    res.status(200).json({
      success: true,
      message: 'Game deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get games by category
// @route   GET /api/games/category/:category
// @access  Public
exports.getGamesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { ageGroup, limit = 10 } = req.query;

    const query = {
      category,
      isActive: true,
      isPublished: true
    };

    if (ageGroup) {
      query.ageGroups = ageGroup;
    }

    const games = await Game.find(query)
      .sort('-averageRating')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: games.length,
      data: games
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get featured games
// @route   GET /api/games/featured
// @access  Public
exports.getFeaturedGames = async (req, res, next) => {
  try {
    const { ageGroup } = req.query;

    const query = {
      isFeatured: true,
      isActive: true,
      isPublished: true
    };

    if (ageGroup) {
      query.ageGroups = ageGroup;
    }

    const games = await Game.find(query)
      .sort('-playCount')
      .limit(10);

    res.status(200).json({
      success: true,
      count: games.length,
      data: games
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Rate a game
// @route   POST /api/games/:id/rate
// @access  Private
exports.rateGame = async (req, res, next) => {
  try {
    const { rating, childId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Add rating
    await game.addRating(rating);

    // Update progress record
    if (childId) {
      await Progress.findOneAndUpdate(
        { child: childId, game: game._id },
        { childRating: rating },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Rating added successfully',
      data: {
        averageRating: game.averageRating,
        totalRatings: game.totalRatings
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Start playing a game (track start)
// @route   POST /api/games/:id/start
// @access  Private
exports.startGame = async (req, res, next) => {
  try {
    const { childId } = req.body;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: 'Child ID is required'
      });
    }

    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // increment play count
    await game.incrementPlayCount();

    // generate a new session ID for THIS play session
    const sessionId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

    // create a NEW progress entry per session
    const progress = await Progress.create({
      child: childId,
      contentType: 'game',
      game: game._id,
      sessionId,                 
      status: 'in-progress',
      attempts: 1,
      startedAt: new Date(),
      lastAccessedAt: new Date()
    });

    // update child's streak
    const child = await Child.findById(childId);
    if (child) {
      child.updateStreak();
      await child.save();
    }

    res.status(200).json({
      success: true,
      message: 'Game started',
      data: {
        gameId: game._id,
        progressId: progress._id,
        sessionId               
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Complete a game and submit score
// @route   POST /api/games/:id/complete
// @access  Private
exports.completeGame = async (req, res, next) => {
  try {
    const { childId, score, timeSpent, level, completed, sessionId } = req.body;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: 'Child ID is required'
      });
    }

    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Find or create progress entry
    let progress = await Progress.findOne({
      child: childId,
      game: game._id,
      sessionId: sessionId || null
    });

    if (!progress) {
      // Create new progress if not found
      progress = await Progress.create({
        child: childId,
        contentType: 'game',
        game: game._id,
        sessionId: sessionId || null,
        status: 'in-progress',
        startedAt: new Date()
      });
    }

    // Update progress with score and completion
    progress.score = score || 0;
    progress.timeSpent = timeSpent || 0;
    progress.lastAccessedAt = new Date();

    if (level) {
      progress.currentLevel = level;
      if (!progress.levelsCompleted.some(l => l.levelNumber === level)) {
        progress.levelsCompleted.push({
          levelNumber: level,
          completedAt: new Date(),
          score: score || 0
        });
      }
    }

    // Update best score
    if (score && score > progress.bestScore) {
      progress.bestScore = score;
    }

    // If completed, mark as completed and award points
    if (completed) {
      progress.status = 'completed';
      progress.completedAt = new Date();

      // Calculate points earned
      const basePoints = game.pointsPerCompletion || 100;
      const bonusPoints = score >= 80 ? (game.bonusPoints || 50) : 0;
      const pointsEarned = basePoints + bonusPoints;
      progress.pointsEarned = pointsEarned;

      // Add points to child
      const child = await Child.findById(childId);
      if (child) {
        child.addPoints(pointsEarned);
        child.completedGames.push({
          game: game._id,
          completedAt: new Date(),
          score: score || 0
        });
        await child.save();
      }
    }

    await progress.save();

    // Check for achievements
    const gamification = require('../utils/gamification');
    const newAchievements = await gamification.checkAchievements(childId);

    res.status(200).json({
      success: true,
      message: 'Game progress updated',
      data: {
        progress: progress,
        pointsEarned: completed ? (game.pointsPerCompletion || 100) + (score >= 80 ? (game.bonusPoints || 50) : 0) : 0,
        achievements: newAchievements
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = exports;