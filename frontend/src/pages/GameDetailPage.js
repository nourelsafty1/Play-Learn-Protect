// src/pages/GameDetailPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import GameWrapper from '../components/games/GameWrapper';
import { gamesAPI, childrenAPI } from '../services/api';
import { getCategoryColor } from '../utils/helpers';

const GameDetailPage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [loading, setLoading] = useState(true);
  const [showGameWrapper, setShowGameWrapper] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gameRes, childrenRes] = await Promise.all([
        gamesAPI.getOne(gameId),
        childrenAPI.getAll()
      ]);
      
      setGame(gameRes.data.data);
      setChildren(childrenRes.data.data);
      
      if (childrenRes.data.data.length > 0) {
        setSelectedChild(childrenRes.data.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!selectedChild) {
      alert('Please select a child');
      return;
    }

    try {
      const response = await gamesAPI.start(gameId, selectedChild);
      const sessionId = response.data.data?.sessionId;
      setSessionId(sessionId);

      // Check if game is self-hosted (default to self-hosted if not specified)
      if (game.gameType === 'self-hosted' || !game.gameType) {
        // Show game wrapper for self-hosted games
        setShowGameWrapper(true);
      } else {
        // Open external games in new window
        window.open(game.gameUrl, '_blank');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please try again.');
    }
  };

  const handleGameComplete = (result) => {
    // Game completed, you can refresh data or show notification
    console.log('Game completed:', result);
    // Optionally refresh game data to show updated stats
    fetchData();
  };

  const handleCloseGame = () => {
    setShowGameWrapper(false);
    setSessionId(null);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loading />
      </>
    );
  }

  if (!game) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Card>
            <p className="text-gray-600">Game not found</p>
          </Card>
        </div>
      </>
    );
  }

  // Show game wrapper if self-hosted game is being played
  if (showGameWrapper && game && (game.gameType === 'self-hosted' || !game.gameType)) {
    return (
      <GameWrapper
        game={game}
        childId={selectedChild}
        sessionId={sessionId}
        onComplete={handleGameComplete}
        onClose={handleCloseGame}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => navigate('/games')}
          className="mb-6"
        >
          ← Back to Games
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              {/* Game Banner */}
              <div
                className={`relative mb-4 rounded-lg overflow-hidden h-64 flex items-center justify-center ${getCategoryColor(
                  game.category
                )}`}
              >
                <div className="text-8xl">
                   {game.category === 'Maths' && '🔢'}
                    {game.category === 'Biology' && '🔬'}
                    {game.category === 'Arabic' && '📚'}
                    {game.category === 'English' && '📚'}
                    {game.category === 'Coding' && '💻'}
                    {game.category === 'Physics' && '⚛️'}
                    {game.category === 'Chemistry' && '🧪'}
                    {game.category === 'Creativity' && '🎨'}
                </div>

                <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-white bg-opacity-90 text-gray-800 font-semibold capitalize">
                  {game.category}
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-800 mb-4">{game.title}</h1>
              
              {/* Meta Info */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-semibold">{(game.averageRating ?? 0).toFixed(1)}</span>
                  <span className="text-gray-500 text-sm">({game.totalRatings ?? 0} ratings)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👥</span>
                  <span className="font-semibold">{game.playCount ?? 0}</span>
                  <span className="text-gray-500 text-sm">plays</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⏱️</span>
                  <span className="font-semibold">{game.duration ?? 0} min</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">About This Game</h3>
                <p className="text-gray-600 leading-relaxed">{game.description}</p>
              </div>

              {/* Learning Objectives */}
              {game.learningObjectives && game.learningObjectives.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Learning Objectives</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {game.learningObjectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              {game.skills && game.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Skills Developed</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Play Game</h3>

              {/* Age Groups */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Recommended Ages</p>
                <div className="flex flex-wrap gap-2">
                  {game.ageGroups?.map((age, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {age} years
                    </span>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Difficulty</p>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm capitalize">
                  {game.difficulty}
                </span>
              </div>

              {/* Select Child */}
              {children.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Child
                  </label>
                  <select
                    value={selectedChild}
                    onChange={(e) => setSelectedChild(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    {children.map((child) => (
                      <option key={child._id} value={child._id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Play Button */}
              <Button 
                fullWidth 
                size="lg"
                onClick={handleStartGame}
                disabled={!selectedChild}
              >
                <span className="text-2xl"></span>
                <span>Play Now</span>
              </Button>

              {/* Points Info */}
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm font-semibold text-gray-700 mb-1">Earn Points!</p>
                <p className="text-sm text-gray-600">
                  Complete this game to earn <span className="font-bold text-yellow-600">{game.pointsPerCompletion ?? 0}</span> points
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetailPage;