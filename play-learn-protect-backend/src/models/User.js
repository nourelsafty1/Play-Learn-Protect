// src/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password in queries by default
  },
  
  // User Role
  role: {
    type: String,
    enum: ['parent', 'teacher', 'admin'],
    default: 'parent'
  },
  
  // Contact Information
  phone: {
    type: String,
    default: null
  },
  
  // Profile Information
  profilePicture: {
    type: String,
    default: null
  },
  
  // For Teachers
  schoolName: {
    type: String,
    default: null
  },
  
  schoolId: {
    type: String,
    default: null
  },
  
  // Connected Children (for parents and teachers)
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  }],
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Preferences
  language: {
    type: String,
    enum: ['en', 'ar'],
    default: 'ar' // Arabic default for Egypt
  },
  
  notificationSettings: {
    email: {
      type: Boolean,
      default: true
    },
    screenTimeAlerts: {
      type: Boolean,
      default: true
    },
    safetyAlerts: {
      type: Boolean,
      default: true
    },
    weeklyReports: {
      type: Boolean,
      default: true
    }
  },
  
  // Security
  passwordResetToken: String,
  passwordResetExpire: Date,
  
  lastLogin: {
    type: Date,
    default: null
  }
  
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    next();
  }
  
  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);