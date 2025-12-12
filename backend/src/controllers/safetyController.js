// src/controllers/safetyController.js

const Alert = require('../models/Alert');
const ContentFlag = require('../models/ContentFlag');
const Child = require('../models/Child');
const safetyAlgorithms = require('../utils/safetyAlgorithms');

// @desc    Get all alerts for a child
// @route   GET /api/safety/child/:childId/alerts
// @access  Private
exports.getChildAlerts = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { type, severity, resolved, page = 1, limit = 20 } = req.query;

    const query = { child: childId };

    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (resolved !== undefined) query.resolved = resolved === 'true';

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('contentFlag')
      .populate('resolvedBy', 'name email');

    const count = await Alert.countDocuments(query);

    res.status(200).json({
      success: true,
      count: alerts.length,
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: alerts
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single alert
// @route   GET /api/safety/alerts/:id
// @access  Private
exports.getAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('child', 'name username avatar')
      .populate('contentFlag')
      .populate('resolvedBy', 'name email');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.status(200).json({
      success: true,
      data: alert
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Mark alert as viewed by parent
// @route   PUT /api/safety/alerts/:id/view
// @access  Private
exports.viewAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    await alert.markAsShown('parent');
    alert.parentViewed = true;
    alert.parentViewedAt = Date.now();
    await alert.save();

    res.status(200).json({
      success: true,
      message: 'Alert marked as viewed',
      data: alert
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Resolve an alert
// @route   PUT /api/safety/alerts/:id/resolve
// @access  Private
exports.resolveAlert = async (req, res, next) => {
  try {
    const { parentResponse, parentNotes } = req.body;

    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alert.parentResponse = parentResponse;
    alert.parentNotes = parentNotes;
    await alert.resolve(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Alert resolved successfully',
      data: alert
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Acknowledge alert (by child)
// @route   PUT /api/safety/alerts/:id/acknowledge
// @access  Private
exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    await alert.acknowledgeByChild();

    res.status(200).json({
      success: true,
      message: 'Alert acknowledged',
      data: alert
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Create manual alert
// @route   POST /api/safety/alerts
// @access  Private (Parent/Teacher)
exports.createAlert = async (req, res, next) => {
  try {
    const {
      childId,
      type,
      severity,
      title,
      titleArabic,
      message,
      messageArabic,
      educationalTip,
      educationalTipArabic
    } = req.body;

    const alert = await Alert.create({
      child: childId,
      type,
      severity,
      title,
      titleArabic,
      message,
      messageArabic,
      educationalTip,
      educationalTipArabic,
      triggeredBy: 'manual',
      shownToParent: true,
      shownToChild: false
    });

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: alert
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all content flags
// @route   GET /api/safety/child/:childId/flags
// @access  Private
exports.getContentFlags = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { status, flagReason, page = 1, limit = 20 } = req.query;

    const query = { child: childId };

    if (status) query.status = status;
    if (flagReason) query.flagReason = flagReason;

    const flags = await ContentFlag.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('reviewedBy', 'name email')
      .populate('alertCreated');

    const count = await ContentFlag.countDocuments(query);

    res.status(200).json({
      success: true,
      count: flags.length,
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: flags
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single content flag
// @route   GET /api/safety/flags/:id
// @access  Private
exports.getContentFlag = async (req, res, next) => {
  try {
    const flag = await ContentFlag.findById(req.params.id)
      .populate('child', 'name username')
      .populate('reviewedBy', 'name email')
      .populate('alertCreated');

    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Content flag not found'
      });
    }

    res.status(200).json({
      success: true,
      data: flag
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Review content flag
// @route   PUT /api/safety/flags/:id/review
// @access  Private (Admin/Teacher)
exports.reviewContentFlag = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (!['confirmed', 'false-positive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either confirmed or false-positive'
      });
    }

    const flag = await ContentFlag.findById(req.params.id);

    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Content flag not found'
      });
    }

    if (status === 'confirmed') {
      await flag.confirm(req.user._id, notes);
    } else {
      await flag.markFalsePositive(req.user._id, notes);
    }

    res.status(200).json({
      success: true,
      message: 'Content flag reviewed successfully',
      data: flag
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Report content (create flag)
// @route   POST /api/safety/flags
// @access  Private
exports.reportContent = async (req, res, next) => {
  try {
    const {
      childId,
      contentType,
      gameId,
      learningModuleId,
      flagReason,
      flagDetails,
      flaggedText
    } = req.body;

    const flag = await ContentFlag.create({
      child: childId,
      contentType,
      game: gameId,
      learningModule: learningModuleId,
      contentDescription: flagDetails || 'User reported content',
      flagReason,
      flagDetails,
      flaggedText,
      detectedBy: 'user-report',
      severity: 'medium'
    });

    // Create alert for parents
    await Alert.create({
      child: childId,
      type: 'inappropriate-content',
      severity: 'medium',
      title: 'Content Reported',
      titleArabic: 'تم الإبلاغ عن محتوى',
      message: `Content was reported for: ${flagReason}`,
      messageArabic: 'تم الإبلاغ عن المحتوى',
      triggeredBy: 'user-report',
      contentFlag: flag._id,
      shownToParent: true
    });

    res.status(201).json({
      success: true,
      message: 'Content reported successfully. Parents have been notified.',
      data: flag
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Analyze text for safety
// @route   POST /api/safety/analyze-text
// @access  Private
exports.analyzeText = async (req, res, next) => {
  try {
    const { text, childId, sessionId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const analysis = await safetyAlgorithms.analyzeText(text, childId, sessionId);

    res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Calculate child's risk score
// @route   GET /api/safety/child/:childId/risk-score
// @access  Private
exports.getRiskScore = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const riskScore = await safetyAlgorithms.calculateRiskScore(childId);

    res.status(200).json({
      success: true,
      data: riskScore
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get safety dashboard
// @route   GET /api/safety/child/:childId/dashboard
// @access  Private
exports.getSafetyDashboard = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Get unresolved alerts
    const unresolvedAlerts = await Alert.find({
      child: childId,
      resolved: false
    }).sort({ createdAt: -1 });

    // Get recent flags
    const recentFlags = await ContentFlag.find({
      child: childId
    }).sort({ createdAt: -1 }).limit(10);

    // Get risk score
    const riskScore = await safetyAlgorithms.calculateRiskScore(childId);

    // Get safety analytics for last 30 days
    const analytics = require('../utils/analytics');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const safetyAnalytics = await analytics.getSafetyAnalytics(
      childId,
      thirtyDaysAgo,
      new Date()
    );

    res.status(200).json({
      success: true,
      data: {
        riskScore,
        unresolvedAlerts: {
          count: unresolvedAlerts.length,
          alerts: unresolvedAlerts.slice(0, 5)
        },
        recentFlags: {
          count: recentFlags.length,
          flags: recentFlags
        },
        analytics: safetyAnalytics,
        settings: {
          contentFilterLevel: child.contentFilterLevel,
          dailyScreenTimeLimit: child.dailyScreenTimeLimit
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get alert statistics
// @route   GET /api/safety/statistics
// @access  Private (Admin only)
exports.getAlertStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Total alerts
    const totalAlerts = await Alert.countDocuments(query);

    // Alerts by type
    const alertsByType = await Alert.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Alerts by severity
    const alertsBySeverity = await Alert.aggregate([
      { $match: query },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Resolution rate
    const resolvedAlerts = await Alert.countDocuments({ ...query, resolved: true });
    const resolutionRate = totalAlerts > 0 
      ? Math.round((resolvedAlerts / totalAlerts) * 100) 
      : 0;

    // Content flags statistics
    const totalFlags = await ContentFlag.countDocuments(query);
    const confirmedFlags = await ContentFlag.countDocuments({ ...query, status: 'confirmed' });
    const falsePositives = await ContentFlag.countDocuments({ ...query, status: 'false-positive' });

    res.status(200).json({
      success: true,
      data: {
        alerts: {
          total: totalAlerts,
          resolved: resolvedAlerts,
          resolutionRate: resolutionRate,
          byType: alertsByType,
          bySeverity: alertsBySeverity
        },
        flags: {
          total: totalFlags,
          confirmed: confirmedFlags,
          falsePositives: falsePositives,
          accuracy: totalFlags > 0 
            ? Math.round((confirmedFlags / totalFlags) * 100) 
            : 0
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = exports;