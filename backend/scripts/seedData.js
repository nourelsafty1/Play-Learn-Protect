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

// Sample Learning Modules 
const sampleModules = [
  // Math Module
  {
    title: 'Introduction to Numbers',
    titleArabic: 'مقدمة للأرقام',
    description: 'Learn counting, number recognition, and basic arithmetic',
    descriptionArabic: 'تعلم العد والتعرف على الأرقام والحساب الأساسي',
    subject: 'Maths',
    topic: 'numbers',
    ageGroups: ['3-5', '6-8'],
    difficulty: 'beginner',
    thumbnail: 'numbers',
    lessons: [
      {
        lessonNumber: 1,
        title: 'Counting 1-10',
        titleArabic: 'العد 1-10',
        contentType: 'video',
        content: 'https://www.youtube.com/watch?v=DR-cfDsHCGA',
        duration: 10,
        order: 1
      },
      {
        lessonNumber: 2,
        title: 'Number Recognition',
        titleArabic: 'التعرف على الأرقام',
        contentType: 'interactive',
        content: 'https://www.mindlygames.com/game/composing-teen-numbers-taterz-quiz',
        duration: 15,
        order: 2
      },
      {
        lessonNumber: 3,
        title: 'Simple Addition',
        titleArabic: 'الجمع البسيط',
        contentType: 'interactive',
        content: 'https://poki.com/en/g/arithmetica?msockid=05f5e4886170610b2086f2e46007603d',
        duration: 10,
        order: 3
      }
    ],
    learningObjectives: [
      'Count from 1 to 10',
      'Recognize written numbers',
      'Perform simple addition'
    ],
    skills: ['counting', 'number-recognition', 'addition'],
    pointsPerLesson: 50,
    completionPoints: 150,
    hasQuiz: true,
    passingScore: 50,
    language: ['ar', 'en'],
    isActive: true,
    isPublished: true
  },

  // English Module
  {
    title: 'English Alphabet',
    titleArabic: 'الأبجدية الإنجليزية',
    description: 'Master the English alphabet with fun activities',
    descriptionArabic: 'اتقن الأبجدية الإنجليزية مع الأنشطة الممتعة',
    subject: 'English',
    topic: 'alphabet',
    ageGroups: ['3-5', '6-8'],
    difficulty: 'beginner',
    thumbnail: 'alphabet',
    lessons: [
      {
        lessonNumber: 1,
        title: 'Learn the English Alphabet  ',
        titleArabic: 'تعلّم أسماء الحيوانات الأليفة بالإنجليزية ',
        contentType: 'video',
        content: 'https://youtu.be/LIGD2NwPAWE?si=_51yBiXQE1Lk77Lk',
        duration: 5,
        order: 1
      },
      {
        lessonNumber: 2,
        title: 'Learn Pet Animals Names in English ',
        titleArabic: 'تعلّم أسماء الحيوانات الأليفة بالإنجليزية ',
        contentType: 'video',
        content: 'https://youtu.be/2NOn0Rr0SX0?si=MuW5GU6qMR280ICi',
        duration: 4,
        order: 2
      },
      {
        lessonNumber: 3,
        title: 'Learn Colors in English',
        titleArabic: 'تعلّم أسماء الألوان بالإنجليزية ',
        contentType: 'video',
        content: 'https://youtu.be/FA_Nbh-BQ1o?si=Eop6cAJ85Bp3yxdh',
        duration: 3,
        order: 3
      }
    ],
    learningObjectives: [
      'Recognize all letters',
      'Know letter sounds',
      'Write letters correctly',
      'Recognize animal names in English (Pet Animals)',
      'Know color names in English (Colors)'
    ],
    skills: ['alphabet', 'phonics', 'writing'],
    pointsPerLesson: 70,
    completionPoints: 210,
    hasQuiz: false,
    passingScore: 140,
    language: ['ar', 'en'],
    isActive: true,
    isPublished: true,
    isFeatured: true
  },

  // Coding Module
  {
    title: 'Coding Basics',
    titleArabic: 'أساسيات البرمجة',
    description: 'Introduction to programming concepts for beginners',
    descriptionArabic: 'مقدمة في مفاهيم البرمجة للمبتدئين',
    subject: 'Coding',
    topic: 'basics',
    ageGroups: ['9-12'],
    difficulty: 'beginner',
    thumbnail: 'coding',
    lessons: [
      {
        lessonNumber: 1,
        title: 'Introduction to Coding',
        titleArabic: 'مقدمة في البرمجة',
        contentType: 'video',
        content: 'https://youtu.be/4xMNXg4aUoo?si=yeBpSym94oTWRIWf',
        duration: 5,
        order: 1
      },
      {
        lessonNumber: 2,
        title: 'Exercise on giving the computer commands',
        titleArabic: 'تمرين على إعطاء الكمبيوتر الأوامر',
        contentType: 'interactive',
        content: 'https://blockly.games/maze?lang=en',
        duration: 10,
        order: 2
      },
      {
        lessonNumber: 2,
        title: 'Final Project',
        titleArabic: 'المشروع النهائي',
        contentType: 'interactive',
        content: 'https://scratch.mit.edu/projects/editor/',
        duration: 40,
        order: 3
      }
    ],
    learningObjectives: [
      'Understand what is programming',

    ],
    skills: ['coding', 'logic', 'problem-solving'],
    pointsPerLesson: 100,
    completionPoints: 300,
    hasQuiz: true,
    passingScore: 100,
    language: ['ar', 'en'],
    isActive: true,
    isPublished: true,
    isFeatured: true
  },

  // BIOLOGY MODULE
  {
    title: 'Introduction to Biology',
    titleArabic: 'مقدمة في علم الأحياء',
    description: 'Discover the fascinating world of living organisms, plants, and animals',
    descriptionArabic: 'اكتشف عالم الكائنات الحية الرائع والنباتات والحيوانات',
    subject: 'Biology',
    topic: 'biology',
    ageGroups: ['6-8', '9-12'],
    difficulty: 'beginner',
    thumbnail: 'biology',
    lessons: [
      {
        lessonNumber: 1,
        title: 'What is Life?',
        titleArabic: 'ما هي الحياة؟',
        contentType: 'video',
        content: 'https://www.youtube.com/watch?v=QImCld9YubE',
        duration: 10,
        order: 1
      },
      {
        lessonNumber: 2,
        title: 'Plant Life Cycle Stages From Seed To Fruit ',
        titleArabic: 'مراحل دورة حياة النبات من البذرة إلى الثمرة',
        contentType: 'video',
        content: 'https://youtu.be/2SBVz4MgeIE?si=m2K20j1JuwW6QTPl',
        duration: 5,
        order: 2
      },
      {
        lessonNumber: 3,
        title: 'Vertebrates',
        titleArabic: 'فقاريات ',
        contentType: 'video',
        content: 'https://youtu.be/R50Xc1EUHwg?si=rJcwPvUI9rZyO67L',
        duration: 4,
        order: 3
      },
      {
        lessonNumber: 4,
        title: 'Human Body Systems',
        titleArabic: 'أجهزة جسم الإنسان',
        contentType: 'video',
        content: 'https://youtu.be/9eu1bbOy5xw?si=EDN2MvxOEk5fI83T',
        duration: 4,
        order: 4
      },
    ],
    learningObjectives: [
      'Understand what makes something alive',
      'Learn about plant and animal life cycles',
      'Explore the human body',
      'Classify different types of organisms'
    ],
    skills: ['observation', 'classification', 'scientific-thinking'],
    pointsPerLesson: 55,
    completionPoints: 220,
    hasQuiz: false,
    passingScore: 110,
    language: ['ar', 'en'],
    isActive: true,
    isPublished: true,
    isFeatured: true
  },

  // CHEMISTRY MODULE
  {
    title: 'Introduction to Chemistry',
    titleArabic: 'مقدمة في الكيمياء',
    description: 'Explore the building blocks of matter and fascinating chemical reactions',
    descriptionArabic: 'استكشف وحدات بناء المادة والتفاعلات الكيميائية الرائعة',
    subject: 'Chemistry',
    topic: 'basics',
    ageGroups: ['9-12'],
    difficulty: 'intermediate',
    thumbnail: 'chemistry',
    lessons: [
      {
        lessonNumber: 1,
        title: 'What is Chemistry?',
        titleArabic: 'ما هي الكيمياء؟',
        contentType: 'video',
        content: 'https://youtu.be/t8x3wdXZGEY?si=64iG4Hq5_htCaSdy',
        duration: 2,
        order: 1
      },
      {
        lessonNumber: 2,
        title: 'Atoms and Molecules',
        titleArabic: 'الذرات والجزيئات',
        contentType: 'video',
        content: 'https://youtu.be/jMW_0Ro6b5c?si=PkvZrFjLAU40vs57',
        duration: 7,
        order: 2
      },
      {
        lessonNumber: 3,
        title: 'Chemical Reactions',
        titleArabic: 'التفاعلات الكيميائية',
        contentType: 'video',
        content: 'https://youtu.be/5iowJs6MryI?si=RKw4xS2RbXvxA8jg',
        duration: 10,
        order: 3
      },

    ],
    learningObjectives: [
      'Learn what chemistry is about',
      'Understand the basic structure of atoms',
      'Learn about different chemical reactions',

    ],
    skills: ['analytical-thinking', 'problem-solving', 'observation'],
    pointsPerLesson: 60,
    completionPoints: 180,
    hasQuiz: false,
    passingScore: 60,
    language: ['ar', 'en'],
    isActive: true,
    isPublished: true,
    isFeatured: true
  },

  // PHYSICS MODULE
  {
    title: 'Introduction to Physics',
    titleArabic: 'مقدمة في الفيزياء',
    description: 'Discover the laws that govern motion, energy, and forces in our universe',
    descriptionArabic: 'اكتشف القوانين التي تحكم الحركة والطاقة والقوى في كوننا',
    subject: 'Physics',
    topic: 'basics',
    ageGroups: ['9-12'],
    difficulty: 'intermediate',
    thumbnail: 'physics',
    lessons: [
      {
        lessonNumber: 1,
        title: 'Newtons First Law Of Motion',
        titleArabic: 'قانون نيوتن الأول للحركة',
        contentType: 'video',
        content: 'https://youtu.be/adLj6kygwds?si=P6W02UifctKVK7nL',
        duration: 7,
        order: 1
      },
      {
        lessonNumber: 2,
        title: 'Newtons 2nd Law Of Motion',
        titleArabic: 'قانون نيوتن الثاني للحركة',
        contentType: 'video',
        content: 'https://youtu.be/8o3j1wpabes?si=WX7f06WoXuJPLQcs',
        duration: 6,
        order: 2
      },
      {
        lessonNumber: 3,
        title: 'Newtons 3rd Law of Motion',
        titleArabic: 'قانون نيوتن الثالث للحركة',
        contentType: 'video',
        content: 'https://youtu.be/wZsktFefGhI?si=zgfJBkQ1qyXueVPq',
        duration: 6,
        order: 3
      },
    ],
    learningObjectives: [
      'Understand Newton\'s laws of motion'
    ],
    skills: ['analytical-thinking', 'problem-solving', 'mathematical-reasoning'],
    pointsPerLesson: 80,
    completionPoints: 240,
    hasQuiz: false,
    passingScore: 80,
    language: ['ar', 'en'],
    isActive: true,
    isPublished: true,
    isFeatured: true
  },

  // ARABIC LANGUAGE 
  {
    title: 'Arabic Alphabet - الحروف العربية',
    titleArabic: 'الحروف العربية',
    description: 'Learn the beautiful Arabic alphabet from Alif to Ya',
    descriptionArabic: 'تعلم الأبجدية العربية الجميلة من الألف إلى الياء',
    subject: 'Arabic',
    topic: 'arabic-alphabet',
    ageGroups: ['3-5', '6-8'],
    difficulty: 'beginner',
    thumbnail: 'arabic-alphabet',
    lessons: [
      {
        lessonNumber: 1,
        title: 'Arabic Alphabet for Kids with Animals',
        titleArabic: 'الأبجدية العربية للأطفال مع الحيوانات ',
        contentType: 'video',
        content: 'https://youtu.be/fmbVBIiO1k0?si=7hlL4WPhdc2EIAFE',
        duration: 10,
        order: 1
      }, {
        lessonNumber: 2,
        title: 'Learn Pet names in Arabic',
        titleArabic: 'تعلّم أسماء الحيوانات الأليفة بالعربية ',
        contentType: 'video',
        content: 'https://youtu.be/hsy0DIqLhnc?si=TEDm6ZedXURSFWcZ',
        duration: 4,
        order: 2
      },
      {
        lessonNumber: 3,
        title: 'Fruits names in Arabic for Kids ',
        titleArabic: 'أسماء الفواكه باللغة العربية للأطفال',
        contentType: 'video',
        content: 'https://youtu.be/9YftisfXP70?si=wPbZct82rbCJ5i9Q',
        duration: 3,
        order: 3
      }
    ],
    learningObjectives: [
      'Recognize all Arabic letters',
      'Know letter sounds (حروف)',
      'Recognize animals names in Arabic (أسماء الحيوانات)',
      'Know color names in Arabic (أسماء الألوان)',
      'Recognize fruit names in Arabic (أسماء الفواكه)'
    ],
    skills: ['arabic-alphabet', 'reading', 'writing'],
    pointsPerLesson: 70,
    completionPoints: 210,
    hasQuiz: false,
    passingScore: 140,
    language: ['ar', 'en'],
    isActive: true,
    isPublished: true,
    isFeatured: true
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

    console.log('\nDropping LearningModule indexes...');
    try {
      await LearningModule.collection.dropIndexes();
      console.log('✅ LearningModule indexes dropped');
    } catch (err) {
      console.log('No LearningModule indexes to drop');
    }

    console.log('Clearing existing learning modules...');
    await LearningModule.deleteMany({});

    console.log('Adding sample learning modules...');
    await LearningModule.insertMany(sampleModules);
    console.log(`✅ Added ${sampleModules.length} learning modules`);

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed
seedDatabase();