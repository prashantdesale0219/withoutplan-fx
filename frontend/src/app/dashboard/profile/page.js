"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileComponent from '@/components/dashboard/ProfileComponent';
import DashboardErrorBoundary from '@/components/dashboard/DashboardErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user) {
      setIsLoading(false);
    }
  }, [user, loading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        <ProfileComponent user={user} />
      </div>
    </DashboardErrorBoundary>
  );
}