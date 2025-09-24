'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { isAuthenticated } from '@/lib/cookieUtils';

export default function ProtectedAdminRoute({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        // First check if user is authenticated at all
        if (!isAuthenticated()) {
          
          router.push('/login');
          return;
        }

        // First verify the authentication token
        try {
          
          await api.get('/auth/verify');
          
          // Then check if user has admin role
          
          const response = await api.get('/auth/me');
          // Handle different response structures
          const userData = response.data.data?.user || response.data;
          
          
          
          if (userData.role === 'admin') {
            
            setAuthorized(true);
            setLoading(false);
          } else {
            
            router.push('/login');
            return;
          }
        } catch (verifyError) {
          console.error('Token verification failed:', verifyError);
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('Error checking admin authentication:', error);
        router.push('/login');
      }
    };

    checkAdminAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return authorized ? children : null;
}
