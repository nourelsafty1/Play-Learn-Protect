// src/utils/helpers.js

// Format date to readable string
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format time duration (seconds to readable format)
export const formatDuration = (seconds) => {
  if (!seconds) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Calculate age from date of birth
export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Determine age group from date of birth
export const getAgeGroup = (dateOfBirth) => {
  const age = calculateAge(dateOfBirth);
  
  if (age >= 3 && age <= 5) return '3-5';
  if (age >= 6 && age <= 8) return '6-8';
  if (age >= 9 && age <= 12) return '9-12';
  return null;
};

// Get color for different categories
export const getCategoryColor = (category) => {
  const colors = {
    Maths: 'bg-gradient-to-br from-blue-400 to-blue-600',
    English: 'bg-gradient-to-br from-purple-400 to-purple-600',
    Biology: 'bg-gradient-to-br from-green-400 to-green-600',
    Arabic: 'bg-gradient-to-br from-indigo-400 to-purple-500',
    Coding: 'bg-gradient-to-br from-yellow-400 to-orange-500',
    Physics: 'bg-gradient-to-br from-red-400 to-pink-500',
    Chemistry: 'bg-gradient-to-br from-teal-400 to-cyan-500',
    Creativity: 'bg-gradient-to-br from-pink-400 to-rose-500'
  };
  return colors[category] || 'bg-gradient-to-br from-gray-400 to-gray-500';
};

// Get severity color
export const getSeverityColor = (severity) => {
  const colors = {
    low: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    high: 'text-orange-600 bg-orange-100',
    critical: 'text-red-600 bg-red-100'
  };
  
  return colors[severity] || 'text-gray-600 bg-gray-100';
};

// Truncate text
export const truncate = (str, length = 50) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

// Get avatar color based on name
export const getAvatarColor = (name) => {
  const colors = [
    'bg-red-400',
    'bg-blue-400',
    'bg-green-400',
    'bg-yellow-400',
    'bg-purple-400',
    'bg-pink-400',
    'bg-indigo-400',
    'bg-orange-400'
  ];
  
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Calculate level progress percentage
export const getLevelProgress = (experiencePoints, currentLevel) => {
  const xpInCurrentLevel = experiencePoints % 1000;
  return Math.floor((xpInCurrentLevel / 1000) * 100);
};

// Format number with commas
export const formatNumber = (num) => {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Get greeting based on time
export const getGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

// Get Arabic greeting
export const getArabicGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'صباح الخير';
  if (hour < 18) return 'مساء الخير';
  return 'مساء الخير';
};

// Calculate streak emoji
export const getStreakEmoji = (days) => {
  if (days >= 30) return '🔥🔥🔥';
  if (days >= 7) return '🔥🔥';
  if (days >= 3) return '🔥';
  return '⭐';
};

// Get level badge
export const getLevelBadge = (level) => {
  if (level >= 50) return '👑';
  if (level >= 30) return '💎';
  if (level >= 20) return '🏆';
  if (level >= 10) return '🥇';
  if (level >= 5) return '🥈';
  return '🥉';
};