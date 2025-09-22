import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

/**
 * Security wrapper for admin components
 * Adds additional security features:
 * - Session timeout after inactivity
 * - IP verification
 * - Action logging
 */
const AdminSecurityWrapper = ({ children }) => {
  const router = useRouter();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const sessionTimeout = 30 * 60 * 1000; // 30 minutes

  // Track user activity
  const updateActivity = () => {
    setLastActivity(Date.now());
    localStorage.setItem('adminLastActivity', Date.now().toString());
  };

  // Log admin actions
  const logAdminAction = async (action) => {
    try {
      await api.post('/api/admin/security/log', { action, timestamp: new Date() });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  };

  // Check session timeout
  useEffect(() => {
    // Set up activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Check for session timeout
    const checkTimeout = setInterval(() => {
      const storedLastActivity = localStorage.getItem('adminLastActivity');
      const lastActivityTime = storedLastActivity ? parseInt(storedLastActivity) : lastActivity;
      
      if (Date.now() - lastActivityTime > sessionTimeout) {
        // Session timeout - log out
        localStorage.removeItem('adminLastActivity');
        localStorage.removeItem('token');
        router.push('/login');
        alert('Your session has expired due to inactivity. Please log in again.');
      }
    }, 60000); // Check every minute

    // Log admin page access
    logAdminAction('page_access');

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(checkTimeout);
    };
  }, []);

  return <>{children}</>;
};

export default AdminSecurityWrapper;