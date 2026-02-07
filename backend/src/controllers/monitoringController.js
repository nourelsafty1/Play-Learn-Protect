// src/controllers/monitoringController.js

const Session = require('../models/Session');
const Child = require('../models/Child');
const Alert = require('../models/Alert');
const analytics = require('../utils/analytics');

// @desc    Start a new session
// @route   POST /api/monitoring/sessions/start
// @access  Private
exports.startSession = async (req, res, next) => {
  try {
    const { childId, deviceType, browser, ipAddress } = req.body;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: 'Child ID is required'
      });
    }

    // Check if there's already an active session
    const activeSession = await Session.findOne({
      child: childId,
      isActive: true
    });

    if (activeSession) {
      return res.status(200).json({
        success: true,
        message: 'Active session already exists',
        data: activeSession
      });
    }

    // Check screen time limit
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Get today's total screen time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = await Session.find({
      child: childId,
      startTime: { $gte: today }
    });

    // Calculate total time including active sessions
    const totalTimeToday = todaySessions.reduce((sum, s) => {
      let duration = s.duration;
      // If session is active, calculate current duration
      if (s.isActive && s.startTime) {
        duration = Math.floor((Date.now() - s.startTime.getTime()) / 1000);
      }
      return sum + duration;
    }, 0) / 60; // Convert to minutes

    const remainingTime = child.dailyScreenTimeLimit - totalTimeToday;

    if (totalTimeToday >= child.dailyScreenTimeLimit) {
      // Create alert for screen time limit
      await Alert.create({
        child: child._id,
        type: 'screen-time-limit',
        severity: 'medium',
        title: 'Screen Time Limit Reached',
        titleArabic: 'تم الوصول إلى حد وقت الشاشة',
        message: `You've reached your daily limit of ${child.dailyScreenTimeLimit} minutes.`,
        messageArabic: `لقد وصلت إلى حدك اليومي وهو ${child.dailyScreenTimeLimit} دقيقة.`,
        educationalTip: 'Take a break! Go outside, read a book, or play with friends.',
        educationalTipArabic: 'خذ استراحة! اذهب للخارج، اقرأ كتاباً، أو العب مع الأصدقاء.',
        triggeredBy: 'screen-time-monitor',
        context: {
          timeToday: Math.round(totalTimeToday),
          limit: child.dailyScreenTimeLimit
        },
        shownToChild: true,
        shownToParent: true
      });

      return res.status(403).json({
        success: false,
        message: 'Daily screen time limit reached',
        messageArabic: 'تم الوصول إلى حد وقت الشاشة لهذا اليوم',
        timeUsed: Math.round(totalTimeToday),
        limit: child.dailyScreenTimeLimit,
        remaining: 0,
        limitReached: true
      });
    }

    // Create new session
    const session = await Session.create({
      child: childId,
      deviceType: deviceType || 'desktop',
      browser,
      ipAddress
    });

    // Update child's streak
    child.updateStreak();
    await child.save();

    res.status(201).json({
      success: true,
      message: 'Session started successfully',
      data: {
        sessionId: session._id,
        startTime: session.startTime,
        remainingTime: child.dailyScreenTimeLimit - totalTimeToday
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    End a session
// @route   POST /api/monitoring/sessions/:sessionId/end
// @access  Private
exports.endSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (!session.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Session already ended'
      });
    }

    // End session
    await session.endSession();

    // Update leaderboards
    const gamification = require('../utils/gamification');
    await gamification.updateLeaderboards(session.child);

    res.status(200).json({
      success: true,
      message: 'Session ended successfully',
      data: {
        duration: Math.round(session.duration / 60), // minutes
        activeTime: Math.round(session.activeTime / 60),
        pointsEarned: session.pointsEarned,
        gamesPlayed: session.totalGamesPlayed,
        lessonsViewed: session.totalLessonsViewed
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Add activity to session
// @route   POST /api/monitoring/sessions/:sessionId/activity
// @access  Private
exports.addActivity = async (req, res, next) => {
  try {
    const { activityType, gameId, learningModuleId, duration, score, completed, level } = req.body;

    const session = await Session.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const activityData = {
      activityType,
      game: gameId,
      learningModule: learningModuleId,
      startTime: new Date(Date.now() - (duration * 1000)),
      endTime: Date.now(),
      duration,
      score,
      completed,
      level
    };

    await session.addActivity(activityData);

    res.status(200).json({
      success: true,
      message: 'Activity added to session',
      data: session
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get screen time analytics
// @route   GET /api/monitoring/child/:childId/screentime
// @access  Private
exports.getScreenTimeAnalytics = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { period = '7' } = req.query; // days

    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Calculate date range - include full current day
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    startDate.setHours(0, 0, 0, 0); // Start of that day

    const screenTimeData = await analytics.getScreenTimeAnalytics(
      childId,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: screenTimeData
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get learning analytics
// @route   GET /api/monitoring/child/:childId/learning
// @access  Private
exports.getLearningAnalytics = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { period = '30' } = req.query; // days

    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Calculate date range - include full current day
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    startDate.setHours(0, 0, 0, 0); // Start of that day

    const learningData = await analytics.getLearningAnalytics(
      childId,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: learningData
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get safety analytics
// @route   GET /api/monitoring/child/:childId/safety
// @access  Private
exports.getSafetyAnalytics = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { period = '30' } = req.query;

    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Calculate date range - include full current day
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    startDate.setHours(0, 0, 0, 0); // Start of that day

    const safetyData = await analytics.getSafetyAnalytics(
      childId,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: safetyData
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Generate weekly report
// @route   GET /api/monitoring/child/:childId/report/weekly
// @access  Private
exports.getWeeklyReport = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const report = await analytics.generateWeeklyReport(childId);

    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all sessions for child
// @route   GET /api/monitoring/child/:childId/sessions
// @access  Private
exports.getChildSessions = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const query = { child: childId };

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const sessions = await Session.find(query)
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('alertsTriggered', 'type severity title')
      .populate('flaggedContent', 'flagReason severity');

    const count = await Session.countDocuments(query);

    res.status(200).json({
      success: true,
      count: sessions.length,
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: sessions
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Detect unusual patterns
// @route   GET /api/monitoring/child/:childId/patterns
// @access  Private
exports.detectUnusualPatterns = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const patterns = await analytics.detectUnusualPatterns(childId);

    res.status(200).json({
      success: true,
      data: patterns
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard data for parent/teacher
// @route   GET /api/monitoring/dashboard
// @access  Private
exports.getMonitoringDashboard = async (req, res, next) => {
  try {
    const user = req.user;


    // Get all children for this user
    const children = await Child.find({
      $or: [
        { parents: user._id },
        { teachers: user._id }
      ],
      isActive: true
    });

    const childIds = children.map(c => c._id);

    // Support period selection (default 7 days)
    const period = parseInt(req.query.period) || 7;
    const periodStart = new Date();
    periodStart.setHours(0, 0, 0, 0);
    periodStart.setDate(periodStart.getDate() - (period - 1));

    // Get sessions in the selected period
    const periodSessions = await Session.find({
      child: { $in: childIds },
      startTime: { $gte: periodStart }
    }).populate('activities.game', 'title category').populate('activities.learningModule', 'title subject');

    // Get all activities from sessions in period
    const allActivities = [];
    periodSessions.forEach(session => {
      if (session.activities && session.activities.length > 0) {
        session.activities.forEach(activity => {
          allActivities.push({
            ...activity.toObject(),
            sessionId: session._id,
            childId: session.child,
            sessionStartTime: session.startTime
          });
        });
      }
    });


    // Sort activities by start time (most recent first)
    allActivities.sort((a, b) => {
      const timeA = a.startTime ? new Date(a.startTime).getTime() : new Date(a.sessionStartTime).getTime();
      const timeB = b.startTime ? new Date(b.startTime).getTime() : new Date(b.sessionStartTime).getTime();
      return timeB - timeA;
    });


    // Get unresolved alerts
    const unresolvedAlerts = await Alert.find({
      child: { $in: childIds },
      resolved: false
    }).sort({ createdAt: -1 }).limit(10);

    // Calculate total screen time in period (include active sessions with current duration)
    const totalScreenTimePeriod = periodSessions.reduce((sum, s) => {
      let duration = s.duration;
      if (s.isActive && s.startTime) {
        duration = Math.floor((Date.now() - s.startTime.getTime()) / 1000);
      }
      return sum + duration;
    }, 0) / 60;


    // Get recent achievements (last 7 days)
    const recentAchievements = [];
    for (const child of children) {
      const recent = child.achievements
        .filter(a => a.earnedAt >= periodStart)
        .map(a => ({
          child: { name: child.name, avatar: child.avatar },
          achievement: a.achievement,
          earnedAt: a.earnedAt
        }));
      recentAchievements.push(...recent);
    }

    // Get safety summary
    const safetyAlgorithms = require('../utils/safetyAlgorithms');
    const riskScores = await Promise.all(
      childIds.map(id => safetyAlgorithms.calculateRiskScore(id))
    );

    const highRiskChildren = riskScores.filter(r => r.level === 'high').length;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalChildren: children.length,
          activeSessions: periodSessions.filter(s => s.isActive).length,
          totalScreenTimePeriod: Math.round(totalScreenTimePeriod),
          unresolvedAlerts: unresolvedAlerts.length,
          highRiskChildren: highRiskChildren
        },
        children: children.map(child => ({
          id: child._id,
          name: child.name,
          avatar: child.avatar,
          level: child.level,
          totalPoints: child.totalPoints,
          currentStreak: child.currentStreak
        })),
        recentAlerts: unresolvedAlerts,
        recentAchievements: recentAchievements.slice(0, 10),
        recentActivities: allActivities.slice(0, 20) // Show last 20 activities
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = exports;