// src/models/Achievement.js

const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Please provide achievement name'],
    trim: true
  },
  
  nameArabic: {
    type: String,
    trim: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  descriptionArabic: {
    type: String
  },
  
  // Visual
  icon: {
    type: String,
    required: true // URL or path to icon image
  },
  
  badge: {
    type: String // URL or path to badge image
  },
  
  color: {
    type: String,
    default: '#FFD700' // Gold color
  },
  
  // Classification
  category: {
    type: String,
    enum: [
      'games', 
      'learning', 
      'streak', 
      'points', 
      'social', 
      'creative', 
      'mastery',
      'special'
    ],
    required: true
  },
  
  type: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'special'],
    default: 'bronze'
  },
  
  // Requirements
  requirements: {
    // For game-based achievements
    gamesCompleted: {
      type: Number,
      default: 0
    },
    specificGames: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    }],
    
    // For learning-based achievements
    modulesCompleted: {
      type: Number,
      default: 0
    },
    specificModules: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningModule'
    }],
    
    // For point-based achievements
    totalPoints: {
      type: Number,
      default: 0
    },
    
    // For streak-based achievements
    streakDays: {
      type: Number,
      default: 0
    },
    
    // For mastery achievements
    perfectScores: {
      type: Number,
      default: 0
    },
    
    // For level achievements
    reachLevel: {
      type: Number,
      default: 0
    },
    
    // For time-based achievements
    timeSpent: {
      type: Number, // in minutes
      default: 0
    },
    
    // Custom conditions
    customCondition: {
      type: String, // e.g., "complete-all-math-games"
      default: null
    }
  },
  
  // Rewards
  pointsReward: {
    type: Number,
    default: 100
  },
  
  bonusReward: {
    type: String, // e.g., "unlock-special-avatar", "new-theme"
    default: null
  },
  
  // Difficulty
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'legendary'],
    default: 'easy'
  },
  
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  
  // Target Age Groups
  ageGroups: [{
    type: String,
    enum: ['3-5', '6-8', '9-12'],
    default: ['3-5', '6-8', '9-12']
  }],
  
  // Statistics
  timesEarned: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isSecret: {
    type: Boolean,
    default: false // Secret achievements not shown until earned
  },
  
  // Ordering
  order: {
    type: Number,
    default: 0
  }
  
}, {
  timestamps: true
});

// Index for querying
achievementSchema.index({ category: 1, type: 1, isActive: 1 });

// Method to increment earned count
achievementSchema.methods.incrementEarned = function() {
  this.timesEarned += 1;
  return this.save();
};

module.exports = mongoose.model('Achievement', achievementSchema);