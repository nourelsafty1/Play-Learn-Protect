// src/components/common/Card.js

import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle,
  className = '',
  padding = 'p-6',
  hover = false
}) => {
  return (
    <div 
      className={`
        bg-white rounded-xl shadow-lg
        ${padding}
        ${hover ? 'hover:shadow-2xl transition-shadow duration-300' : ''}
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;