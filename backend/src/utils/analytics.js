// src/utils/analytics.js

const Session = require('../models/Session');
const Progress = require('../models/Progress');
const Alert = require('../models/Alert');
const ContentFlag = require('../models/ContentFlag');

// Get screen time analytics for a child
exports.getScreenTimeAnalytics = async (childId, startDate, endDate) => {
  try {
    const sessions = await Session.find({
      child: childId,
      startTime: { $gte: startDate, $lte: endDate }
    }).sort({ startTime: 1 });
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalTime: 0,
        averageSessionTime: 0,
        dailyBreakdown: [],
        activityBreakdown: {},
        peakUsageHours: []
      };
    }
    
    // Calculate total time (in minutes)
    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0) / 60;
    
    // Average session time
    const averageSessionTime = totalTime / sessions.length;
    
    // Daily breakdown
    const dailyBreakdown = [];
    const dayMap = new Map();
    
    sessions.forEach(session => {
      const day = session.startTime.toISOString().split('T')[0];
      if (!dayMap.has(day)) {
        dayMap.set(day, { date: day, minutes: 0, sessions: 0 });
      }
      const dayData = dayMap.get(day);
      dayData.minutes += session.duration / 60;
      dayData.sessions += 1;
    });
    
    dayMap.forEach(value => dailyBreakdown.push(value));
    
    // Activity breakdown
    const activityBreakdown = {
      games: 0,
      learning: 0,
      creative: 0,
      other: 0
    };
    
    sessions.forEach(session => {
      session.activities.forEach(activity => {
        const minutes = activity.duration / 60;
        if (activity.activityType === 'game') {
          activityBreakdown.games += minutes;
        } else if (activity.activityType === 'learning-module') {
          activityBreakdown.learning += minutes;
        } else if (activity.activityType === 'creative') {
          activityBreakdown.creative += minutes;
        } else {
          activityBreakdown.other += minutes;
        }
      });
    });
    
    // Peak usage hours (which hours of day are most active)
    const hourMap = new Array(24).fill(0);
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      hourMap[hour] += session.duration / 60;
    });
    
    const peakUsageHours = hourMap
      .map((minutes, hour) => ({ hour, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 3);
    
    return {
      totalSessions: sessions.length,
      totalTime: Math.round(totalTime),
      averageSessionTime: Math.round(averageSessionTime),
      dailyBreakdown,
      activityBreakdown,
      peakUsageHours
    };
    
  } catch (error) {
    console.error('Error getting screen time analytics:', error);
    throw error;
  }
};

