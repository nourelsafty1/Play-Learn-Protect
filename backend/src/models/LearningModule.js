// src/models/LearningModule.js

const mongoose = require('mongoose');

const learningModuleSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Please provide module title'],
    trim: true
  },
  
  titleArabic: {
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
  
  // Classification
  subject: {
    type: String,
    required: true,
    enum: ['Maths','English', 'Biology', 'Arabic', 'Coding', 'Physics', 'Chemistry']
  },
  
  topic: {
    type: String,
    required: true // e.g., "addition", "fractions", "verbs", "variables"
  },
  
  // Target Audience
  ageGroups: [{
    type: String,
    enum: ['3-5', '6-8', '9-12'],
    required: true
  }],
  
  gradeLevel: {
    type: String
  },
  
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  // Prerequisites
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningModule'
  }],
  
  // Content Structure
  lessons: [{
    lessonNumber: {
      type: Number,
      required: true
    },
    title: String,
    titleArabic: String,
    contentType: {
      type: String,
      enum: ['video', 'interactive', 'text', 'quiz', 'game'],
      required: true
    },
    content: String, // URL or text content
    duration: Number, // in minutes
    order: Number
  }],
  
  // Learning Objectives
  learningObjectives: [{
    type: String
  }],
  
  skills: [{
    type: String
  }],
  
  // Media
  thumbnail: {
    type: String,
    default: 'default-module.png'
  },
  
  coverImage: {
    type: String
  },
  
  introVideo: {
    type: String // URL to intro video
  },
  
  // Assessment
  hasQuiz: {
    type: Boolean,
    default: false
  },
  
  quizQuestions: [{
    question: String,
    questionArabic: String,
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'fill-blank', 'matching']
    },
    options: [String],
    correctAnswer: String,
    explanation: String,
    explanationArabic: String,
    points: {
      type: Number,
      default: 10
    }
  }],
  
  passingScore: {
    type: Number,
    default: 70 // percentage
  },
  
  // Gamification
  pointsPerLesson: {
    type: Number,
    default: 50
  },
  
  completionPoints: {
    type: Number,
    default: 200
  },
  
  certificate: {
    available: {
      type: Boolean,
      default: false
    },
    template: String
  },
  
  // Related Content
  relatedGames: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  }],
  
  relatedModules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningModule'
  }],
  
  // Statistics
  enrollmentCount: {
    type: Number,
    default: 0
  },
  
  completionCount: {
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
  
  // Language
  language: [{
    type: String,
    enum: ['en', 'ar'],
    default: ['ar']
  }],
  
  // Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true
});

// Index for searching
learningModuleSchema.index({ subject: 1, topic: 1, ageGroups: 1 });

// Method to add rating
learningModuleSchema.methods.addRating = function(rating) {
  const totalScore = this.averageRating * this.totalRatings;
  this.totalRatings += 1;
  this.averageRating = (totalScore + rating) / this.totalRatings;
  return this.save();
};

// Method to increment enrollment
learningModuleSchema.methods.incrementEnrollment = function() {
  this.enrollmentCount += 1;
  return this.save();
};

module.exports = mongoose.model('LearningModule', learningModuleSchema);