// src/models/Progress.js

const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  // Who and What
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  
  // Type of content
  contentType: {
    type: String,
    enum: ['game', 'learning-module'],
    required: true
  },
  
  // Reference to the content
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  },
  
  learningModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningModule'
  },
  
  // Progress Status
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  
  // Completion Data
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
  
  // Performance Metrics
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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
    type: Number, // in seconds
    default: 0
  },
  
  // For Learning Modules - Lesson Progress
  lessonsCompleted: [{
    lessonNumber: Number,
    completedAt: Date,
    score: Number
  }],
  
  currentLesson: {
    type: Number,
    default: 1
  },
  
  // For Games - Level Progress
  currentLevel: {
    type: Number,
    default: 1
  },
  
  levelsCompleted: [{
    levelNumber: Number,
    completedAt: Date,
    score: Number,
    stars: Number // 1-3 stars rating
  }],
  
  // Quiz Results (for learning modules)
  quizAttempts: [{
    attemptNumber: Number,
    score: Number,
    totalQuestions: Number,
    correctAnswers: Number,
    completedAt: Date,
    timeSpent: Number,
    passed: Boolean
  }],
  
  // Points Earned
  pointsEarned: {
    type: Number,
    default: 0
  },
  
  bonusPointsEarned: {
    type: Number,
    default: 0
  },
  
  // Completion Percentage
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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
  
  // Achievements Unlocked During This Activity
  achievementsUnlocked: [{
    achievement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    unlockedAt: Date
  }]
  
}, {
  timestamps: true
});

// Compound index to prevent duplicates and improve queries
progressSchema.index({ child: 1, game: 1 }, { unique: true, sparse: true });
progressSchema.index({ child: 1, learningModule: 1 }, { unique: true, sparse: true });
progressSchema.index({ child: 1, status: 1 });

// Method to update completion percentage
progressSchema.methods.calculateCompletion = function() {
  if (this.contentType === 'learning-module') {
    // Calculate based on lessons completed
    const totalLessons = this.lessonsCompleted.length;
    // You'd get total lessons from the module itself
    // For now, we'll set it manually
    this.completionPercentage = Math.min(100, (totalLessons / 10) * 100);
  } else if (this.contentType === 'game') {
    // Calculate based on levels completed
    const totalLevels = this.levelsCompleted.length;
    this.completionPercentage = Math.min(100, (totalLevels / 10) * 100);
  }
  
  if (this.completionPercentage === 100) {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = Date.now();
    }
  }
};

// Method to add time spent
progressSchema.methods.addTimeSpent = function(seconds) {
  this.timeSpent += seconds;
  this.lastAccessedAt = Date.now();
};

module.exports = mongoose.model('Progress', progressSchema);