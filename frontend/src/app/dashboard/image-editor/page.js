'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import Sidebar from '@/components/dashboard/Sidebar';
import ImageEditor from '@/components/dashboard/ImageEditor';
import DashboardErrorBoundary from '@/components/dashboard/DashboardErrorBoundary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAuthToken, isAuthenticated as checkIsAuthenticated } from '@/lib/cookieUtils';
import { Loader } from 'lucide-react';
import api from '@/lib/api';

const ImageEditorPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check with our enhanced isAuthenticated function
        if (checkIsAuthenticated()) {
          console.log('User is authenticated via token check');
          setIsUserAuthenticated(true);
          setIsLoading(false);
          return;
        }
        
        // If not authenticated by token, try to verify with backend
        try {
          const response = await api.get('/api/auth/verify');
          if (response.data && response.data.success) {
            console.log('User verified by backend');
            setIsUserAuthenticated(true);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.log('Backend verification failed, user is not authenticated');
        }
        
        // If we get here, user is not authenticated
        console.log('User is not authenticated, redirecting to login');
        router.push('/login');
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/login');
      }
    };
    
    // Add a small delay to ensure cookies are properly read
    const timer = setTimeout(checkAuth, 800);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex pt-16"> {/* Add padding top to account for fixed header */}
          <Sidebar />
          <main className="flex-1 p-4 md:p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[70vh]">
                <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600 text-lg">लोड हो रहा है...</p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Image Editor</h1>
                <p className="text-gray-600 mb-8">
                  Transform your images with AI-powered editing. Simply provide an image URL and a prompt describing your desired changes.
                </p>
                <ImageEditor />
              </div>
            )}
          </main>
        </div>
        <ToastContainer position="bottom-right" autoClose={5000} />
      </div>
    </DashboardErrorBoundary>
  );
};

export default ImageEditorPage;