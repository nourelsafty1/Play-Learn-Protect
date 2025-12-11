// src/models/Session.js

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  // Who
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  
  // When
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  endTime: {
    type: Date,
    default: null
  },
  
  duration: {
    type: Number, // in seconds
    default: 0
  },
  
  // Session Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // What Activities
  activities: [{
    activityType: {
      type: String,
      enum: ['game', 'learning-module', 'creative', 'browsing'],
      required: true
    },
    
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    },
    
    learningModule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningModule'
    },
    
    startTime: Date,
    endTime: Date,
    duration: Number, // in seconds
    
    // Activity-specific data
    score: Number,
    completed: Boolean,
    level: Number
  }],
  
  // Session Metrics
  totalGamesPlayed: {
    type: Number,
    default: 0
  },
  
  totalLessonsViewed: {
    type: Number,
    default: 0
  },
  
  pointsEarned: {
    type: Number,
    default: 0
  },
  
  achievementsEarned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  }],
  
  // Device Information
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop'],
    default: 'desktop'
  },
  
  browser: {
    type: String,
    default: null
  },
  
  ipAddress: {
    type: String,
    default: null
  },
  
  // Safety Monitoring
  flaggedContent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentFlag'
  }],
  
  alertsTriggered: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  }],
  
  // Session Quality
  idleTime: {
    type: Number, // in seconds
    default: 0
  },
  
  activeTime: {
    type: Number, // in seconds (duration - idleTime)
    default: 0
  },
  
  screenTimeWarningShown: {
    type: Boolean,
    default: false
  },
  
  forcedLogout: {
    type: Boolean,
    default: false // true if session ended due to time limit
  }
  
}, {
  timestamps: true
});

// Index for queries
sessionSchema.index({ child: 1, startTime: -1 });
sessionSchema.index({ child: 1, isActive: 1 });

// Method to end session
sessionSchema.methods.endSession = function() {
  this.endTime = Date.now();
  this.isActive = false;
  this.duration = Math.floor((this.endTime - this.startTime) / 1000); // in seconds
  this.activeTime = this.duration - this.idleTime;
  return this.save();
};

// Method to add activity
sessionSchema.methods.addActivity = function(activityData) {
  this.activities.push(activityData);
  
  if (activityData.activityType === 'game') {
    this.totalGamesPlayed += 1;
  } else if (activityData.activityType === 'learning-module') {
    this.totalLessonsViewed += 1;
  }
  
  return this.save();
};

module.exports = mongoose.model('Session', sessionSchema);