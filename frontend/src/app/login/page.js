'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '../../components/auth/login';
import { isAuthenticated } from '../../lib/cookieUtils';
import api from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  
  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check with our enhanced isAuthenticated function
        if (isAuthenticated()) {
          console.log('User is already authenticated, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }
        
        // If not authenticated by token, try to verify with backend
        try {
          const response = await api.get('/api/auth/verify');
          if (response.data && response.data.success) {
            console.log('User verified by backend, redirecting to dashboard');
            router.push('/dashboard');
            return;
          }
        } catch (error) {
          console.log('Backend verification failed, showing login form');
        }
        
        // If we get here, user is not authenticated
        console.log('User is not authenticated, showing login form');
        setChecking(false);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setChecking(false);
      }
    };
    
    // Add a slightly longer delay to ensure cookies are properly read
    const timer = setTimeout(checkAuth, 800);
    return () => clearTimeout(timer);
  }, [router]);
  
  // Function to handle close action - redirect to home page
  const handleClose = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {checking ? (
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Checking authentication status...</p>
        </div>
      ) : (
        <Login isOpen={true} onClose={handleClose} initialMode="login" />
      )}
    </div>
  );
}