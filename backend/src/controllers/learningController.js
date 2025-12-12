// src/controllers/learningController.js

const LearningModule = require('../models/LearningModule');
const Progress = require('../models/Progress');
const Child = require('../models/Child');

// @desc    Get all learning modules
// @route   GET /api/learning
// @access  Public
exports.getAllModules = async (req, res, next) => {
  try {
    const {
      subject,
      ageGroup,
      difficulty,
      search,
      page = 1,
      limit = 20,
      sort = '-enrollmentCount'
    } = req.query;

    // Build query
    const query = { isActive: true, isPublished: true };

    if (subject) query.subject = subject;
    if (ageGroup) query.ageGroups = ageGroup;
    if (difficulty) query.difficulty = difficulty;

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query
    const modules = await LearningModule.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const count = await LearningModule.countDocuments(query);

    res.status(200).json({
      success: true,
      count: modules.length,
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      data: modules
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single learning module
// @route   GET /api/learning/:id
// @access  Public
exports.getModule = async (req, res, next) => {
  try {
    const module = await LearningModule.findById(req.params.id)
      .populate('prerequisites', 'title thumbnail')
      .populate('relatedGames', 'title thumbnail')
      .populate('relatedModules', 'title thumbnail');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Learning module not found'
      });
    }

    // Get user progress if logged in
    let userProgress = null;
    if (req.user && req.query.childId) {
      userProgress = await Progress.findOne({
        child: req.query.childId,
        learningModule: module._id
      });
    }

    res.status(200).json({
      success: true,
      data: module,
      userProgress: userProgress
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Create learning module
// @route   POST /api/learning
// @access  Private (Admin/Teacher)
exports.createModule = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;

    const module = await LearningModule.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Learning module created successfully',
      data: module
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update learning module
// @route   PUT /api/learning/:id
// @access  Private (Admin/Creator)
exports.updateModule = async (req, res, next) => {
  try {
    let module = await LearningModule.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Learning module not found'
      });
    }

    // Check authorization
    if (module.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this module'
      });
    }

    module = await LearningModule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Module updated successfully',
      data: module
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete learning module
// @route   DELETE /api/learning/:id
// @access  Private (Admin only)
exports.deleteModule = async (req, res, next) => {
  try {
    const module = await LearningModule.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Learning module not found'
      });
    }

    // Soft delete
    module.isActive = false;
    await module.save();

    res.status(200).json({
      success: true,
      message: 'Module deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Enroll in a module
// @route   POST /api/learning/:id/enroll
// @access  Private
exports.enrollModule = async (req, res, next) => {
  try {
    const { childId } = req.body;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: 'Child ID is required'
      });
    }

    const module = await LearningModule.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check if already enrolled
    const existingProgress = await Progress.findOne({
      child: childId,
      learningModule: module._id
    });

    if (existingProgress) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this module'
      });
    }

    // Create progress record
    const progress = await Progress.create({
      child: childId,
      contentType: 'learning-module',
      learningModule: module._id,
      status: 'in-progress'
    });

    // Increment enrollment count
    await module.incrementEnrollment();

    // Update child's streak
    const child = await Child.findById(childId);
    if (child) {
      child.updateStreak();
      await child.save();
    }

    res.status(200).json({
      success: true,
      message: 'Enrolled successfully',
      data: progress
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Complete a lesson
// @route   POST /api/learning/:id/lessons/:lessonNumber/complete
// @access  Private
exports.completeLesson = async (req, res, next) => {
  try {
    const { childId, score, timeSpent } = req.body;
    const { id, lessonNumber } = req.params;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: 'Child ID is required'
      });
    }

    const module = await LearningModule.findById(id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Find or create progress
    let progress = await Progress.findOne({
      child: childId,
      learningModule: module._id
    });

    if (!progress) {
      progress = await Progress.create({
        child: childId,
        contentType: 'learning-module',
        learningModule: module._id,
        status: 'in-progress'
      });
    }

    // Add lesson completion
    const lessonExists = progress.lessonsCompleted.some(
      l => l.lessonNumber === parseInt(lessonNumber)
    );

    if (!lessonExists) {
      progress.lessonsCompleted.push({
        lessonNumber: parseInt(lessonNumber),
        completedAt: Date.now(),
        score: score || 0
      });

      // Award points
      const pointsEarned = module.pointsPerLesson || 50;
      progress.pointsEarned += pointsEarned;

      // Add points to child
      const child = await Child.findById(childId);
      if (child) {
        child.addPoints(pointsEarned);
        await child.save();
      }
    }

    // Update time spent
    if (timeSpent) {
      progress.addTimeSpent(timeSpent);
    }

    // Update current lesson
    progress.currentLesson = parseInt(lessonNumber) + 1;

    // Calculate completion
    progress.calculateCompletion();

    await progress.save();

    // Check for achievements
    const gamification = require('../utils/gamification');
    const newAchievements = await gamification.checkAchievements(childId);

    res.status(200).json({
      success: true,
      message: 'Lesson completed successfully',
      data: {
        progress: progress,
        pointsEarned: module.pointsPerLesson || 50,
        newAchievements: newAchievements
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz
// @route   POST /api/learning/:id/quiz
// @access  Private
exports.submitQuiz = async (req, res, next) => {
  try {
    const { childId, answers } = req.body;

    if (!childId || !answers) {
      return res.status(400).json({
        success: false,
        message: 'Child ID and answers are required'
      });
    }

    const module = await LearningModule.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    if (!module.hasQuiz || module.quizQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This module does not have a quiz'
      });
    }

    // Grade the quiz
    let correctAnswers = 0;
    const results = [];

    module.quizQuestions.forEach((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;

      if (isCorrect) correctAnswers++;

      results.push({
        questionNumber: index + 1,
        correct: isCorrect,
        userAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      });
    });

    const score = Math.round((correctAnswers / module.quizQuestions.length) * 100);
    const passed = score >= module.passingScore;

    // Find progress
    let progress = await Progress.findOne({
      child: childId,
      learningModule: module._id
    });

    if (!progress) {
      progress = await Progress.create({
        child: childId,
        contentType: 'learning-module',
        learningModule: module._id,
        status: 'in-progress'
      });
    }

    // Add quiz attempt
    const attemptNumber = progress.quizAttempts.length + 1;

    progress.quizAttempts.push({
      attemptNumber: attemptNumber,
      score: score,
      totalQuestions: module.quizQuestions.length,
      correctAnswers: correctAnswers,
      completedAt: Date.now(),
      passed: passed
    });

    // Update best score
    if (score > progress.bestScore) {
      progress.bestScore = score;
    }

    // If passed, mark module as completed
    if (passed) {
      progress.status = 'completed';
      progress.completedAt = Date.now();

      // Award completion points
      const pointsEarned = module.completionPoints || 200;
      progress.pointsEarned += pointsEarned;

      // Add points to child
      const child = await Child.findById(childId);
      if (child) {
        child.addPoints(pointsEarned);
        child.completedLessons.push({
          lesson: module._id,
          completedAt: Date.now(),
          score: score
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
      message: passed ? 'Quiz passed! Congratulations!' : 'Quiz completed. Try again to improve your score.',
      data: {
        score: score,
        passed: passed,
        correctAnswers: correctAnswers,
        totalQuestions: module.quizQuestions.length,
        passingScore: module.passingScore,
        results: results,
        attemptNumber: attemptNumber,
        pointsEarned: passed ? (module.completionPoints || 200) : 0,
        newAchievements: newAchievements
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get modules by subject
// @route   GET /api/learning/subject/:subject
// @access  Public
exports.getModulesBySubject = async (req, res, next) => {
  try {
    const { subject } = req.params;
    const { ageGroup, limit = 10 } = req.query;

    const query = {
      subject,
      isActive: true,
      isPublished: true
    };

    if (ageGroup) {
      query.ageGroups = ageGroup;
    }

    const modules = await LearningModule.find(query)
      .sort('-averageRating')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: modules.length,
      data: modules
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Rate a module
// @route   POST /api/learning/:id/rate
// @access  Private
exports.rateModule = async (req, res, next) => {
  try {
    const { rating, feedback, childId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const module = await LearningModule.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Add rating
    await module.addRating(rating);

    // Update progress record
    if (childId) {
      await Progress.findOneAndUpdate(
        { child: childId, learningModule: module._id },
        { 
          childRating: rating,
          childFeedback: feedback 
        },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Rating added successfully',
      data: {
        averageRating: module.averageRating,
        totalRatings: module.totalRatings
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = exports;