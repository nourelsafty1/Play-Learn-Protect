# Update Existing Games to Self-Hosted

## Quick Fix: Update All Games in Database

Run this in MongoDB to update all existing games to self-hosted:

```javascript
// Connect to your database
use play-learn-protect

// Update all games to self-hosted (if they don't have gameType set)
db.games.updateMany(
  { gameType: { $exists: false } },
  { $set: { gameType: 'self-hosted' } }
)

// Update games with external URLs to use self-hosted games
// Maths Adventure
db.games.updateOne(
  { title: 'Maths Adventure' },
  { 
    $set: { 
      gameUrl: '/games/math-addition-game.html',
      gameType: 'self-hosted'
    }
  }
)

// Word Builder
db.games.updateOne(
  { title: 'Word Builder' },
  { 
    $set: { 
      gameUrl: '/games/english-word-game.html',
      gameType: 'self-hosted'
    }
  }
)

// Coding Quest
db.games.updateOne(
  { title: 'Coding Quest' },
  { 
    $set: { 
      gameUrl: '/games/coding-sequence-game.html',
      gameType: 'self-hosted'
    }
  }
)

// Science Lab / Physics Forces
db.games.updateOne(
  { title: 'Science Lab' },
  { 
    $set: { 
      title: 'Physics Forces',
      gameUrl: '/games/physics-forces-game.html',
      gameType: 'self-hosted',
      category: 'Physics'
    }
  }
)

// Creative Canvas
db.games.updateOne(
  { title: 'Creative Canvas' },
  { 
    $set: { 
      gameUrl: '/games/creative-art-game.html',
      gameType: 'self-hosted'
    }
  }
)
```

## Or Re-seed Database

Run the seed script to replace all games with self-hosted versions:

```bash
cd backend
node scripts/seedData.js
```

This will:
- Clear all existing games
- Add 6 new self-hosted games:
  1. Maths Adventure (Math)
  2. Word Builder (English)
  3. Coding Quest (Coding)
  4. Physics Forces (Physics)
  5. Chemistry Elements (Chemistry)
  6. Creative Canvas (Creativity)

## Verify Games Are Self-Hosted

After updating, verify:

```javascript
db.games.find({}, { title: 1, gameUrl: 1, gameType: 1 })
```

All games should show:
- `gameType: 'self-hosted'`
- `gameUrl` starting with `/games/`

