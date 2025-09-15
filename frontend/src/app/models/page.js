'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/utils/cookies';
import DashboardErrorBoundary from '@/components/DashboardErrorBoundary';

const ModelsContent = () => {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Redirect to dashboard instead of showing models page
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <p>Redirecting to dashboard...</p>
    </div>
  );
};

// Wrap the models content with error boundary
const Models = () => {
  return (
    <DashboardErrorBoundary>
      <ModelsContent />
    </DashboardErrorBoundary>
  );
};

export default Models;