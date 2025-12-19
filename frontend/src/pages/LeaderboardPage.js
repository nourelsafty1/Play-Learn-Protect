// src/pages/LeaderboardPage.js

import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import { progressAPI } from '../services/api';
import { getInitials, getAvatarColor } from '../utils/helpers';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'children',
    period: 'all-time',
    ageGroup: ''
  });

  useEffect(() => {
    fetchLeaderboard();
  }, [filters]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await progressAPI.getLeaderboard(
        filters.type,
        filters.period,
        filters.ageGroup
      );
      setLeaderboard(response.data.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500';
    return 'bg-gradient-to-r from-purple-400 to-purple-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Leaderboard</h1>
          <p className="text-gray-600 text-lg">See who's leading the way!</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Leaderboard Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value, ageGroup: e.target.value === 'children' ? '' : filters.ageGroup })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="children">All Children</option>
                <option value="age-group">By Age Group</option>
              </select>
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Time Period
              </label>
              <select
                value={filters.period}
                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="all-time">All Time</option>
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
              </select>
            </div>

            {/* Age Group */}
            {filters.type === 'age-group' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Age Group
                </label>
                <select
                  value={filters.ageGroup}
                  onChange={(e) => setFilters({ ...filters, ageGroup: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select Age Group</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-8">6-8 years</option>
                  <option value="9-12">9-12 years</option>
                </select>
              </div>
            )}
          </div>
        </Card>

        {loading ? (
          <Loading />
        ) : leaderboard && leaderboard.rankings.length > 0 ? (
          <>
            {/* Top 3 Podium */}
            {leaderboard.rankings.filter(r => r.child).length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
                {/* 2nd Place */}
                <div className="flex flex-col items-center pt-12">
                  <div className="text-4xl mb-2">🥈</div>
                  <div className={`w-20 h-20 rounded-full ${leaderboard.rankings[1]?.child?.avatar || getAvatarColor(leaderboard.rankings[1]?.child?.name)} flex items-center justify-center text-white text-2xl font-bold border-4 border-gray-300 shadow-lg`}>
                    {getInitials(leaderboard.rankings[1]?.child?.name)}
                  </div>
                  <h3 className="font-bold text-gray-800 mt-3 text-center">{leaderboard.rankings[1]?.child?.name}</h3>
                  <p className="text-2xl font-bold text-gray-600">{leaderboard.rankings[1]?.score}</p>
                  <div className="bg-gray-300 h-24 w-full rounded-t-lg mt-4"></div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center">
                  <div className="text-5xl mb-2 animate-bounce">👑</div>
                  <div className={`w-24 h-24 rounded-full ${leaderboard.rankings[0]?.child?.avatar || getAvatarColor(leaderboard.rankings[0]?.child?.name)} flex items-center justify-center text-white text-3xl font-bold border-4 border-yellow-400 shadow-2xl`}>
                    {getInitials(leaderboard.rankings[0]?.child?.name)}
                  </div>
                  <h3 className="font-bold text-gray-800 mt-3 text-center text-lg">{leaderboard.rankings[0]?.child?.name}</h3>
                  <p className="text-3xl font-bold text-yellow-600">{leaderboard.rankings[0]?.score}</p>
                  <div className="bg-gradient-to-t from-yellow-400 to-yellow-500 h-32 w-full rounded-t-lg mt-4"></div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center pt-16">
                  <div className="text-4xl mb-2">🥉</div>
                  <div className={`w-20 h-20 rounded-full ${leaderboard.rankings[2]?.child?.avatar || getAvatarColor(leaderboard.rankings[2]?.child?.name)} flex items-center justify-center text-white text-2xl font-bold border-4 border-orange-400 shadow-lg`}>
                    {getInitials(leaderboard.rankings[2]?.child?.name)}
                  </div>
                  <h3 className="font-bold text-gray-800 mt-3 text-center">{leaderboard.rankings[2]?.child?.name}</h3>
                  <p className="text-2xl font-bold text-gray-600">{leaderboard.rankings[2]?.score}</p>
                  <div className="bg-orange-400 h-20 w-full rounded-t-lg mt-4"></div>
                </div>
              </div>
            )}

            {/* Full Rankings */}
            <Card title="Full Rankings">
              <div className="space-y-3">
                {leaderboard.rankings
                  .filter(entry => entry.child) // Filter out entries with null children
                  .map((entry, index) => (
                    <div
                      key={entry.child._id}
                      className={`flex items-center justify-between p-4 rounded-lg ${index < 3 ? getRankColor(entry.rank) + ' text-white' : 'bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 flex items-center justify-center font-bold text-xl ${index < 3 ? 'text-white' : 'text-gray-600'
                          }`}>
                          {getRankMedal(entry.rank)}
                        </div>

                        <div className={`w-12 h-12 rounded-full ${entry.child.avatar || getAvatarColor(entry.child.name)} flex items-center justify-center ${index < 3 ? 'text-white border-2 border-white' : 'text-white'
                          } font-bold`}>
                          {getInitials(entry.child.name)}
                        </div>

                        <div className="flex-1">
                          <h4 className={`font-bold ${index < 3 ? 'text-white' : 'text-gray-800'}`}>
                            {entry.child.name}
                          </h4>
                          <p className={`text-sm ${index < 3 ? 'text-white opacity-90' : 'text-gray-500'}`}>
                            Level {entry.child.level}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-2xl font-bold ${index < 3 ? 'text-white' : 'text-purple-600'}`}>
                          {entry.score}
                        </div>
                        <div className={`text-xs ${index < 3 ? 'text-white opacity-90' : 'text-gray-500'}`}>
                          points
                        </div>
                        {entry.rankChange !== 0 && (
                          <div className={`text-xs mt-1 ${entry.rankChange > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                            }`}>
                            {entry.rankChange > 0 ? '↑' : '↓'} {Math.abs(entry.rankChange)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </>
        ) : (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No rankings yet</h3>
              <p className="text-gray-500">Start playing to appear on the leaderboard!</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;