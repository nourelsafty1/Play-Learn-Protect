// src/models/Progress.js

const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  // Who
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
    index: true
  },

  // Session identifier - Optional for learning modules
  sessionId: {
    type: String,
    // required: true, // Removed to allow learning modules (no session)
    index: true
  },

  // Content type
  contentType: {
    type: String,
    enum: ['game', 'learning-module'],
    required: true
  },

  // Content references
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: function () {
      return this.contentType === 'game';
    }
  },

  learningModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningModule',
    required: function () {
      return this.contentType === 'learning-module';
    }
  },

  // Progress state
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },

  // Timestamps
  startedAt: {
    type: Date,
    default: Date.now
  },

  completedAt: {
    type: Date,
    default: null
  },

  lastAccessedAt: {
    type: Date,
    default: Date.now
  },

  // Performance
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  attempts: {
    type: Number,
    default: 1
  },

  bestScore: {
    type: Number,
    default: 0
  },

  timeSpent: {
    type: Number,
    default: 0
  },

  // Learning module progress
  lessonsCompleted: [{
    lessonNumber: Number,
    completedAt: Date,
    score: Number
  }],

  currentLesson: {
    type: Number,
    default: 1
  },

  // Game progress
  currentLevel: {
    type: Number,
    default: 1
  },

  levelsCompleted: [{
    levelNumber: Number,
    completedAt: Date,
    score: Number,
    stars: {
      type: Number,
      min: 1,
      max: 3
    }
  }],

  // Quiz attempts
  quizAttempts: [{
    attemptNumber: Number,
    score: Number,
    totalQuestions: Number,
    correctAnswers: Number,
    completedAt: Date,
    timeSpent: Number,
    passed: Boolean
  }],

  // Rewards
  pointsEarned: {
    type: Number,
    default: 0
  },

  bonusPointsEarned: {
    type: Number,
    default: 0
  },

  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Feedback
  childRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },

  childFeedback: {
    type: String,
    default: null
  },

  // Achievements
  achievementsUnlocked: [{
    achievement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

/**
 * Indexes (NON-UNIQUE)
 * Allows multiple plays per game per session
 */
progressSchema.index({ child: 1, sessionId: 1 });
progressSchema.index({ child: 1, game: 1 });
progressSchema.index({ child: 1, learningModule: 1 });

/**
 * Methods
 */
progressSchema.methods.calculateCompletion = function (totalItems = 10) {
  if (this.contentType === 'learning-module') {
    const completed = this.lessonsCompleted.length;
    // Use passed totalItems (from module.lessons.length) or default to 10 as fallback
    // But ideally, the controller should update this percentage, or we assume a standard count if not provided
    // For now, let's just make it safer by not hardcoding 10 if we can avoid it, 
    // but without access to the Module here, we rely on the controller to set completionPercentage
    // OR we change this to just return true/false and let controller handle math.
    // However, to permit custom totals, we can accept an argument.

    if (totalItems > 0) {
      this.completionPercentage = Math.min(100, Math.round((completed / totalItems) * 100));
    }
  }

  if (this.contentType === 'game') {
    const completed = this.levelsCompleted.length;
    // Assuming games might have levels, defaulting to 10 if unknown
    if (totalItems > 0) {
      this.completionPercentage = Math.min(100, Math.round((completed / totalItems) * 100));
    }
  }

  if (this.completionPercentage >= 100) {
    this.status = 'completed';
    this.completedAt = this.completedAt || Date.now();
  }
};

progressSchema.methods.addTimeSpent = function (seconds) {
  this.timeSpent += seconds;
  this.lastAccessedAt = Date.now();
};

module.exports = mongoose.model('Progress', progressSchema);
