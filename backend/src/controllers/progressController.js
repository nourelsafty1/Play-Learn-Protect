// src/controllers/progressController.js

const Progress = require('../models/Progress');
const Child = require('../models/Child');
const Session = require('../models/Session');
const Leaderboard = require('../models/Leaderboard');
const LearningModule = require('../models/LearningModule');

// @desc    Get child's progress overview
// @route   GET /api/progress/child/:childId
// @access  Private
exports.getChildProgress = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const child = await Child.findById(childId);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Get all progress records
    const allProgress = await Progress.find({ child: childId })
      .populate('game', 'title thumbnail category')
      .populate('learningModule', 'title thumbnail subject');

    // Separate by type
    const gameProgress = allProgress.filter(p => p.contentType === 'game');
    const moduleProgress = allProgress.filter(p => p.contentType === 'learning-module');

    // Calculate statistics
    const stats = {
      games: {
        total: gameProgress.length,
        completed: gameProgress.filter(p => p.status === 'completed').length,
        inProgress: gameProgress.filter(p => p.status === 'in-progress').length,
        averageScore: gameProgress.length > 0
          ? Math.round(gameProgress.reduce((sum, p) => sum + p.score, 0) / gameProgress.length)
          : 0,
        totalTimeSpent: Math.round(gameProgress.reduce((sum, p) => sum + p.timeSpent, 0) / 60) // minutes
      },
      modules: {
        total: moduleProgress.length,
        completed: moduleProgress.filter(p => p.status === 'completed').length,
        inProgress: moduleProgress.filter(p => p.status === 'in-progress').length,
        averageScore: moduleProgress.length > 0
          ? Math.round(moduleProgress.reduce((sum, p) => sum + p.score, 0) / moduleProgress.length)
          : 0,
        totalTimeSpent: Math.round(moduleProgress.reduce((sum, p) => sum + p.timeSpent, 0) / 60)
      },
      overall: {
        totalPoints: child.totalPoints,
        level: child.level,
        currentStreak: child.currentStreak,
        longestStreak: child.longestStreak,
        achievementsEarned: child.achievements.length,
        badgesEarned: child.badges.length
      }
    };

    res.status(200).json({
      success: true,
      data: allProgress // Send all progress so frontend can filter
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get progress for specific content
// @route   GET /api/progress/:progressId
// @access  Private
exports.getProgress = async (req, res, next) => {
  try {
    const progress = await Progress.findById(req.params.progressId)
      .populate('child', 'name username avatar')
      .populate('game', 'title thumbnail')
      .populate('learningModule', 'title thumbnail');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: progress
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update progress
// @route   PUT /api/progress/:progressId
// @access  Private
exports.updateProgress = async (req, res, next) => {
  try {
    const { score, timeSpent, status } = req.body;

    let progress = await Progress.findById(req.params.progressId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress record not found'
      });
    }

    // Update fields
    if (score !== undefined) {
      progress.score = score;
      if (score > progress.bestScore) {
        progress.bestScore = score;
      }
    }

    if (timeSpent !== undefined) {
      progress.addTimeSpent(timeSpent);
    }

    if (status) {
      progress.status = status;
      if (status === 'completed' && !progress.completedAt) {
        progress.completedAt = Date.now();
      }
    }

    // Calculate completion percentage
    progress.calculateCompletion();

    await progress.save();

    // Update leaderboards
    const gamification = require('../utils/gamification');
    await gamification.updateLeaderboards(progress.child);

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: progress
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Complete a lesson
// @route   POST /api/progress/module/:moduleId/child/:childId/lesson/:lessonNumber/complete
// @access  Private
exports.completeLesson = async (req, res, next) => {
  try {
    const { moduleId, childId, lessonNumber } = req.params;
    const { timeSpent } = req.body;

    // Find or create progress record
    let progress = await Progress.findOne({
      child: childId,
      learningModule: moduleId,
      contentType: 'learning-module'
    });

    if (!progress) {
      // Create new progress record
      progress = await Progress.create({
        child: childId,
        learningModule: moduleId,
        contentType: 'learning-module',
        status: 'in-progress'
      });
    }

    // Check if lesson already completed
    const alreadyCompleted = progress.lessonsCompleted.some(
      l => l.lessonNumber === parseInt(lessonNumber)
    );

    if (!alreadyCompleted) {
      // Add to completed lessons
      progress.lessonsCompleted.push({
        lessonNumber: parseInt(lessonNumber),
        completedAt: new Date(),
        score: 100 // Default score for video lessons
      });

      // Update current lesson to next lesson
      progress.currentLesson = parseInt(lessonNumber) + 1;

      // Add time spent
      if (timeSpent) {
        progress.timeSpent += parseInt(timeSpent);
      }

      // Get module to calculate points
      const module = await LearningModule.findById(moduleId);
      if (module) {
        progress.pointsEarned += module.pointsPerLesson || 50;

        // Calculate completion percentage
        const totalLessons = module.lessons?.length || 0;
        const completedCount = progress.lessonsCompleted.length;
        progress.completionPercentage = Math.round((completedCount / totalLessons) * 100);

        // Check if all lessons completed
        if (completedCount >= totalLessons) {
          progress.status = 'completed';
          progress.completedAt = new Date();
          progress.pointsEarned += module.completionPoints || 0;
        }

        // Update child's points
        const child = await Child.findById(childId);
        if (child) {
          child.points += module.pointsPerLesson || 50;
          child.totalPoints += module.pointsPerLesson || 50;
          await child.save();
        }
      }

      progress.lastAccessedAt = new Date();
      await progress.save();
    }

    res.status(200).json({
      success: true,
      data: progress,
      message: 'Lesson completed successfully'
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    next(error);
  }
};

// @desc    Get progress for a specific module
// @route   GET /api/progress/child/:childId/module/:moduleId
// @access  Private
exports.getModuleProgress = async (req, res, next) => {
  try {
    const { childId, moduleId } = req.params;

    const progress = await Progress.findOne({
      child: childId,
      learningModule: moduleId,
      contentType: 'learning-module'
    }).populate('learningModule');

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error fetching module progress:', error);
    next(error);
  }
};

// @desc    Get leaderboard
// @route   GET /api/progress/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { type = 'children', period = 'all-time' } = req.query;
    let { ageGroup } = req.query;

    // Normalize ageGroup
    if (!ageGroup || ageGroup === '' || ageGroup === 'null' || ageGroup === 'undefined') {
      ageGroup = null;
    }

    // Calculate period dates
    const today = new Date();
    let periodStart, periodEnd;

    if (period === 'daily') {
      periodStart = new Date(today);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(today);
      periodEnd.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
      periodStart = new Date(today);
      periodStart.setDate(today.getDate() - today.getDay());
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 7);
    } else if (period === 'monthly') {
      periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
      periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    } else {
      // Default to all-time (large range)
      periodStart = new Date(2000, 0, 1);
      periodEnd = new Date(2100, 0, 1);
    }

    // Find leaderboard
    const query = {
      type: type,
      period: period,
      periodStart: periodStart
    };

    if (type === 'age-group') {
      if (ageGroup) query.ageGroup = ageGroup;
    } else {
      query.ageGroup = null;
    }

    let leaderboard = await Leaderboard.findOne(query)
      .populate({
        path: 'rankings.child',
        select: 'name username avatar level'
      });

    // If leaderboard doesn't exist, create it and sync
    if (!leaderboard) {
      leaderboard = await Leaderboard.create({
        type: type,
        period: period,
        ageGroup: type === 'age-group' ? ageGroup : null,
        periodStart: periodStart,
        periodEnd: periodEnd,
        rankings: []
      });

      // Sync data if empty
      const gamification = require('../utils/gamification');
      await gamification.syncLeaderboards();

      // Re-fetch with rankings
      leaderboard = await Leaderboard.findById(leaderboard._id)
        .populate({
          path: 'rankings.child',
          select: 'name username avatar level'
        });
    } else if (leaderboard.rankings.length === 0) {
      // Sync if rankings are empty
      const gamification = require('../utils/gamification');
      await gamification.syncLeaderboards();

      // Re-fetch
      leaderboard = await Leaderboard.findById(leaderboard._id)
        .populate({
          path: 'rankings.child',
          select: 'name username avatar level'
        });
    }

    res.status(200).json({
      success: true,
      data: {
        type: leaderboard.type,
        period: leaderboard.period,
        ageGroup: leaderboard.ageGroup,
        periodStart: leaderboard.periodStart,
        periodEnd: leaderboard.periodEnd,
        lastUpdated: leaderboard.lastUpdated,
        rankings: leaderboard.rankings
          .filter(r => r.child) // Filter out null children (deleted/orphaned)
          .slice(0, 100) // Top 100
      }
    });

    // Background cleanup of duplicates if any exist
    if (leaderboard && leaderboard.rankings.length > 0) {
      const seen = new Set();
      const initialCount = leaderboard.rankings.length;
      const uniqueRankings = leaderboard.rankings.filter(r => {
        if (!r.child) return false; // This also cleans up the DB on next fetch
        const id = r.child._id ? r.child._id.toString() : r.child.toString();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      if (uniqueRankings.length !== initialCount) {
        leaderboard.rankings = uniqueRankings;
        await leaderboard.save();
      }
    }

  } catch (error) {
    next(error);
  }
};

// @desc    Get child's rank
// @route   GET /api/progress/child/:childId/rank
// @access  Private
exports.getChildRank = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { period = 'weekly' } = req.query;

    const child = await Child.findById(childId);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Get leaderboards
    const today = new Date();
    let periodStart;

    if (period === 'weekly') {
      periodStart = new Date(today);
      periodStart.setDate(today.getDate() - today.getDay());
      periodStart.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    // Find in global leaderboard
    const globalLeaderboard = await Leaderboard.findOne({
      type: 'children',
      period: period,
      periodStart: periodStart
    });

    let globalRank = null;
    if (globalLeaderboard) {
      const ranking = globalLeaderboard.rankings.find(
        r => r.child.toString() === childId
      );
      if (ranking) {
        globalRank = {
          rank: ranking.rank,
          totalParticipants: globalLeaderboard.rankings.length,
          score: ranking.score,
          rankChange: ranking.rankChange
        };
      }
    }

    // Find in age group leaderboard
    const ageGroupLeaderboard = await Leaderboard.findOne({
      type: 'age-group',
      period: period,
      ageGroup: child.ageGroup,
      periodStart: periodStart
    });

    let ageGroupRank = null;
    if (ageGroupLeaderboard) {
      const ranking = ageGroupLeaderboard.rankings.find(
        r => r.child.toString() === childId
      );
      if (ranking) {
        ageGroupRank = {
          rank: ranking.rank,
          totalParticipants: ageGroupLeaderboard.rankings.length,
          score: ranking.score,
          rankChange: ranking.rankChange
        };
      }
    }

    // Calculate percentile
    const gamification = require('../utils/gamification');
    const percentile = await gamification.calculatePercentile(childId);

    res.status(200).json({
      success: true,
      data: {
        globalRank: globalRank,
        ageGroupRank: ageGroupRank,
        percentile: percentile,
        totalPoints: child.totalPoints,
        level: child.level
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get subject-wise progress
// @route   GET /api/progress/child/:childId/subjects
// @access  Private
exports.getSubjectProgress = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const allProgress = await Progress.find({ child: childId })
      .populate('game', 'category')
      .populate('learningModule', 'subject');

    // Group by subject/category
    const subjectStats = {};

    allProgress.forEach(progress => {
      let subject = 'other';

      if (progress.game && progress.game.category) {
        subject = progress.game.category;
      } else if (progress.learningModule && progress.learningModule.subject) {
        subject = progress.learningModule.subject;
      }

      if (!subjectStats[subject]) {
        subjectStats[subject] = {
          subject: subject,
          total: 0,
          completed: 0,
          inProgress: 0,
          totalScore: 0,
          count: 0,
          timeSpent: 0
        };
      }

      subjectStats[subject].total++;
      if (progress.status === 'completed') subjectStats[subject].completed++;
      if (progress.status === 'in-progress') subjectStats[subject].inProgress++;
      subjectStats[subject].totalScore += progress.score;
      subjectStats[subject].count++;
      subjectStats[subject].timeSpent += progress.timeSpent;
    });

    // Calculate averages
    Object.keys(subjectStats).forEach(subject => {
      const stats = subjectStats[subject];
      stats.averageScore = stats.count > 0
        ? Math.round(stats.totalScore / stats.count)
        : 0;
      stats.timeSpent = Math.round(stats.timeSpent / 60); // Convert to minutes
      delete stats.totalScore;
      delete stats.count;
    });

    // Convert to array and sort by average score
    const subjectsArray = Object.values(subjectStats)
      .sort((a, b) => b.averageScore - a.averageScore);

    res.status(200).json({
      success: true,
      data: subjectsArray
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get achievements for child
// @route   GET /api/progress/child/:childId/achievements
// @access  Private
exports.getChildAchievements = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const child = await Child.findById(childId)
      .populate('achievements.achievement');

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Get all available achievements
    const Achievement = require('../models/Achievement');
    const allAchievements = await Achievement.find({
      isActive: true,
      ageGroups: child.ageGroup
    });

    // Mark which ones are earned
    const achievementsWithStatus = allAchievements.map(achievement => {
      const earned = child.achievements.find(
        a => a.achievement && a.achievement._id.toString() === achievement._id.toString()
      );

      return {
        ...achievement.toObject(),
        earned: !!earned,
        earnedAt: earned ? earned.earnedAt : null,
        isSecret: achievement.isSecret && !earned // Hide secret achievements until earned
      };
    });

    // Filter out unearned secret achievements
    const visibleAchievements = achievementsWithStatus.filter(
      a => !a.isSecret || a.earned
    );

    res.status(200).json({
      success: true,
      data: {
        earned: child.achievements.length,
        total: allAchievements.length,
        achievements: visibleAchievements
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = exports;