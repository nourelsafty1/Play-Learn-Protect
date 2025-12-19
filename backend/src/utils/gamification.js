// src/utils/gamification.js

const Child = require('../models/Child');
const Achievement = require('../models/Achievement');
const Progress = require('../models/Progress');
const Leaderboard = require('../models/Leaderboard');

// Calculate points for completing an activity
exports.calculateActivityPoints = (activityType, performance) => {
  let basePoints = 0;

  // Base points by activity type
  switch (activityType) {
    case 'game-completion':
      basePoints = 100;
      break;
    case 'lesson-completion':
      basePoints = 150;
      break;
    case 'quiz-pass':
      basePoints = 200;
      break;
    case 'perfect-score':
      basePoints = 300;
      break;
    case 'daily-login':
      basePoints = 50;
      break;
    case 'streak-milestone':
      basePoints = 500;
      break;
    default:
      basePoints = 50;
  }

  // Multiply by performance (score percentage)
  if (performance && performance.score) {
    const multiplier = performance.score / 100;
    basePoints = Math.floor(basePoints * multiplier);
  }

  // Bonus for speed (if completed faster than average)
  if (performance && performance.timeSpent && performance.averageTime) {
    if (performance.timeSpent < performance.averageTime * 0.8) {
      basePoints += 50; // Speed bonus
    }
  }

  // Bonus for first attempt success
  if (performance && performance.attempts === 1 && performance.score >= 80) {
    basePoints += 100;
  }

  return basePoints;
};

// Calculate level based on total XP
exports.calculateLevel = (experiencePoints) => {
  // Level up every 1000 XP
  // Level 1: 0-999 XP
  // Level 2: 1000-1999 XP
  // Level 3: 2000-2999 XP, etc.
  return Math.floor(experiencePoints / 1000) + 1;
};

// Calculate XP needed for next level
exports.xpForNextLevel = (currentLevel) => {
  return currentLevel * 1000;
};

// Calculate progress to next level (percentage)
exports.levelProgress = (experiencePoints, currentLevel) => {
  const xpInCurrentLevel = experiencePoints % 1000;
  const xpNeeded = 1000;
  return Math.floor((xpInCurrentLevel / xpNeeded) * 100);
};

