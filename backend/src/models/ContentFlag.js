// src/models/ContentFlag.js

const mongoose = require('mongoose');

const contentFlagSchema = new mongoose.Schema({
  // Who flagged it
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  
  // What was flagged
  contentType: {
    type: String,
    enum: ['game', 'learning-module', 'user-generated', 'external-link', 'chat-message'],
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
  
  contentDescription: {
    type: String,
    required: true
  },
  
  // Why it was flagged
  flagReason: {
    type: String,
    enum: [
      'inappropriate-language',
      'violence',
      'cyberbullying',
      'explicit-content',
      'suspicious-link',
      'personal-info-request',
      'age-inappropriate',
      'misleading-content',
      'other'
    ],
    required: true
  },
  
  flagDetails: {
    type: String,
    default: null
  },
  
  // Detection Method
  detectedBy: {
    type: String,
    enum: ['automated', 'manual', 'user-report'],
    default: 'automated'
  },
  
  detectionAlgorithm: {
    type: String, // Which algorithm detected it
    default: null
  },
  
  confidenceScore: {
    type: Number, // 0-100, how confident the algorithm is
    min: 0,
    max: 100,
    default: 0
  },
  
  // Content Details
  flaggedText: {
    type: String, // Actual text that was flagged
    default: null
  },
  
  context: {
    type: String, // Surrounding context
    default: null
  },
  
  screenshot: {
    type: String, // URL to screenshot if captured
    default: null
  },
  
  // Review Status
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'confirmed', 'false-positive', 'resolved'],
    default: 'pending'
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  reviewedAt: {
    type: Date,
    default: null
  },
  
  reviewNotes: {
    type: String,
    default: null
  },
  
  // Actions Taken
  actionTaken: {
    type: String,
    enum: [
      'none',
      'warning-issued',
      'content-removed',
      'content-blocked',
      'parent-notified',
      'account-suspended',
      'escalated'
    ],
    default: 'none'
  },
  
  alertCreated: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  },
  
  // Parent/Teacher Notification
  parentNotified: {
    type: Boolean,
    default: false
  },
  
  teacherNotified: {
    type: Boolean,
    default: false
  },
  
  // Severity
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Follow-up
  requiresFollowUp: {
    type: Boolean,
    default: false
  },
  
  followUpCompleted: {
    type: Boolean,
    default: false
  },
  
  followUpNotes: {
    type: String,
    default: null
  }
  
}, {
  timestamps: true
});

// Index for queries
contentFlagSchema.index({ child: 1, createdAt: -1 });
contentFlagSchema.index({ status: 1, severity: 1 });
contentFlagSchema.index({ flagReason: 1, status: 1 });

// Method to confirm flag
contentFlagSchema.methods.confirm = function(userId, notes) {
  this.status = 'confirmed';
  this.reviewedBy = userId;
  this.reviewedAt = Date.now();
  this.reviewNotes = notes;
  return this.save();
};

// Method to mark as false positive
contentFlagSchema.methods.markFalsePositive = function(userId, notes) {
  this.status = 'false-positive';
  this.reviewedBy = userId;
  this.reviewedAt = Date.now();
  this.reviewNotes = notes;
  return this.save();
};

module.exports = mongoose.model('ContentFlag', contentFlagSchema);