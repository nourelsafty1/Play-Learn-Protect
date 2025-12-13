import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { childrenAPI } from '../services/api';
import { motion } from 'framer-motion';
import { FaPlus, FaLock } from 'react-icons/fa';
import Loading from '../components/common/Loading';

const ChildSelect = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const res = await childrenAPI.getAll();
      setChildren(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold text-white mb-4">Who is playing?</h1>
        <p className="text-gray-400 text-lg">Select your profile to start learning</p>
      </motion.div>
      
      <div className="flex flex-wrap gap-8 justify-center items-center max-w-5xl">
        {children.map((child, index) => (
          <motion.div 
            key={child._id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.1 }}
            className="group cursor-pointer flex flex-col items-center w-40"
            onClick={() => navigate(`/play/${child._id}`)}
          >
            <div className={`w-36 h-36 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl overflow-hidden relative group-hover:ring-4 ring-white transition-all`}>
              <span className="text-6xl text-white font-bold select-none">{child.name.charAt(0)}</span>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-gray-400 mt-4 text-xl font-medium group-hover:text-white transition-colors">{child.name}</span>
          </motion.div>
        ))}

        {/* Add Child / Parent Mode Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          className="group cursor-pointer flex flex-col items-center w-40"
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-36 h-36 rounded-full border-2 border-gray-600 flex items-center justify-center group-hover:border-white group-hover:bg-gray-800 transition-all">
            <FaPlus className="text-4xl text-gray-500 group-hover:text-white" />
          </div>
          <span className="text-gray-500 mt-4 text-xl font-medium group-hover:text-white flex items-center gap-2">
            <FaLock size={12} /> Parent Zone
          </span>
        </motion.div>
      </div>

      <div className="fixed bottom-8">
        <button className="text-gray-500 border border-gray-500 px-6 py-2 uppercase tracking-widest text-sm hover:text-white hover:border-white transition-colors">
            Manage Profiles
        </button>
      </div>
    </div>
  );
};

export default ChildSelect;