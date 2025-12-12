// src/components/common/Loading.js

import React from 'react';

const Loading = ({ size = 'md', fullScreen = false }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center z-50">
        <div className="text-center">
          <div className={`${sizes[size]} border-4 border-white border-t-transparent rounded-full animate-spin mx-auto`}></div>
          <p className="text-white font-semibold mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizes[size]} border-4 border-purple-500 border-t-transparent rounded-full animate-spin`}></div>
    </div>
  );
};

export default Loading;