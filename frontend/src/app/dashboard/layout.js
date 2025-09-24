'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/dashboard/Sidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { isAuthenticated } from '../../lib/cookieUtils';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  useEffect(() => {
    const checkAuth = () => {
      // Add delay to ensure cookies are properly set after login redirect
      setTimeout(() => {
        const authenticated = isAuthenticated();
        
        if (!authenticated) {
          
          // Store the current path to redirect back after login
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
          }
          router.push('/login');
          return;
        }
        
        
         setIsAuthorized(true);
         setIsLoading(false);
       }, 800); // 800ms delay to ensure cookies are available after login
    };
    
    checkAuth();
  }, [router]);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#e7ded0] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#26140c] mb-4"></div>
          <p className="text-[#26140c] text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Only render dashboard if user is authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <DashboardHeader />
      <div className="flex pt-16">
        <Sidebar />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
