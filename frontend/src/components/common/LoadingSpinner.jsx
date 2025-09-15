import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClass = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }[size] || 'w-8 h-8';

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`${sizeClass} border-t-2 border-b-2 border-blue-500 rounded-full animate-spin`}></div>
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;