// src/models/Alert.js

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  // Who
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  
  // Alert Type
  type: {
    type: String,
    enum: [
      'screen-time-warning',
      'screen-time-limit',
      'inappropriate-content',
      'cyberbullying-detected',
      'suspicious-behavior',
      'excessive-gaming',
      'unsafe-interaction',
      'educational'
    ],
    required: true
  },
  
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Alert Details
  title: {
    type: String,
    required: true
  },
  
  titleArabic: {
    type: String
  },
  
  message: {
    type: String,
    required: true
  },
  
  messageArabic: {
    type: String
  },
  
  // Educational Content
  educationalTip: {
    type: String, // Teaching safe behavior
    default: null
  },
  
  educationalTipArabic: {
    type: String
  },
  
  recommendedAction: {
    type: String,
    default: null
  },
  
  // Context
  triggeredBy: {
    type: String, // What caused the alert
    required: true
  },
  
  context: {
    type: mongoose.Schema.Types.Mixed, // Additional data about what triggered alert
    default: {}
  },
  
  // Related Content
  relatedGame: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  },
  
  relatedModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningModule'
  },
  
  contentFlag: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentFlag'
  },
  
  // Alert Actions
  shownToChild: {
    type: Boolean,
    default: false
  },
  
  shownToParent: {
    type: Boolean,
    default: false
  },
  
  shownToTeacher: {
    type: Boolean,
    default: false
  },
  
  // Responses
  childAcknowledged: {
    type: Boolean,
    default: false
  },
  
  childAcknowledgedAt: {
    type: Date,
    default: null
  },
  
  parentViewed: {
    type: Boolean,
    default: false
  },
  
  parentViewedAt: {
    type: Date,
    default: null
  },
  
  parentResponse: {
    type: String,
    enum: ['dismissed', 'acknowledged', 'action-taken', 'false-positive'],
    default: null
  },
  
  parentNotes: {
    type: String,
    default: null
  },
  
  // System Actions Taken
  actionTaken: {
    type: String,
    enum: ['none', 'warning-shown', 'content-blocked', 'session-paused', 'session-ended', 'notification-sent'],
    default: 'none'
  },
  
  contentBlocked: {
    type: Boolean,
    default: false
  },
  
  // Resolution
  resolved: {
    type: Boolean,
    default: false
  },
  
  resolvedAt: {
    type: Date,
    default: null
  },
  
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  expiresAt: {
    type: Date,
    default: null // Some alerts may auto-expire
  }
  
}, {
  timestamps: true
});

// Index for queries
alertSchema.index({ child: 1, createdAt: -1 });
alertSchema.index({ child: 1, type: 1, resolved: 1 });
alertSchema.index({ severity: 1, resolved: 1 });

// Method to mark as shown
alertSchema.methods.markAsShown = function(recipient) {
  if (recipient === 'child') {
    this.shownToChild = true;
  } else if (recipient === 'parent') {
    this.shownToParent = true;
  } else if (recipient === 'teacher') {
    this.shownToTeacher = true;
  }
  return this.save();
};

// Method to acknowledge by child
alertSchema.methods.acknowledgeByChild = function() {
  this.childAcknowledged = true;
  this.childAcknowledgedAt = Date.now();
  return this.save();
};

// Method to resolve
alertSchema.methods.resolve = function(userId) {
  this.resolved = true;
  this.resolvedAt = Date.now();
  this.resolvedBy = userId;
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('Alert', alertSchema);