// src/models/Child.js

const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Please provide child name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot be more than 20 characters']
  },
  
  dateOfBirth: {
    type: Date,
    required: [true, 'Please provide date of birth']
  },
  
  // Age Group (calculated from DOB)
  ageGroup: {
    type: String,
    enum: ['3-5', '6-8', '9-12'],
    required: true
  },
  
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  
  // Avatar/Profile
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  
  avatarColor: {
    type: String,
    default: '#4A90E2'
  },
  
  // Connected Adults
  parents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Education Information
  gradeLevel: {
    type: String,
    default: null
  },
  
  school: {
    type: String,
    default: null
  },
  
  // Gamification Stats
  totalPoints: {
    type: Number,
    default: 0
  },
  
  level: {
    type: Number,
    default: 1
  },
  
  experiencePoints: {
    type: Number,
    default: 0
  },
  
  // Achievements
  achievements: [{
    achievement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  badges: [{
    name: String,
    icon: String,
    earnedAt: Date
  }],
  
  // Learning Progress
  completedGames: [{
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    },
    completedAt: Date,
    score: Number
  }],
  
  completedLessons: [{
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningModule'
    },
    completedAt: Date,
    score: Number
  }],
  
  // Current Streaks
  currentStreak: {
    type: Number,
    default: 0
  },
  
  longestStreak: {
    type: Number,
    default: 0
  },
  
  lastActivityDate: {
    type: Date,
    default: null
  },
  
  // Screen Time Settings
  dailyScreenTimeLimit: {
    type: Number, // in minutes
    default: 120 // 2 hours default
  },
  
  // Safety Settings
  contentFilterLevel: {
    type: String,
    enum: ['strict', 'moderate', 'minimal'],
    default: 'strict'
  },
  
  allowedCategories: [{
    type: String
  }],
  
  blockedCategories: [{
    type: String
  }],
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Preferences
  language: {
    type: String,
    enum: ['en', 'ar'],
    default: 'ar'
  },
  
  theme: {
    type: String,
    enum: ['light', 'dark', 'colorful'],
    default: 'colorful'
  }
  
}, {
  timestamps: true
});

// Virtual field to calculate age
childSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
});

// Method to update age group based on current age
childSchema.methods.updateAgeGroup = function() {
  const age = this.age;
  if (age >= 3 && age <= 5) {
    this.ageGroup = '3-5';
  } else if (age >= 6 && age <= 8) {
    this.ageGroup = '6-8';
  } else if (age >= 9 && age <= 12) {
    this.ageGroup = '9-12';
  }
};

// Method to add points and level up
childSchema.methods.addPoints = function(points) {
  this.totalPoints += points;
  this.experiencePoints += points;
  
  // Level up every 1000 XP
  const newLevel = Math.floor(this.experiencePoints / 1000) + 1;
  if (newLevel > this.level) {
    this.level = newLevel;
    return { leveledUp: true, newLevel: this.level };
  }
  
  return { leveledUp: false };
};

// Method to check and update streak
childSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!this.lastActivityDate) {
    this.currentStreak = 1;
    this.lastActivityDate = today;
    return;
  }
  
  const lastActivity = new Date(this.lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    // Consecutive day
    this.currentStreak += 1;
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
  } else if (diffDays > 1) {
    // Streak broken
    this.currentStreak = 1;
  }
  // If diffDays === 0, same day, don't change streak
  
  this.lastActivityDate = today;
};

module.exports = mongoose.model('Child', childSchema);