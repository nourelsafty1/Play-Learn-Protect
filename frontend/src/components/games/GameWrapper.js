// src/components/games/GameWrapper.js

import React, { useState, useEffect, useRef } from 'react';
import { gamesAPI, monitoringAPI } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Loading from '../common/Loading';

const GameWrapper = ({ game, childId, sessionId, onComplete, onClose }) => {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const startTimeRef = useRef(Date.now());
  const monitoringSessionIdRef = useRef(null);

  // Start monitoring session when game starts
  useEffect(() => {
    const startMonitoringSession = async () => {
      try {
        const response = await monitoringAPI.startSession(childId, 'desktop');
        if (response.data.success) {
          monitoringSessionIdRef.current = response.data.data.sessionId;
          
          // Add game activity to session
          if (monitoringSessionIdRef.current) {
            await monitoringAPI.addActivity(monitoringSessionIdRef.current, {
              activityType: 'game',
              gameId: game._id,
              duration: 0,
              completed: false
            });
          }
        }
      } catch (err) {
        console.error('Error starting monitoring session:', err);
        // Don't block game from starting if monitoring fails
      }
    };

    if (childId) {
      startMonitoringSession();
    }

    // Cleanup: End session when component unmounts
    return () => {
      const endSession = async () => {
        if (monitoringSessionIdRef.current) {
          try {
            await monitoringAPI.endSession(monitoringSessionIdRef.current);
            monitoringSessionIdRef.current = null;
          } catch (err) {
            console.error('Error ending monitoring session:', err);
          }
        }
      };
      endSession();
    };
  }, [childId, game._id, game.title]);

  useEffect(() => {
    // Listen for messages from the game iframe
    const handleMessage = async (event) => {
      // Security: Verify origin if needed (for production, check event.origin)
      // For now, we'll accept messages from any origin (self-hosted games should be same origin)
      
      if (event.data && event.data.type === 'GAME_SCORE') {
        const { score: gameScore, level, completed } = event.data;
        
        try {
          const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000); // in seconds
          
          // Submit score to backend
          const response = await gamesAPI.complete(game._id, {
            childId,
            score: gameScore,
            timeSpent,
            level: level || 1,
            completed: completed !== false, // Default to true if not specified
            sessionId
          });

          if (response.data.success) {
            setScore(gameScore);
            setPointsEarned(response.data.data.pointsEarned || 0);
            setAchievements(response.data.data.achievements || []);
            setGameCompleted(true);
            
            // Update monitoring session with game completion
            if (monitoringSessionIdRef.current) {
              try {
                await monitoringAPI.addActivity(monitoringSessionIdRef.current, {
                  activityType: 'game',
                  gameId: game._id,
                  duration: timeSpent,
                  score: gameScore,
                  completed: true,
                  level: level || 1
                });
              } catch (err) {
                console.error('Error updating monitoring activity:', err);
              }
            }
            
            // Call onComplete callback if provided
            if (onComplete) {
              onComplete({
                score: gameScore,
                pointsEarned: response.data.data.pointsEarned || 0,
                achievements: response.data.data.achievements || []
              });
            }
          }
        } catch (err) {
          console.error('Error submitting game score:', err);
          setError('Failed to submit score. Please try again.');
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [game._id, childId, sessionId, onComplete]);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  if (gameCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Game Completed!</h2>
            
            {score !== null && (
              <div className="mb-6">
                <p className="text-lg text-gray-600 mb-2">Your Score</p>
                <p className="text-5xl font-bold text-purple-600">{score}</p>
              </div>
            )}

            {pointsEarned > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Points Earned</p>
                <p className="text-3xl font-bold text-yellow-600">+{pointsEarned}</p>
              </div>
            )}

            {achievements.length > 0 && (
              <div className="mb-6">
                <p className="text-lg font-semibold text-gray-700 mb-2">New Achievements!</p>
                <div className="space-y-2">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                      <span className="text-2xl">🏆</span>
                      <span className="ml-2 font-semibold text-gray-800">{achievement.name || 'Achievement Unlocked!'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={onClose} fullWidth size="lg">
              Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{game.title}</h2>
          <p className="text-sm text-gray-500">Playing as {childId}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={async () => {
          // End monitoring session before closing
          if (monitoringSessionIdRef.current) {
            try {
              await monitoringAPI.endSession(monitoringSessionIdRef.current);
            } catch (err) {
              console.error('Error ending monitoring session:', err);
            }
          }
          onClose();
        }}>
          Close Game
        </Button>
      </div>

      {/* Game Container */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loading />
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={game.gameUrl}
          className="w-full h-full border-0"
          title={game.title}
          onLoad={handleIframeLoad}
          allow="fullscreen; autoplay; microphone; camera"
        />

        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Instructions for game developers */}
      <div className="bg-blue-50 border-t border-blue-200 px-4 py-2 text-xs text-blue-700">
        <p className="font-semibold mb-1">For Game Developers:</p>
        <p>Send score data using: window.parent.postMessage(&#123; type: 'GAME_SCORE', score: number, level: number, completed: boolean &#125;, '*')</p>
      </div>
    </div>
  );
};

export default GameWrapper;

