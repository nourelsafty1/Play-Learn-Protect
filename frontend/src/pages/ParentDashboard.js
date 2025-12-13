// src/pages/ParentDashboard.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { childrenAPI, monitoringAPI } from '../services/api';
import { getAvatarColor, getInitials, getGreeting } from '../utils/helpers';

const ParentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [children, setChildren] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch children
      const childrenRes = await childrenAPI.getAll();
      setChildren(childrenRes.data.data);

      // Fetch monitoring dashboard
      const dashboardRes = await monitoringAPI.getDashboard();
      setDashboardData(dashboardRes.data.data);

    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loading />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {getGreeting()}, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Here's what's happening with your children today
          </p>
        </div>

        {/* Quick Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
  <div className="text-3xl mb-2">
    {user?.role === 'teacher' ? '👨‍🎓' : '👨‍👩‍👧‍👦'}
  </div>
  <div className="text-3xl font-bold">{dashboardData.summary.totalChildren}</div>
  <div className="text-sm opacity-90">
    {user?.role === 'teacher' ? 'Total Students' : 'Total Children'}
  </div>
</Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="text-3xl mb-2">⏰</div>
              <div className="text-3xl font-bold">{dashboardData.summary.totalScreenTimeToday}m</div>
              <div className="text-sm opacity-90">Screen Time Today</div>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
              <div className="text-3xl mb-2">🚨</div>
              <div className="text-3xl font-bold">{dashboardData.summary.unresolvedAlerts}</div>
              <div className="text-sm opacity-90">Unresolved Alerts</div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <div className="text-3xl mb-2">🔥</div>
              <div className="text-3xl font-bold">{dashboardData.summary.activeSessions}</div>
              <div className="text-sm opacity-90">Active Sessions</div>
            </Card>
          </div>
        )}

        {/* Children List */}
        <Card title={user?.role === 'teacher' ? 'Your Students' : 'Your Children'} className="mb-8">
          {children.length === 0 ? (
<div className="text-center py-12">
  <div className="text-6xl mb-4">{user?.role === 'teacher' ? '👨‍🎓' : '👶'}</div>
  <h3 className="text-xl font-semibold text-gray-700 mb-2">
    {user?.role === 'teacher' ? 'No students enrolled yet' : 'No children added yet'}
  </h3>
  <p className="text-gray-500 mb-6">
    {user?.role === 'teacher' 
      ? 'Students will appear here once they are enrolled in your classes'
      : 'Add your first child to get started with the platform'
    }
  </p>
  {/* Only show Add button for parents */}
  {user?.role !== 'teacher' && (
    <Button onClick={() => navigate('/children/add')}>
      <span>➕</span>
      <span>Add Child</span>
    </Button>
  )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child) => (
                <div
                  key={child._id}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/children/${child._id}`)}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`w-16 h-16 rounded-full ${child.avatarColor || getAvatarColor(child.name)} flex items-center justify-center text-white text-2xl font-bold`}>
                      {child.avatar || getInitials(child.name)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{child.name}</h3>
                      <p className="text-sm text-gray-500">@{child.username}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Level</span>
                      <span className="font-semibold text-purple-600">{child.level}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Points</span>
                      <span className="font-semibold text-green-600">{child.totalPoints.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Streak</span>
                      <span className="font-semibold text-orange-600">🔥 {child.currentStreak} days</span>
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    fullWidth 
                    className="mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/children/${child._id}/dashboard`);
                    }}
                  >
                    View Dashboard →
                  </Button>
                </div>
              ))}

              {/* Add Child Card */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                onClick={() => navigate('/children/add')}
              >
                <div className="text-6xl mb-4">➕</div>
                <h3 className="text-lg font-semibold text-gray-700">Add Child</h3>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Create a new account for your child
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Recent Achievements */}
        {dashboardData?.recentAchievements && dashboardData.recentAchievements.length > 0 && (
          <Card title="Recent Achievements" subtitle="Latest milestones from your children">
            <div className="space-y-4">
              {dashboardData.recentAchievements.slice(0, 5).map((achievement, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                  <div className="text-3xl">🏆</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {achievement.child.name} earned an achievement!
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;