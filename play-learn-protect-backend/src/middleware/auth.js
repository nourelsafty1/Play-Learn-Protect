// src/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - user must be logged in
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from header
    // Format: "Bearer TOKEN_HERE"
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token (decoded has user id)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    next(); // Continue to next middleware/controller
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Token invalid.'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Optional authentication - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Token invalid but continue anyway
      req.user = null;
    }
  }

  next();
};

// Check if user owns the child account they're trying to access
exports.checkChildOwnership = async (req, res, next) => {
  try {
    const Child = require('../models/Child');
    const childId = req.params.id || req.params.childId;

    const child = await Child.findById(childId);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Check if user is parent or teacher of this child, or is admin
    const isParent = child.parents.some(
      parent => parent.toString() === req.user._id.toString()
    );
    const isTeacher = child.teachers.some(
      teacher => teacher.toString() === req.user._id.toString()
    );
    const isAdmin = req.user.role === 'admin';

    if (!isParent && !isTeacher && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this child account'
      });
    }

    // Attach child to request for use in controller
    req.child = child;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking child ownership',
      error: error.message
    });
  }
};