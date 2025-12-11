// src/models/Game.js

const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Please provide game title'],
    trim: true
  },
  
  titleArabic: {
    type: String,
    trim: true
  },
  
  description: {
    type: String,
    required: [true, 'Please provide game description']
  },
  
  descriptionArabic: {
    type: String
  },
  
  // Game Classification
  category: {
    type: String,
    required: true,
    enum: ['math', 'science', 'language', 'coding', 'physics', 'chemistry', 'creative', 'social', 'memory', 'logic']
  },
  
  type: {
    type: String,
    required: true,
    enum: ['serious', 'creative', 'casual']
  },
  
  // Target Audience
  ageGroups: [{
    type: String,
    enum: ['3-5', '6-8', '9-12'],
    required: true
  }],
  
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  // Game Content
  thumbnail: {
    type: String,
    required: true
  },
  
  gameUrl: {
    type: String,
    required: true // Link to where game is hosted
  },
  
  instructionsText: {
    type: String
  },
  
  instructionsArabic: {
    type: String
  },
  
  // Educational Content
  learningObjectives: [{
    type: String
  }],
  
  skills: [{
    type: String // e.g., "problem-solving", "arithmetic", "vocabulary"
  }],
  
  curriculumAlignment: {
    subject: String,
    gradeLevel: String,
    topics: [String]
  },
  
  // Gamification
  pointsPerCompletion: {
    type: Number,
    default: 100
  },
  
  bonusPoints: {
    type: Number,
    default: 50
  },
  
  // Game Mechanics
  duration: {
    type: Number, // estimated time in minutes
    default: 10
  },
  
  hasLevels: {
    type: Boolean,
    default: false
  },
  
  numberOfLevels: {
    type: Number,
    default: 1
  },
  
  isMultiplayer: {
    type: Boolean,
    default: false
  },
  
  maxPlayers: {
    type: Number,
    default: 1
  },
  
  // Cultural Context
  culturalThemes: [{
    type: String // e.g., "Egyptian history", "Arabic calligraphy", "local traditions"
  }],
  
  language: [{
    type: String,
    enum: ['en', 'ar'],
    default: ['ar']
  }],
  
  // Statistics
  playCount: {
    type: Number,
    default: 0
  },
  
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  totalRatings: {
    type: Number,
    default: 0
  },
  
  averageCompletionTime: {
    type: Number, // in minutes
    default: 0
  },
  
  completionRate: {
    type: Number, // percentage
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isPublished: {
    type: Boolean,
    default: false
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Safety
  contentRating: {
    type: String,
    enum: ['everyone', '6+', '9+'],
    default: 'everyone'
  },
  
  safetyChecked: {
    type: Boolean,
    default: false
  },
  
  // Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true
});

// Index for faster searches
gameSchema.index({ category: 1, ageGroups: 1, isPublished: 1 });
gameSchema.index({ title: 'text', description: 'text' });

// Method to update play count
gameSchema.methods.incrementPlayCount = function() {
  this.playCount += 1;
  return this.save();
};

// Method to add rating
gameSchema.methods.addRating = function(rating) {
  const totalScore = this.averageRating * this.totalRatings;
  this.totalRatings += 1;
  this.averageRating = (totalScore + rating) / this.totalRatings;
  return this.save();
};

module.exports = mongoose.model('Game', gameSchema);