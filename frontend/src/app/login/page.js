'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '../../components/auth/login';
import { isAuthenticated, isAuthenticatedWithValidation } from '../../lib/cookieUtils';
import api from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  
  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use simple authentication check to avoid validation loops during login transition
        const isValidAuth = isAuthenticated();
        
        if (isValidAuth) {
          try {
            // Get user data to check role
            
            const response = await api.get('/auth/me');
            const userData = response.data;
            
            // Redirect based on user role
            if (userData.role === 'admin') {
              
              router.push('/admin/dashboard');
            } else {
              
              router.push('/dashboard');
            }
            return;
          } catch (userError) {
            console.error('Error fetching user data:', userError);
            // If we can't get user data, show login form
            setChecking(false);
            return;
          }
        }
        
        // If we get here, user is not authenticated or token is invalid
        
        setChecking(false);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setChecking(false);
      }
    };
    
    // Add moderate delay for simple authentication check
    const timer = setTimeout(checkAuth, 1200); // Reduced since we're using simple auth check
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
