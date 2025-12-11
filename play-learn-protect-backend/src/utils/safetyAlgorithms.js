const ContentFlag = require('../models/ContentFlag');
const Alert = require('../models/Alert');

// Comprehensive list of inappropriate keywords (EXAMPLE - expand this significantly)
const inappropriateKeywords = {
  // Profanity tier 1 (mild)
  mild: ['damn', 'hell', 'crap', 'stupid', 'idiot', 'dumb'],
  
  // Profanity tier 2 (moderate)
  moderate: ['shut up', 'hate you', 'ugly', 'loser', 'freak'],
  
  // Profanity tier 3 (severe) - examples only, add actual words
  severe: ['son of a bitch', 'slut'],
  
  // Violence-related
  violence: ['kill', 'die', 'hurt', 'blood', 'weapon', 'fight', 'attack'],
  
  // Cyberbullying
  bullying: [
    'nobody likes you',
    'you suck',
    'go away',
    'you\'re worthless',
    'kill yourself',
    'end it all',
    'you\'re pathetic'
  ],
  
  // Personal information requests
  personalInfo: [
    'what\'s your address',
    'where do you live',
    'what school',
    'phone number',
    'send me a picture',
    'meet me at'
  ]
};

// Analyze text for safety concerns
exports.analyzeText = async (text, childId, sessionId) => {
  const results = {
    isSafe: true,
    flags: [],
    severity: 'low',
    confidenceScore: 0,
    recommendations: []
  };
  
  if (!text || typeof text !== 'string') {
    return results;
  }
  
  const lowerText = text.toLowerCase().trim();
  
  // Check for inappropriate language
  const profanityCheck = checkProfanity(lowerText);
  if (!profanityCheck.isSafe) {
    results.isSafe = false;
    results.flags.push(profanityCheck);
    results.severity = profanityCheck.severity;
    results.confidenceScore = Math.max(results.confidenceScore, profanityCheck.confidence);
  }
  
  // Check for cyberbullying
  const bullyingCheck = checkCyberbullying(lowerText);
  if (!bullyingCheck.isSafe) {
    results.isSafe = false;
    results.flags.push(bullyingCheck);
    results.severity = 'critical';
    results.confidenceScore = Math.max(results.confidenceScore, bullyingCheck.confidence);
  }
  
  // Check for violence
  const violenceCheck = checkViolence(lowerText);
  if (!violenceCheck.isSafe) {
    results.isSafe = false;
    results.flags.push(violenceCheck);
    results.severity = 'high';
    results.confidenceScore = Math.max(results.confidenceScore, violenceCheck.confidence);
  }
  
  // Check for personal information
  const personalInfoCheck = checkPersonalInfo(text); // Use original text for pattern matching
  if (!personalInfoCheck.isSafe) {
    results.isSafe = false;
    results.flags.push(personalInfoCheck);
    results.severity = 'critical';
    results.confidenceScore = Math.max(results.confidenceScore, personalInfoCheck.confidence);
  }
  
  // Generate recommendations
  if (!results.isSafe) {
    results.recommendations = generateSafetyRecommendations(results.flags);
    
    // Create content flag in database
    if (childId) {
      await createContentFlag(childId, sessionId, text, results);
    }
  }
  
  return results;
};

// Check for profanity
function checkProfanity(text) {
  const result = {
    type: 'inappropriate-language',
    isSafe: true,
    severity: 'low',
    confidence: 0,
    matchedWords: []
  };
  
  // Check each tier
  let maxSeverity = 'low';
  
  // Check mild profanity
  inappropriateKeywords.mild.forEach(word => {
    if (text.includes(word)) {
      result.isSafe = false;
      result.matchedWords.push(word);
      result.confidence = 70;
    }
  });
  
  // Check moderate profanity
  inappropriateKeywords.moderate.forEach(word => {
    if (text.includes(word)) {
      result.isSafe = false;
      result.matchedWords.push(word);
      result.severity = 'medium';
      result.confidence = 80;
      maxSeverity = 'medium';
    }
  });
  
  // Check severe profanity
  inappropriateKeywords.severe.forEach(word => {
    if (text.includes(word)) {
      result.isSafe = false;
      result.matchedWords.push(word);
      result.severity = 'high';
      result.confidence = 95;
      maxSeverity = 'high';
    }
  });
  
  result.severity = maxSeverity;
  return result;
}

