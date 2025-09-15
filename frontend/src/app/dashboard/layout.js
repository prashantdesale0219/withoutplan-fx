'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/dashboard/Sidebar';
import { isAuthenticated } from '../../lib/cookieUtils';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      // Store the current path to redirect back after login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        // Use router.push instead of window.location.href to avoid full page reload
        router.push('/login');
        return;
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#e7ded0] flex" suppressHydrationWarning>
      <Sidebar />
      <div className="flex-1 md:ml-0">
        {children}
      </div>
    </div>
  );
}