'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Login from '../../components/auth/login';
import { isAuthenticated } from '../../lib/cookieUtils';

export default function RegisterPage() {
  const router = useRouter();
  
  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      // User is already logged in, redirect to dashboard
      window.location.href = '/dashboard';
      return;
    }
  }, []);
  
  // Function to handle close action - redirect to home page
  const handleClose = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Login isOpen={true} onClose={handleClose} initialMode="register" />
    </div>
  );
}