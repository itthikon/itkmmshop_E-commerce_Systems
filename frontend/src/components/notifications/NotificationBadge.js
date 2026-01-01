import React from 'react';
import './NotificationBadge.css';

const NotificationBadge = ({ count, onClick }) => {
  if (!count || count === 0) {
    return null;
  }

  return (
    <span 
      className="notification-badge" 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick && onClick();
        }
      }}
      aria-label={`${count} การแจ้งเตือนใหม่`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default NotificationBadge;
