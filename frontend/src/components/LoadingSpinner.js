import React from 'react';

const LoadingSpinner = ({ message = 'กำลังโหลด...' }) => {
  return (
    <div className="loading fade-in">
      <div className="flex-column flex-center gap-md">
        <div className="spinner"></div>
        {message && <p className="text-secondary">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
