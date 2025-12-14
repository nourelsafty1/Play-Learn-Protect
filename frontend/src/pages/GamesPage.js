import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { gamesAPI } from '../services/api';
import { getCategoryColor, truncate } from '../utils/helpers';

const GamesPage = () => {
  const navigate = useNavigate();

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    ageGroup: '',
    difficulty: '',
    search: ''
  });

  useEffect(() => {
    fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await gamesAPI.getAll(filters);
      setGames(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎮 Games</h1>
          <p className="text-gray-600 text-lg">Fun educational games for children</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search games..."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                 <option value="">All Categories</option>
  <option value="Maths">Maths</option>
  <option value="English">English</option>
  <option value="Biology">Biology</option>
  <option value="Arabic">Arabic</option>
  <option value="Coding">Coding</option>
  <option value="Physics">Physics</option>
  <option value="Chemistry">Chemistry</option>
  <option value="Creativity">Creativity</option>
              </select>
            </div>

            {/* Age Group */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Age Group
              </label>
              <select
                value={filters.ageGroup}
                onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="">All Ages</option>
                <option value="3-5">3-5 years</option>
                <option value="6-8">6-8 years</option>
                <option value="9-12">9-12 years</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Games Grid */}
        {loading ? (
          <Loading />
        ) : games.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No games found
              </h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <Card
                key={game._id}
                className="cursor-pointer hover:shadow-2xl transition-all"
                onClick={() => navigate(`/games/${game._id}`)}
              >
                {/* Game Thumbnail */}
                <div
                  className={`relative mb-4 rounded-lg overflow-hidden h-48 flex items-center justify-center ${getCategoryColor(
                    game.category
                  )}`}
                >
                  <div className="text-7xl">
                    {game.category === 'Maths' && '🔢'}
                    {game.category === 'Biology' && '🔬'}
                    {game.category === 'Arabic' && '📚'}
                    {game.category === 'English' && '📚'}
                    {game.category === 'Coding' && '💻'}
                    {game.category === 'Physics' && '⚛️'}
                    {game.category === 'Chemistry' && '🧪'}
                    {game.category === 'Creativity' && '🎨'}
                  </div>

                  <div className="absolute top-2 right-2 px-3 py-1 rounded-full bg-white bg-opacity-90 text-gray-800 text-xs font-semibold capitalize">
                    {game.category}
                  </div>
                </div>

                {/* Game Info */}
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {game.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {truncate(game.description, 100)}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>⭐ {(game.averageRating ?? 0).toFixed(1)}</span>
                  <span>👥 {game.playCount ?? 0} plays</span>
                </div>

                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex gap-2">
                    {game.ageGroups?.map((age, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold"
                      >
                        {age} years
                      </span>
                    ))}
                  </div>

                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold capitalize">
                    {game.difficulty}
                  </span>
                </div>

                <Button
                  size="sm"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/games/${game._id}`);
                  }}
                >
                  Play Now →
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamesPage;
