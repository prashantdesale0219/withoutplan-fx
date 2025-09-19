'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import DashboardErrorBoundary from '@/components/dashboard/DashboardErrorBoundary';
// ToastContainer is handled in ClientLayout
import { getAuthToken, isAuthenticated as checkIsAuthenticated } from '@/lib/cookieUtils';
import { Loader } from 'lucide-react';
import api from '@/lib/api';
import VideoEditor from '@/components/dashboard/VideoEditor';
import Apps from '../apps/page';

const VideoEditorPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Add delay to ensure cookies are properly set
        setTimeout(async () => {
          // Check authentication using simple token check to avoid validation loops
          if (checkIsAuthenticated()) {
            console.log('User is authenticated via token check');
            setIsUserAuthenticated(true);
            setIsLoading(false);
            return;
          }
          
          // If not authenticated, redirect to login
          console.log('User is not authenticated, redirecting to login');
          router.push('/login');
         }, 800); // 800ms delay to ensure cookies are available
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  return (
    <DashboardErrorBoundary>
      <div className="p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600 text-lg">loading...</p>
          </div>
        ) : (
          <div>
           
           <div className='f items-center max-w-8xl'>
            <div className='w-full'><VideoEditor/></div>
            <div className='w-full'><Apps/></div>
             
            </div>
          </div>
        )}
        {/* ToastContainer is handled in ClientLayout */}
      </div>
    </DashboardErrorBoundary>
  );
};

export default VideoEditorPage;