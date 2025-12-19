// src/models/Leaderboard.js

const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  // Leaderboard Type
  type: {
    type: String,
    enum: ['children', 'age-group'],
    required: true
  },

  // Time Period
  period: {
    type: String,
    enum: ['all-time', 'weekly', 'monthly', 'daily'],
    required: true
  },

  // Scope
  ageGroup: {
    type: String,
    enum: ['3-5', '6-8', '9-12', null],
    default: null
  },

  school: {
    type: String,
    default: null
  },

  // Start and End dates for the period
  periodStart: {
    type: Date,
    required: true
  },

  periodEnd: {
    type: Date,
    required: true
  },

  // Rankings
  rankings: [{
    rank: {
      type: Number,
      required: true
    },

    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true
    },

    score: {
      type: Number,
      default: 0
    },

    // Additional metrics
    totalPoints: {
      type: Number,
      default: 0
    },

    gamesCompleted: {
      type: Number,
      default: 0
    },

    modulesCompleted: {
      type: Number,
      default: 0
    },

    achievementsEarned: {
      type: Number,
      default: 0
    },

    currentStreak: {
      type: Number,
      default: 0
    },

    // Change from previous period
    previousRank: {
      type: Number,
      default: null
    },

    rankChange: {
      type: Number, // positive = moved up, negative = moved down
      default: 0
    }
  }],

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true
});

// Index for queries
leaderboardSchema.index({ type: 1, period: 1, periodStart: 1 });
leaderboardSchema.index({ type: 1, ageGroup: 1, period: 1 });

// Method to update rankings
leaderboardSchema.methods.updateRankings = async function (childrenData) {
  // Sort children by score
  const sorted = childrenData.sort((a, b) => b.score - a.score);

  // Create rankings with rank change calculation
  this.rankings = sorted.map((childData, index) => {
    const currentRank = index + 1;
    const previousRank = childData.previousRank || currentRank;
    const rankChange = previousRank - currentRank; // positive = improvement

    return {
      rank: currentRank,
      child: childData.childId,
      score: childData.score,
      totalPoints: childData.totalPoints,
      gamesCompleted: childData.gamesCompleted,
      modulesCompleted: childData.modulesCompleted,
      achievementsEarned: childData.achievementsEarned,
      currentStreak: childData.currentStreak,
      previousRank: previousRank,
      rankChange: rankChange
    };
  });

  this.lastUpdated = Date.now();
  return this.save();
};

module.exports = mongoose.model('Leaderboard', leaderboardSchema);