// src/middleware/contentFilter.js

const ContentFlag = require('../models/ContentFlag');
const Alert = require('../models/Alert');

// Lists of inappropriate keywords (simplified - you'd expand this)
const inappropriateWords = [
  // Add inappropriate words here
  // This is just an example structure
  'badword1',
  'badword2',
  // ... more words
];

const cyberbullyingKeywords = [
  'hate',
  'stupid',
  'ugly',
  'kill yourself',
  'loser',
  'nobody likes you',
  // ... more phrases
];

// Check text content for inappropriate language
exports.checkTextContent = async (text, childId, sessionId) => {
  const results = {
    isSafe: true,
    flagged: false,
    flags: [],
    confidenceScore: 0
  };

  if (!text || typeof text !== 'string') {
    return results;
  }

  const lowerText = text.toLowerCase();

  // Check for inappropriate language
  const foundInappropriate = inappropriateWords.filter(word => 
    lowerText.includes(word.toLowerCase())
  );

  if (foundInappropriate.length > 0) {
    results.isSafe = false;
    results.flagged = true;
    results.flags.push({
      type: 'inappropriate-language',
      words: foundInappropriate,
      severity: 'high'
    });
    results.confidenceScore = 90;
  }

  // Check for cyberbullying
  const foundBullying = cyberbullyingKeywords.filter(phrase => 
    lowerText.includes(phrase.toLowerCase())
  );

  if (foundBullying.length > 0) {
    results.isSafe = false;
    results.flagged = true;
    results.flags.push({
      type: 'cyberbullying',
      phrases: foundBullying,
      severity: 'critical'
    });
    results.confidenceScore = Math.max(results.confidenceScore, 85);
  }

  // Check for personal information patterns
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  
  if (emailPattern.test(text) || phonePattern.test(text)) {
    results.isSafe = false;
    results.flagged = true;
    results.flags.push({
      type: 'personal-info',
      severity: 'high'
    });
    results.confidenceScore = Math.max(results.confidenceScore, 95);
  }

  // If content is flagged, create a ContentFlag record
  if (results.flagged && childId) {
    try {
      const contentFlag = await ContentFlag.create({
        child: childId,
        session: sessionId,
        contentType: 'user-generated',
        contentDescription: 'Text content analysis',
        flagReason: results.flags[0].type,
        flagDetails: JSON.stringify(results.flags),
        detectedBy: 'automated',
        detectionAlgorithm: 'keyword-matching',
        confidenceScore: results.confidenceScore,
        flaggedText: text,
        severity: results.flags[0].severity
      });

      results.contentFlagId = contentFlag._id;
    } catch (error) {
      console.error('Error creating content flag:', error);
    }
  }

  return results;
};

// Middleware to filter request body text
exports.filterRequestContent = async (req, res, next) => {
  // Only check if there's text content and a child is involved
  if (!req.body || !req.body.childId) {
    return next();
  }

  const textsToCheck = [];
  
  // Collect all text fields from request
  if (req.body.message) textsToCheck.push(req.body.message);
  if (req.body.comment) textsToCheck.push(req.body.comment);
  if (req.body.feedback) textsToCheck.push(req.body.feedback);
  if (req.body.content) textsToCheck.push(req.body.content);

  if (textsToCheck.length === 0) {
    return next();
  }

  try {
    // Check all text content
    const allText = textsToCheck.join(' ');
    const filterResult = await exports.checkTextContent(
      allText,
      req.body.childId,
      req.body.sessionId
    );

    // If content is flagged, block the request
    if (!filterResult.isSafe) {
      // Create an alert for parents
      if (req.body.childId) {
        await Alert.create({
          child: req.body.childId,
          session: req.body.sessionId,
          type: 'inappropriate-content',
          severity: filterResult.flags[0].severity,
          title: 'Inappropriate Content Detected',
          titleArabic: 'تم اكتشاف محتوى غير مناسب',
          message: `Content was blocked due to: ${filterResult.flags[0].type}`,
          messageArabic: 'تم حظر المحتوى بسبب مخاوف تتعلق بالسلامة',
          educationalTip: 'Remember to always use kind and appropriate language online.',
          educationalTipArabic: 'تذكر دائماً استخدام لغة لطيفة ومناسبة على الإنترنت',
          triggeredBy: 'content-filter',
          context: filterResult,
          contentFlag: filterResult.contentFlagId,
          shownToChild: true,
          shownToParent: true,
          actionTaken: 'content-blocked',
          contentBlocked: true
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Your content contains inappropriate language. Please use kind and respectful words.',
        messageArabic: 'يحتوي المحتوى الخاص بك على لغة غير مناسبة. يرجى استخدام كلمات لطيفة ومحترمة.',
        flagged: true,
        type: filterResult.flags[0].type
      });
    }

    // Content is safe, continue
    next();
  } catch (error) {
    console.error('Error in content filter:', error);
    // On error, allow content through but log the error
    next();
  }
};

// Check if child's screen time limit is exceeded
exports.checkScreenTimeLimit = async (req, res, next) => {
  if (!req.body.childId) {
    return next();
  }

  try {
    const Child = require('../models/Child');
    const Session = require('../models/Session');

    const child = await Child.findById(req.body.childId);
    
    if (!child) {
      return next();
    }

    // Get today's sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sessions = await Session.find({
      child: child._id,
      startTime: { $gte: today }
    });

    // Calculate total time today (in seconds)
    const totalTimeToday = sessions.reduce((sum, session) => sum + session.duration, 0);
    const totalMinutesToday = Math.floor(totalTimeToday / 60);

    // Check if limit exceeded
    if (totalMinutesToday >= child.dailyScreenTimeLimit) {
      // Create alert
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
          timeToday: totalMinutesToday,
          limit: child.dailyScreenTimeLimit
        },
        shownToChild: true,
        shownToParent: true,
        actionTaken: 'session-paused'
      });

      return res.status(403).json({
        success: false,
        message: 'Screen time limit reached for today',
        messageArabic: 'تم الوصول إلى حد وقت الشاشة لهذا اليوم',
        timeUsed: totalMinutesToday,
        limit: child.dailyScreenTimeLimit,
        limitReached: true
      });
    }

    // Warning at 80% of limit
    if (totalMinutesToday >= child.dailyScreenTimeLimit * 0.8 && 
        totalMinutesToday < child.dailyScreenTimeLimit) {
      const remaining = child.dailyScreenTimeLimit - totalMinutesToday;
      
      await Alert.create({
        child: child._id,
        type: 'screen-time-warning',
        severity: 'low',
        title: 'Screen Time Warning',
        titleArabic: 'تحذير وقت الشاشة',
        message: `You have ${remaining} minutes left today.`,
        messageArabic: `لديك ${remaining} دقيقة متبقية اليوم.`,
        educationalTip: 'Consider taking a break soon!',
        educationalTipArabic: 'فكر في أخذ استراحة قريباً!',
        triggeredBy: 'screen-time-monitor',
        context: {
          timeToday: totalMinutesToday,
          limit: child.dailyScreenTimeLimit,
          remaining: remaining
        },
        shownToChild: true,
        actionTaken: 'warning-shown'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking screen time:', error);
    next();
  }
};