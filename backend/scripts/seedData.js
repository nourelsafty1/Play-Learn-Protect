// backend/scripts/seedData.js

require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('../src/models/Game');
const LearningModule = require('../src/models/LearningModule');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

// Sample Games
const sampleGames = [
  {
    title: 'Maths Adventure',
    titleArabic: 'مغامرة الرياضيات',
    description: 'Learn addition and subtraction through exciting adventures!',
    descriptionArabic: 'تعلم الجمع والطرح من خلال مغامرات مثيرة!',
    category: 'Maths',
    type: 'serious',
    ageGroups: ['6-8', '9-12'],
    difficulty: 'beginner',
    thumbnail: 'math-game',
    gameUrl: 'https://www.mathplayground.com/addition_blocks.html',
    learningObjectives: [
      'Master basic addition',
      'Learn subtraction',
      'Solve word problems'
    ],
    skills: ['problem-solving', 'arithmetic', 'logic'],
    pointsPerCompletion: 100,
    duration: 15,
    hasLevels: true,
    numberOfLevels: 5,
    language: ['ar', 'en'],
    isActive: true,
    isPublished: true,
    isFeatured: true,
    contentRating: '6+',
    safetyChecked: true
  },
  {
    title: 'Word Builder',
    titleArabic: 'بناء الكلمات',
    description: 'Build your vocabulary with fun word puzzles!',
    descriptionArabic: 'بناء المفردات الخاصة بك مع الألغاز كلمة متعة!',
    category: 'English',
    type: 'serious',
    ageGroups: ['3-5', '6-8'],
    difficulty: 'beginner',
    thumbnail: 'word-game',
    gameUrl: '/games/english/word-builder-6-8.html',
    learningObjectives: [
      'Learn new words',
      'Improve spelling',
      'Build sentences'
    ],
    skills: ['vocabulary', 'spelling', 'reading'],
    pointsPerCompletion: 80,
    duration: 10,
    hasLevels: true,
    numberOfLevels: 3,
    language: ['ar', 'en'],
    isActive: true,
    isPublished: true,
    contentRating: 'everyone',
    safetyChecked: true
  },
  {
    title: 'Coding Quest',
    titleArabic: 'مهمة البرمجة',
    description: 'Learn the basics of coding through interactive challenges!',
    descriptionArabic: 'تعلم أساسيات البرمجة من خلال التحديات التفاعلية!',
    category: 'Coding',
    type: 'serious',
    ageGroups: ['9-12'],
    difficulty: 'intermediate',
    thumbnail: 'coding-game',
    gameUrl: 'https://blockly.games/maze?lang=en',
    learningObjectives: [
      'Understand basic programming concepts',
      'Learn loops and conditions',
      'Create simple programs'
    ],
    skills: ['coding', 'logic', 'problem-solving'],
    pointsPerCompletion: 150,
    duration: 20,
    hasLevels: true,
    numberOfLevels: 8,
    language: ['ar', 'en'],
    isActive: true,
    isPublished: true,
    isFeatured: true,
    contentRating: '9+',
    safetyChecked: true
  },
  {
    title: 'Science Lab',
    titleArabic: 'مختبر العلوم',
    description: 'Explore science through fun experiments!',
    descriptionArabic: 'استكشف العلوم من خلال التجارب الممتعة!',
    category: 'Biology',
    type: 'serious',
    ageGroups: ['6-8', '9-12'],
    difficulty: 'intermediate',
    thumbnail: 'science-game',
    gameUrl: 'https://www.sciencekids.co.nz/gamesactivities/planetsandmoons.html',
    learningObjectives: [
      'Learn scientific method',
      'Conduct virtual experiments',
      'Understand basic physics'
    ],
    skills: ['scientific-thinking', 'observation', 'analysis'],
    pointsPerCompletion: 120,
    duration: 18,
    hasLevels: true,
    numberOfLevels: 6,
    language: ['ar', 'en'],
    isActive: true,
    isPublished: true,
    contentRating: '6+',
    safetyChecked: true
  },
  {
    title: 'Creative Canvas',
    titleArabic: 'لوحة الإبداع',
    description: 'Express yourself through digital art and creativity!',
    descriptionArabic: 'عبر عن نفسك من خلال الفن الرقمي والإبداع!',
    category: 'Creativity',
    type: 'creative',
    ageGroups: ['3-5', '6-8', '9-12'],
    difficulty: 'beginner',
    thumbnail: 'art-game',
    gameUrl: 'https://www.abcya.com/games/paint',
    learningObjectives: [
      'Express creativity',
      'Learn colors and shapes',
      'Develop artistic skills'
    ],
    skills: ['creativity', 'art', 'self-expression'],
    pointsPerCompletion: 90,
    duration: 15,
    hasLevels: false,
    numberOfLevels: 1,
    language: ['ar', 'en'],
    isActive: true,
    isPublished: true,
    contentRating: 'everyone',
    safetyChecked: true
  }
];



// Seed function
const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Dropping Game indexes...');
    try {
      await Game.collection.dropIndexes();
      console.log('✅ Game indexes dropped');
    } catch (err) {
      console.log('No Game indexes to drop');
    }

    console.log('Clearing existing games...');
    await Game.deleteMany({});

    console.log('Adding sample games...');
    await Game.insertMany(sampleGames);
    console.log(`✅ Added ${sampleGames.length} games`);

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed
seedDatabase();