// Get learning progress analytics
exports.getLearningAnalytics = async (childId, startDate, endDate) => {
  try {
    const progress = await Progress.find({
      child: childId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('game learningModule');
    
    // Games statistics
    const gameProgress = progress.filter(p => p.contentType === 'game');
    const gamesCompleted = gameProgress.filter(p => p.status === 'completed').length;
    const gamesInProgress = gameProgress.filter(p => p.status === 'in-progress').length;
    const averageGameScore = gameProgress.length > 0
      ? gameProgress.reduce((sum, p) => sum + p.score, 0) / gameProgress.length
      : 0;
    
    // Learning modules statistics
    const moduleProgress = progress.filter(p => p.contentType === 'learning-module');
    const modulesCompleted = moduleProgress.filter(p => p.status === 'completed').length;
    const modulesInProgress = moduleProgress.filter(p => p.status === 'in-progress').length;
    const averageModuleScore = moduleProgress.length > 0
      ? moduleProgress.reduce((sum, p) => sum + p.score, 0) / moduleProgress.length
      : 0;
    
    // Subject breakdown
    const subjectBreakdown = {};
    progress.forEach(p => {
      let subject = 'other';
      if (p.game && p.game.category) {
        subject = p.game.category;
      } else if (p.learningModule && p.learningModule.subject) {
        subject = p.learningModule.subject;
      }
      
      if (!subjectBreakdown[subject]) {
        subjectBreakdown[subject] = {
          completed: 0,
          inProgress: 0,
          totalTime: 0,
          averageScore: 0,
          count: 0
        };
      }
      
      if (p.status === 'completed') subjectBreakdown[subject].completed++;
      if (p.status === 'in-progress') subjectBreakdown[subject].inProgress++;
      subjectBreakdown[subject].totalTime += p.timeSpent / 60;
      subjectBreakdown[subject].averageScore += p.score;
      subjectBreakdown[subject].count++;
    });
    
    // Calculate average scores for each subject
    Object.keys(subjectBreakdown).forEach(subject => {
      const data = subjectBreakdown[subject];
      data.averageScore = data.count > 0 ? data.averageScore / data.count : 0;
      data.totalTime = Math.round(data.totalTime);
      data.averageScore = Math.round(data.averageScore);
    });
    
    // Strengths and weaknesses
    const subjects = Object.entries(subjectBreakdown)
      .sort((a, b) => b[1].averageScore - a[1].averageScore);
    
    const strengths = subjects.slice(0, 3).map(([subject, data]) => ({
      subject,
      score: data.averageScore
    }));
    
    const weaknesses = subjects.slice(-3).reverse().map(([subject, data]) => ({
      subject,
      score: data.averageScore
    }));
    
    // Total points earned
    const totalPointsEarned = progress.reduce((sum, p) => sum + p.pointsEarned, 0);
    
    return {
      games: {
        completed: gamesCompleted,
        inProgress: gamesInProgress,
        averageScore: Math.round(averageGameScore)
      },
      modules: {
        completed: modulesCompleted,
        inProgress: modulesInProgress,
        averageScore: Math.round(averageModuleScore)
      },
      subjectBreakdown,
      strengths,
      weaknesses,
      totalPointsEarned,
      totalActivities: progress.length
    };
    
  } catch (error) {
    console.error('Error getting learning analytics:', error);
    throw error;
  }
};

// Get safety analytics
exports.getSafetyAnalytics = async (childId, startDate, endDate) => {
  try {
    // Get all alerts
    const alerts = await Alert.find({
      child: childId,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Get all content flags
    const flags = await ContentFlag.find({
      child: childId,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Alert breakdown by type
    const alertsByType = {};
    alerts.forEach(alert => {
      if (!alertsByType[alert.type]) {
        alertsByType[alert.type] = { count: 0, severity: {} };
      }
      alertsByType[alert.type].count++;
      
      if (!alertsByType[alert.type].severity[alert.severity]) {
        alertsByType[alert.type].severity[alert.severity] = 0;
      }
      alertsByType[alert.type].severity[alert.severity]++;
    });
    
    // Flags breakdown by reason
    const flagsByReason = {};
    flags.forEach(flag => {
      if (!flagsByReason[flag.flagReason]) {
        flagsByReason[flag.flagReason] = 0;
      }
      flagsByReason[flag.flagReason]++;
    });
    
    // Count resolved vs unresolved
    const resolvedAlerts = alerts.filter(a => a.resolved).length;
    const unresolvedAlerts = alerts.filter(a => !a.resolved).length;
    
    const confirmedFlags = flags.filter(f => f.status === 'confirmed').length;
    const falsePositiveFlags = flags.filter(f => f.status === 'false-positive').length;
    
    // Safety score (0-100, higher is better)
    // Fewer critical alerts = better score
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const highAlerts = alerts.filter(a => a.severity === 'high').length;
    
    let safetyScore = 100;
    safetyScore -= criticalAlerts * 10;
    safetyScore -= highAlerts * 5;
    safetyScore -= confirmedFlags * 3;
    safetyScore = Math.max(0, safetyScore);
    
    // Recent incidents (last 5)
    const recentIncidents = alerts
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(alert => ({
        type: alert.type,
        severity: alert.severity,
        date: alert.createdAt,
        resolved: alert.resolved
      }));
    
    return {
      totalAlerts: alerts.length,
      alertsByType,
      resolvedAlerts,
      unresolvedAlerts,
      totalFlags: flags.length,
      flagsByReason,
      confirmedFlags,
      falsePositiveFlags,
      safetyScore,
      recentIncidents
    };
    
  } catch (error) {
    console.error('Error getting safety analytics:', error);
    throw error;
  }
};

// Generate weekly report for parents
exports.generateWeeklyReport = async (childId) => {
  try {
    const Child = require('../models/Child');
    const child = await Child.findById(childId);
    
    if (!child) {
      throw new Error('Child not found');
    }
    
    // Get data for past 7 days
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const screenTime = await exports.getScreenTimeAnalytics(childId, weekAgo, today);
    const learning = await exports.getLearningAnalytics(childId, weekAgo, today);
    const safety = await exports.getSafetyAnalytics(childId, weekAgo, today);
    
    // Calculate engagement level
    let engagementLevel = 'low';
    if (screenTime.totalSessions >= 5) engagementLevel = 'medium';
    if (screenTime.totalSessions >= 10) engagementLevel = 'high';
    
    // Achievements this week
    const weekAchievements = child.achievements.filter(
      a => a.earnedAt >= weekAgo
    );
    
    // Generate recommendations
    const recommendations = [];
    
    if (learning.weaknesses.length > 0) {
      recommendations.push({
        type: 'improvement',
        message: `Consider more practice in ${learning.weaknesses[0].subject}`,
        priority: 'medium'
      });
    }
    
    if (screenTime.totalTime > child.dailyScreenTimeLimit * 7) {
      recommendations.push({
        type: 'screen-time',
        message: 'Child exceeded weekly screen time goals',
        priority: 'high'
      });
    }
    
    if (child.currentStreak >= 7) {
      recommendations.push({
        type: 'positive',
        message: 'Great job maintaining a 7-day streak!',
        priority: 'low'
      });
    }
    
    if (safety.totalAlerts > 0) {
      recommendations.push({
        type: 'safety',
        message: `${safety.totalAlerts} safety alerts this week`,
        priority: safety.unresolvedAlerts > 0 ? 'high' : 'medium'
      });
    }
    
    return {
      child: {
        name: child.name,
        ageGroup: child.ageGroup,
        level: child.level,
        totalPoints: child.totalPoints
      },
      period: {
        start: weekAgo,
        end: today
      },
      screenTime,
      learning,
      safety,
      engagementLevel,
      achievementsEarned: weekAchievements.length,
      currentStreak: child.currentStreak,
      recommendations
    };
    
  } catch (error) {
    console.error('Error generating weekly report:', error);
    throw error;
  }
};

// Detect unusual patterns (for safety)
exports.detectUnusualPatterns = async (childId) => {
  try {
    const Child = require('../models/Child');
    const child = await Child.findById(childId);
    
    if (!child) {
      return { patterns: [], riskLevel: 'low' };
    }
    
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const sessions = await Session.find({
      child: childId,
      startTime: { $gte: weekAgo }
    });
    
    const patterns = [];
    let riskLevel = 'low';
    
    // Check for excessive late-night usage
    const lateNightSessions = sessions.filter(s => {
      const hour = s.startTime.getHours();
      return hour >= 22 || hour <= 5; // 10 PM to 5 AM
    });
    
    if (lateNightSessions.length >= 3) {
      patterns.push({
        type: 'late-night-usage',
        description: 'Multiple late-night sessions detected',
        severity: 'medium',
        count: lateNightSessions.length
      });
      riskLevel = 'medium';
    }
    
    // Check for sudden increase in session duration
    if (sessions.length >= 3) {
      const recentAvg = sessions.slice(-3).reduce((sum, s) => sum + s.duration, 0) / 3;
      const olderAvg = sessions.slice(0, -3).reduce((sum, s) => sum + s.duration, 0) / Math.max(sessions.length - 3, 1);
      
      if (recentAvg > olderAvg * 1.5) {
        patterns.push({
          type: 'increased-usage',
          description: 'Significant increase in session duration',
          severity: 'low',
          percentageIncrease: Math.round(((recentAvg - olderAvg) / olderAvg) * 100)
        });
      }
    }
    
    // Check for multiple safety flags
    const recentFlags = await ContentFlag.find({
      child: childId,
      createdAt: { $gte: weekAgo }
    });
    
    if (recentFlags.length >= 3) {
      patterns.push({
        type: 'multiple-safety-flags',
        description: 'Multiple content flags triggered',
        severity: 'high',
        count: recentFlags.length
      });
      riskLevel = 'high';
    }
    
    const oldWeekStart = new Date(weekAgo.getTime() - 7 *24 * 60 * 60 * 1000);
    const oldWeekSessions = await Session.find({
    child: childId,
    startTime: { $gte: oldWeekStart, $lt: weekAgo }
    });
    if (oldWeekSessions.length >= 5 && sessions.length <= 2) {
    patterns.push({
    type: 'dropped-engagement',
    description: 'Significant decrease in activity',
    severity: 'low',
    previousSessions: oldWeekSessions.length,
    currentSessions: sessions.length
  });
}

return {
  patterns,
  riskLevel,
  lastChecked: today
};
} catch (error) {
console.error('Error detecting unusual patterns:', error);
return { patterns: [], riskLevel: 'low' };
}
};
module.exports = exports;