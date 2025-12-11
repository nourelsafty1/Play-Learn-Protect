// src/controllers/childController.js

const Child = require('../models/Child');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Session = require('../models/Session');

// @desc    Create a new child account
// @route   POST /api/children
// @access  Private (Parent/Teacher)
exports.createChild = async (req, res, next) => {
  try {
    const { name, username, dateOfBirth, ageGroup, gender, gradeLevel, school } = req.body;

    // Check if username already exists
    const existingChild = await Child.findOne({ username });
    if (existingChild) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken. Please choose another.'
      });
    }

    // Create child account
    const child = await Child.create({
      name,
      username,
      dateOfBirth,
      ageGroup,
      gender,
      gradeLevel,
      school,
      parents: [req.user._id], // Add current user as parent
      language: req.user.language || 'ar'
    });

    // Add child to user's children array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { children: child._id }
    });

    res.status(201).json({
      success: true,
      message: 'Child account created successfully',
      data: child
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all children for logged in user
// @route   GET /api/children
// @access  Private
exports.getMyChildren = async (req, res, next) => {
  try {
    let children;

    if (req.user.role === 'parent') {
      // Get children where user is a parent
      children = await Child.find({
        parents: req.user._id,
        isActive: true
      }).select('-__v');
    } else if (req.user.role === 'teacher') {
      // Get children where user is a teacher
      children = await Child.find({
        teachers: req.user._id,
        isActive: true
      }).select('-__v');
    } else if (req.user.role === 'admin') {
      // Admin can see all children
      children = await Child.find({ isActive: true }).select('-__v');
    }

    res.status(200).json({
      success: true,
      count: children.length,
      data: children
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single child by ID
// @route   GET /api/children/:id
// @access  Private
exports.getChild = async (req, res, next) => {
  try {
    const child = await Child.findById(req.params.id)
      .populate('parents', 'name email')
      .populate('teachers', 'name email schoolName')
      .populate('achievements.achievement');

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Check if user has access to this child
    const hasAccess = 
      child.parents.some(p => p._id.toString() === req.user._id.toString()) ||
      child.teachers.some(t => t._id.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this child account'
      });
    }

    res.status(200).json({
      success: true,
      data: child
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update child profile
// @route   PUT /api/children/:id
// @access  Private (Parent only)
exports.updateChild = async (req, res, next) => {
  try {
    let child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Check if user is parent of this child
    const isParent = child.parents.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParent && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can update child profile'
      });
    }

    // Fields that can be updated
    const allowedUpdates = {
      name: req.body.name,
      avatar: req.body.avatar,
      avatarColor: req.body.avatarColor,
      gradeLevel: req.body.gradeLevel,
      school: req.body.school,
      language: req.body.language,
      theme: req.body.theme
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => 
      allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    child = await Child.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Child profile updated successfully',
      data: child
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update child safety settings
// @route   PUT /api/children/:id/settings
// @access  Private (Parent only)
exports.updateChildSettings = async (req, res, next) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Check if user is parent
    const isParent = child.parents.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParent && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can update child settings'
      });
    }

    // Update settings
    const settings = {
      dailyScreenTimeLimit: req.body.dailyScreenTimeLimit,
      contentFilterLevel: req.body.contentFilterLevel,
      allowedCategories: req.body.allowedCategories,
      blockedCategories: req.body.blockedCategories
    };

    // Remove undefined fields
    Object.keys(settings).forEach(key => 
      settings[key] === undefined && delete settings[key]
    );

    const updatedChild = await Child.findByIdAndUpdate(
      req.params.id,
      settings,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Child settings updated successfully',
      data: updatedChild
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Add points to child
// @route   POST /api/children/:id/points
// @access  Private
exports.addPoints = async (req, res, next) => {
  try {
    const { points, reason } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid points amount'
      });
    }

    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Add points and check for level up
    const result = child.addPoints(points);
    await child.save();

    // Check for new achievements
    const gamification = require('../utils/gamification');
    const newAchievements = await gamification.checkAchievements(child._id);

    res.status(200).json({
      success: true,
      message: 'Points added successfully',
      data: {
        totalPoints: child.totalPoints,
        level: child.level,
        experiencePoints: child.experiencePoints,
        leveledUp: result.leveledUp,
        newLevel: result.newLevel,
        newAchievements: newAchievements
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get child's dashboard data
// @route   GET /api/children/:id/dashboard
// @access  Private
exports.getChildDashboard = async (req, res, next) => {
  try {
    const child = await Child.findById(req.params.id)
      .populate('achievements.achievement')
      .populate('completedGames.game', 'title thumbnail')
      .populate('completedLessons.lesson', 'title thumbnail');

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Get recent progress
    const recentProgress = await Progress.find({ child: child._id })
      .sort({ lastAccessedAt: -1 })
      .limit(5)
      .populate('game', 'title thumbnail category')
      .populate('learningModule', 'title thumbnail subject');

    // Get today's screen time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = await Session.find({
      child: child._id,
      startTime: { $gte: today }
    });

    const screenTimeToday = todaySessions.reduce(
      (sum, session) => sum + session.duration, 0
    ) / 60; // Convert to minutes

    // Get suggested activities
    const gamification = require('../utils/gamification');
    const suggestions = await gamification.getSuggestedActivities(child._id);

    // Calculate level progress
    const levelProgress = gamification.levelProgress(child.experiencePoints, child.level);
    const xpForNext = gamification.xpForNextLevel(child.level);

    res.status(200).json({
      success: true,
      data: {
        profile: {
          name: child.name,
          username: child.username,
          avatar: child.avatar,
          level: child.level,
          totalPoints: child.totalPoints,
          currentStreak: child.currentStreak,
          longestStreak: child.longestStreak
        },
        progress: {
          levelProgress: levelProgress,
          xpForNextLevel: xpForNext,
          experiencePoints: child.experiencePoints
        },
        screenTime: {
          today: Math.round(screenTimeToday),
          limit: child.dailyScreenTimeLimit,
          remaining: Math.max(0, child.dailyScreenTimeLimit - screenTimeToday)
        },
        recentActivity: recentProgress,
        achievements: child.achievements.slice(-5), // Last 5 achievements
        badges: child.badges.slice(-5), // Last 5 badges
        suggestions: suggestions
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Deactivate child account
// @route   DELETE /api/children/:id
// @access  Private (Parent/Admin only)
exports.deleteChild = async (req, res, next) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Check if user is parent
    const isParent = child.parents.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParent && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can delete child accounts'
      });
    }

    // Soft delete - deactivate instead of removing
    child.isActive = false;
    await child.save();

    // Remove from user's children array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { children: child._id }
    });

    res.status(200).json({
      success: true,
      message: 'Child account deactivated successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Add teacher to child account
// @route   POST /api/children/:id/teachers
// @access  Private (Parent only)
exports.addTeacher = async (req, res, next) => {
  try {
    const { teacherEmail } = req.body;

    const child = await Child.findById(req.params.id);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Find teacher
    const teacher = await User.findOne({ email: teacherEmail, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found with this email'
      });
    }

    // Check if teacher already added
    if (child.teachers.includes(teacher._id)) {
      return res.status(400).json({
        success: false,
        message: 'Teacher already has access to this child'
      });
    }

    // Add teacher
    child.teachers.push(teacher._id);
    await child.save();

    // Add child to teacher's children array
    await User.findByIdAndUpdate(teacher._id, {
      $push: { children: child._id }
    });

    res.status(200).json({
      success: true,
      message: 'Teacher added successfully',
      data: child
    });

  } catch (error) {
    next(error);
  }
};

module.exports = exports;