// Check for cyberbullying
function checkCyberbullying(text) {
  const result = {
    type: 'cyberbullying',
    isSafe: true,
    severity: 'critical',
    confidence: 0,
    matchedPhrases: []
  };
  
  inappropriateKeywords.bullying.forEach(phrase => {
    if (text.includes(phrase)) {
      result.isSafe = false;
      result.matchedPhrases.push(phrase);
      result.confidence = 90;
    }
  });
  
  // Check for repetition (sign of harassment)
  const words = text.split(' ');
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  const repeatedWords = Object.entries(wordCount).filter(([word, count]) => 
    count >= 3 && word.length > 3
  );
  
  if (repeatedWords.length > 0) {
    result.confidence = Math.max(result.confidence, 60);
  }
  
  return result;
}

// Check for violence
function checkViolence(text) {
  const result = {
    type: 'violence',
    isSafe: true,
    severity: 'high',
    confidence: 0,
    matchedWords: []
  };
  
  inappropriateKeywords.violence.forEach(word => {
    if (text.includes(word)) {
      result.isSafe = false;
      result.matchedWords.push(word);
      result.confidence = 85;
    }
  });
  
  return result;
}

// Check for personal information
function checkPersonalInfo(text) {
  const result = {
    type: 'personal-info-request',
    isSafe: true,
    severity: 'critical',
    confidence: 0,
    patterns: []
  };
  
  // Email pattern
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  if (emailPattern.test(text)) {
    result.isSafe = false;
    result.patterns.push('email-address');
    result.confidence = 98;
  }
  
  // Phone number patterns
  const phonePatterns = [
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // US format
    /\d{11}/g, // Simple 11 digits
    /\d{3}[-.\s]\d{4}[-.\s]\d{4}/g // Egyptian format
  ];
  
  phonePatterns.forEach(pattern => {
    if (pattern.test(text)) {
      result.isSafe = false;
      result.patterns.push('phone-number');
      result.confidence = 95;
    }
  });
  
  // Address patterns
  const addressKeywords = ['street', 'avenue', 'road', 'apt', 'apartment', 'building', 'floor'];
  const lowerText = text.toLowerCase();
  let addressMatches = 0;
  
  addressKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) addressMatches++;
  });
  
  if (addressMatches >= 2) {
    result.isSafe = false;
    result.patterns.push('address');
    result.confidence = 75;
  }
  
  // Personal info requests
  inappropriateKeywords.personalInfo.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      result.isSafe = false;
      result.patterns.push('info-request');
      result.confidence = Math.max(result.confidence, 90);
    }
  });
  
  return result;
}

// Generate safety recommendations based on flags
function generateSafetyRecommendations(flags) {
  const recommendations = [];
  
  flags.forEach(flag => {
    switch(flag.type) {
      case 'inappropriate-language':
        recommendations.push({
          title: 'Use Kind Words',
          titleArabic: 'استخدم كلمات لطيفة',
          message: 'Try using polite and respectful language. Think about how your words make others feel.',
          messageArabic: 'حاول استخدام لغة مهذبة ومحترمة. فكر في كيف تجعل كلماتك الآخرين يشعرون.',
          action: 'warning'
        });
        break;
        
      case 'cyberbullying':
        recommendations.push({
          title: 'Be Kind Online',
          titleArabic: 'كن لطيفاً على الإنترنت',
          message: 'Cyberbullying hurts people. If someone is bothering you, tell a trusted adult.',
          messageArabic: 'التنمر الإلكتروني يؤذي الناس. إذا كان شخص ما يزعجك، أخبر شخصاً بالغاً تثق به.',
          action: 'block'
        });
        break;
        
      case 'violence':
        recommendations.push({
          title: 'Stay Safe',
          titleArabic: 'ابق آمناً',
          message: 'Content about violence is not appropriate. Let\'s find something fun and safe to do!',
          messageArabic: 'المحتوى الذي يتحدث عن العنف غير مناسب. دعنا نجد شيئاً ممتعاً وآمناً لنفعله!',
          action: 'redirect'
        });
        break;
        
      case 'personal-info-request':
        recommendations.push({
          title: 'Protect Your Privacy',
          titleArabic: 'احمِ خصوصيتك',
          message: 'Never share your personal information online. If someone asks for it, tell your parents immediately.',
          messageArabic: 'لا تشارك معلوماتك الشخصية أبداً على الإنترنت. إذا طلب منك أحد ذلك، أخبر والديك فوراً.',
          action: 'block'
        });
        break;
    }
  });
  
  return recommendations;
}