// Check if child earned any achievements
exports.checkAchievements = async (childId) => {
  try {
    const child = await Child.findById(childId)
      .populate('achievements.achievement');

    if (!child) {
      return [];
    }

    // Get all active achievements
    const allAchievements = await Achievement.find({ isActive: true });

    // Get child's progress records
    const progressRecords = await Progress.find({ child: childId });

    const newAchievements = [];

    for (const achievement of allAchievements) {
      // Check if child already has this achievement
      const alreadyEarned = child.achievements.some(
        a => a.achievement && a.achievement._id.toString() === achievement._id.toString()
      );

      if (alreadyEarned) continue;

      // Check if requirements are met
      const earned = await checkAchievementRequirements(
        achievement,
        child,
        progressRecords
      );

      if (earned) {
        // Add achievement to child
        child.achievements.push({
          achievement: achievement._id,
          earnedAt: Date.now()
        });

        // Add reward points
        child.totalPoints += achievement.pointsReward;
        child.experiencePoints += achievement.pointsReward;

        // Update achievement earned count
        achievement.timesEarned += 1;
        await achievement.save();

        newAchievements.push(achievement);
      }
    }

    // Update child's level if needed
    const newLevel = exports.calculateLevel(child.experiencePoints);
    if (newLevel > child.level) {
      child.level = newLevel;
    }

    await child.save();

    return newAchievements;

  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
};

// Helper function to check if specific achievement requirements are met
async function checkAchievementRequirements(achievement, child, progressRecords) {
  const req = achievement.requirements;

  // Check games completed
  if (req.gamesCompleted > 0) {
    const gamesCompleted = progressRecords.filter(
      p => p.contentType === 'game' && p.status === 'completed'
    ).length;

    if (gamesCompleted < req.gamesCompleted) return false;
  }

  // Check specific games
  if (req.specificGames && req.specificGames.length > 0) {
    const completedGameIds = progressRecords
      .filter(p => p.contentType === 'game' && p.status === 'completed')
      .map(p => p.game.toString());

    const hasAllGames = req.specificGames.every(
      gameId => completedGameIds.includes(gameId.toString())
    );

    if (!hasAllGames) return false;
  }

  // Check modules completed
  if (req.modulesCompleted > 0) {
    const modulesCompleted = progressRecords.filter(
      p => p.contentType === 'learning-module' && p.status === 'completed'
    ).length;

    if (modulesCompleted < req.modulesCompleted) return false;
  }

  // Check total points
  if (req.totalPoints > 0) {
    if (child.totalPoints < req.totalPoints) return false;
  }

  // Check streak days
  if (req.streakDays > 0) {
    if (child.currentStreak < req.streakDays) return false;
  }

  // Check level reached
  if (req.reachLevel > 0) {
    if (child.level < req.reachLevel) return false;
  }

  // Check perfect scores
  if (req.perfectScores > 0) {
    const perfectScores = progressRecords.filter(
      p => p.score === 100
    ).length;

    if (perfectScores < req.perfectScores) return false;
  }

  // All requirements met!
  return true;
}

// Update leaderboards
exports.updateLeaderboards = async (childId) => {
  try {
    const child = await Child.findById(childId);
    if (!child) return;

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Constant for All-Time period start
    const startOfTime = new Date(2000, 0, 1);
    const endOfTime = new Date(2100, 0, 1);

    // Get child's progress for different time periods
    const weeklyProgress = await Progress.find({
      child: childId,
      createdAt: { $gte: startOfTime } // Actually we need all progress for all-time score
    });

    const weeklyScore = weeklyProgress
      .filter(p => p.createdAt >= startOfWeek)
      .reduce((sum, p) => sum + p.pointsEarned, 0);

    const monthlyScore = weeklyProgress
      .filter(p => p.createdAt >= startOfMonth)
      .reduce((sum, p) => sum + p.pointsEarned, 0);

    const allTimeScore = child.totalPoints || 0;

    // Update global leaderboards
    await updateLeaderboardEntry('children', 'all-time', child, allTimeScore, startOfTime);
    await updateLeaderboardEntry('children', 'weekly', child, weeklyScore, startOfWeek);
    await updateLeaderboardEntry('children', 'monthly', child, monthlyScore, startOfMonth);

    // Update age-group leaderboards
    await updateLeaderboardEntry('age-group', 'all-time', child, allTimeScore, startOfTime);
    await updateLeaderboardEntry('age-group', 'weekly', child, weeklyScore, startOfWeek);
    await updateLeaderboardEntry('age-group', 'monthly', child, monthlyScore, startOfMonth);

  } catch (error) {
    console.error('Error updating leaderboards:', error);
  }
};

// Helper to update specific leaderboard entry
async function updateLeaderboardEntry(type, period, child, score, periodStart) {
  const periodEnd = new Date(periodStart);
  if (period === 'weekly') {
    periodEnd.setDate(periodEnd.getDate() + 7);
  } else if (period === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else if (period === 'all-time') {
    periodEnd.setFullYear(2100);
  }

  // Find or create leaderboard
  let leaderboard = await Leaderboard.findOne({
    type: type,
    period: period,
    ageGroup: type === 'age-group' ? child.ageGroup : null,
    periodStart: periodStart,
    periodEnd: periodEnd
  });

  if (!leaderboard) {
    leaderboard = await Leaderboard.create({
      type: type,
      period: period,
      ageGroup: type === 'age-group' ? child.ageGroup : null,
      periodStart: periodStart,
      periodEnd: periodEnd,
      rankings: []
    });
  }

  // Remove any existing entries for this child to prevent duplicates
  const otherRankings = leaderboard.rankings.filter(
    r => r.child && r.child.toString() !== child._id.toString()
  );

  const childData = {
    child: child._id,
    score: score,
    totalPoints: child.totalPoints,
    gamesCompleted: child.completedGames?.length || 0,
    modulesCompleted: child.completedLessons?.length || 0,
    achievementsEarned: child.achievements?.length || 0,
    currentStreak: child.currentStreak || 0
  };

  // Find current rank if it exists (to maintain it before sorting)
  const existingEntry = leaderboard.rankings.find(
    r => r.child && r.child.toString() === child._id.toString()
  );

  const newEntry = {
    rank: existingEntry ? existingEntry.rank : 0,
    ...childData
  };

  leaderboard.rankings = [...otherRankings, newEntry];

  // Sort rankings by score
  leaderboard.rankings.sort((a, b) => b.score - a.score);

  // Update ranks
  leaderboard.rankings = leaderboard.rankings.map((entry, index) => ({
    ...entry,
    previousRank: entry.rank || index + 1,
    rank: index + 1,
    rankChange: (entry.rank || index + 1) - (index + 1)
  }));

  leaderboard.lastUpdated = Date.now();
  await leaderboard.save();
}

// Award badge to child
exports.awardBadge = async (childId, badgeName, badgeIcon) => {
  try {
    const child = await Child.findById(childId);
    if (!child) return null;

    // Check if child already has this badge
    const hasBadge = child.badges.some(b => b.name === badgeName);
    if (hasBadge) return null;

    // Add badge
    child.badges.push({
      name: badgeName,
      icon: badgeIcon,
      earnedAt: Date.now()
    });

    await child.save();
    return child.badges[child.badges.length - 1];

  } catch (error) {
    console.error('Error awarding badge:', error);
    return null;
  }
};

// Calculate child's rank percentile
exports.calculatePercentile = async (childId) => {
  try {
    const child = await Child.findById(childId);
    if (!child) return 0;

    // Get all children in same age group
    const allChildren = await Child.find({
      ageGroup: child.ageGroup,
      isActive: true
    }).select('totalPoints');

    // Count how many have fewer points
    const childrenBelowScore = allChildren.filter(
      c => c.totalPoints < child.totalPoints
    ).length;

    // Calculate percentile
    const percentile = Math.floor((childrenBelowScore / allChildren.length) * 100);

    return percentile;

  } catch (error) {
    console.error('Error calculating percentile:', error);
    return 0;
  }
};

// Get suggested next activities for child
exports.getSuggestedActivities = async (childId) => {
  try {
    const child = await Child.findById(childId);
    if (!child) return [];

    const Game = require('../models/Game');
    const LearningModule = require('../models/LearningModule');

    // Get child's progress
    const completedGames = await Progress.find({
      child: childId,
      contentType: 'game',
      status: 'completed'
    }).select('game');

    const completedGameIds = completedGames.map(p => p.game);

    // Find games child hasn't completed yet, matching their age group
    const suggestedGames = await Game.find({
      _id: { $nin: completedGameIds },
      ageGroups: child.ageGroup,
      isActive: true,
      isPublished: true
    })
      .limit(5)
      .sort({ playCount: -1 }); // Popular games first

    // Find learning modules
    const completedModules = await Progress.find({
      child: childId,
      contentType: 'learning-module',
      status: 'completed'
    }).select('learningModule');

    const completedModuleIds = completedModules.map(p => p.learningModule);

    const suggestedModules = await LearningModule.find({
      _id: { $nin: completedModuleIds },
      ageGroups: child.ageGroup,
      isActive: true,
      isPublished: true
    })
      .limit(5)
      .sort({ enrollmentCount: -1 });

    return {
      games: suggestedGames,
      modules: suggestedModules
    };

  } catch (error) {
    console.error('Error getting suggested activities:', error);
    return { games: [], modules: [] };
  }
};

// Sync all children to leaderboards (initial run or maintenance)
exports.syncLeaderboards = async () => {
  try {
    const children = await Child.find({ isActive: true });
    console.log(`Syncing leaderboards for ${children.length} children...`);

    for (const child of children) {
      await exports.updateLeaderboards(child._id);
    }

    console.log('Leaderboard sync complete.');
    return true;
  } catch (error) {
    console.error('Error syncing leaderboards:', error);
    return false;
  }
};

module.exports = exports;