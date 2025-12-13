import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { childrenAPI, monitoringAPI } from '../services/api';
import { motion } from 'framer-motion';
import { FaStar, FaGamepad, FaFlask, FaBook } from 'react-icons/fa'; // Fixed import name
import toast from 'react-hot-toast';

const ChildDashboard = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const [childData, setChildData] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Start Session on Load
  useEffect(() => {
    let currentSessionId = null;

    const initSession = async () => {
      try {
        const childRes = await childrenAPI.getDashboard(childId);
        setChildData(childRes.data.data);

        // Start Monitoring Session (Backend requirement)
        const sessionRes = await monitoringAPI.startSession(childId, 'desktop');
        currentSessionId = sessionRes.data.data.sessionId;
        setSessionId(currentSessionId);
      } catch (error) {
        if(error.response?.status === 403) {
            toast.error("Screen time limit reached for today!");
            navigate('/select-child');
        }
      }
    };
    initSession();

    // Cleanup: End session when leaving
    return () => {
      if (currentSessionId) monitoringAPI.endSession(currentSessionId);
    };
  }, [childId, navigate]); // Added dependencies to fix warning

  if (!childData) return <div className="text-white text-center mt-20">Loading Adventure...</div>;

  return (
    <div className="min-h-screen bg-[#1a1c29] text-white p-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-[#2c2f40]">
            <span className="text-2xl font-bold">{childData.profile.level}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Commander {childData.profile.name}</h1>
            <div className="flex items-center gap-2 text-yellow-400">
              <FaStar />
              <span>{childData.profile.totalPoints} XP</span>
            </div>
          </div>
        </div>
        <button 
            onClick={() => navigate('/select-child')}
            className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-full font-bold"
        >
            Exit Adventure
        </button>
      </div>

      {/* Game Modes */}
      <h2 className="text-3xl font-bold mb-6">Choose Your Mission</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Physics Card */}
        <GameCard 
          title="Physics Lab" 
          icon={<FaGamepad />} 
          color="from-blue-500 to-cyan-500" 
          onClick={() => navigate(`/game/physics?session=${sessionId}&child=${childId}`)}
        />
        
        {/* Chemistry Card - THIS WAS THE ERROR */}
        <GameCard 
          title="Chemistry Mix" 
          icon={<FaFlask />} 
          color="from-purple-500 to-pink-500" 
          onClick={() => navigate(`/game/chemistry?session=${sessionId}&child=${childId}`)}
        />

        {/* English Card */}
        <GameCard 
          title="Story Builder" 
          icon={<FaBook />} 
          color="from-green-500 to-emerald-500" 
          onClick={() => navigate(`/game/english?session=${sessionId}&child=${childId}`)}
        />
      </div>
    </div>
  );
};

// Helper Component for Cards
const GameCard = ({ title, icon, color, onClick }) => (
  <motion.div 
    whileHover={{ scale: 1.05, rotate: 1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`h-64 rounded-3xl bg-gradient-to-br ${color} p-6 cursor-pointer relative overflow-hidden shadow-2xl`}
  >
    <div className="absolute top-4 right-4 text-white/30 text-9xl transform rotate-12">
      {icon}
    </div>
    <div className="relative z-10 h-full flex flex-col justify-end">
      <h3 className="text-3xl font-bold mb-2">{title}</h3>
      <div className="bg-white/20 backdrop-blur-md self-start px-4 py-2 rounded-lg font-semibold">
        Play Now
      </div>
    </div>
  </motion.div>
);

export default ChildDashboard;