// Create content flag in database
async function createContentFlag(childId, sessionId, text, analysisResults) {
  try {
    const primaryFlag = analysisResults.flags[0];
    
    const contentFlag = await ContentFlag.create({
      child: childId,
      session: sessionId,
      contentType: 'user-generated',
      contentDescription: 'Text content analysis',
      flagReason: primaryFlag.type,
      flagDetails: JSON.stringify(analysisResults.flags),
      detectedBy: 'automated',
      detectionAlgorithm: 'keyword-pattern-matching',
      confidenceScore: analysisResults.confidenceScore,
      flaggedText: text.substring(0, 200), // Store first 200 chars
      severity: analysisResults.severity
    });
    
    return contentFlag;
  } catch (error) {
    console.error('Error creating content flag:', error);
    return null;
  }
}

// Analyze URL for safety
exports.analyzeURL = (url) => {
  const result = {
    isSafe: true,
    reason: null,
    confidence: 0
  };
  
  if (!url || typeof url !== 'string') {
    return result;
  }
  
  const lowerUrl = url.toLowerCase();
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    'bit.ly', // URL shorteners can hide destination
    'tinyurl',
    'goo.gl',
    'ow.ly',
    'ipaddress', // Direct IP addresses
    '127.0.0.1',
    'localhost'
  ];
  
  suspiciousPatterns.forEach(pattern => {
    if (lowerUrl.includes(pattern)) {
      result.isSafe = false;
      result.reason = 'suspicious-url-pattern';
      result.confidence = 70;
    }
  });
  
  // Check for known unsafe domains (you'd expand this with a database)
  const unsafeDomains = ['example-unsafe.com'];
  
  unsafeDomains.forEach(domain => {
    if (lowerUrl.includes(domain)) {
      result.isSafe = false;
      result.reason = 'blocked-domain';
      result.confidence = 100;
    }
  });
  
  return result;
};

// Calculate overall risk score for a child
exports.calculateRiskScore = async (childId) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Get recent flags and alerts
    const recentFlags = await ContentFlag.find({
      child: childId,
      createdAt: { $gte: oneWeekAgo }
    });
    
    const recentAlerts = await Alert.find({
      child: childId,
      createdAt: { $gte: oneWeekAgo }
    });
    
    let riskScore = 0;
    
    // Add points for each flag type
    recentFlags.forEach(flag => {
      switch(flag.severity) {
        case 'critical': riskScore += 10; break;
        case 'high': riskScore += 7; break;
        case 'medium': riskScore += 4; break;
        case 'low': riskScore += 2; break;
      }
    });
    
    // Add points for unresolved alerts
    const unresolvedAlerts = recentAlerts.filter(a => !a.resolved);
    riskScore += unresolvedAlerts.length * 5;
    
    // Determine risk level
    let riskLevel = 'low';
    if (riskScore >= 20) riskLevel = 'high';
    else if (riskScore >= 10) riskLevel = 'medium';
    
    return {
      score: riskScore,
      level: riskLevel,
      flags: recentFlags.length,
      unresolvedAlerts: unresolvedAlerts.length
    };
    
  } catch (error) {
    console.error('Error calculating risk score:', error);
    return { score: 0, level: 'low', flags: 0, unresolvedAlerts: 0 };
  }
};

module.exports = exports;