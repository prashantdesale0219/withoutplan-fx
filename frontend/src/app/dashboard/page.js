'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Shirt, Zap, Clock, CheckCircle, Award, CreditCard } from 'lucide-react';
import DashboardErrorBoundary from '@/components/dashboard/DashboardErrorBoundary';
import { getAuthToken, getUserData } from '../../lib/cookieUtils';

// Dashboard component wrapped with error boundary
const DashboardContent = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    profileViews: 0,
    activity: 0,
    logins: 1,
    successRate: '100%'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user data from cookies
    const userData = getUserData();
    if (userData) {
      setUser(userData);
    }

    fetchDashboardData();
  }, [router]);
  
  // Add a second useEffect to check and update user data when it changes
  useEffect(() => {
    const checkUserData = () => {
      const freshUserData = getUserData();
      if (freshUserData && JSON.stringify(freshUserData) !== JSON.stringify(user)) {
        setUser(freshUserData);
      }
    };
    
    // Check every 5 seconds for any updates to user data
    const interval = setInterval(checkUserData, 5000);
    
    return () => clearInterval(interval);
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Set default values for authenticated user
      setStats({
        profileViews: 0,
        activity: 0,
        logins: 1,
        successRate: '100%'
      });
      
    } catch (error) {
      console.error('Error in dashboard:', error);
      // Set default values on error
      setStats({
        profileViews: 0,
        activity: 0,
        logins: 1,
        successRate: '100%'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const quickActions = [
    {
      title: 'Profile',
      description: 'View your profile',
      icon: <User className="w-8 h-8" />,
      link: '/profile',
      color: 'bg-[#26140c] hover:bg-[#aa7156]'
    },
    {
      title: 'Settings',
      description: 'Manage your account',
      icon: <Zap className="w-8 h-8" />,
      link: '/settings',
      color: 'bg-[#aa7156] hover:bg-[#26140c]'
    }
  ];

  const statCards = [
    {
      title: 'Profile Views',
      value: stats.profileViews,
      icon: <User className="w-8 h-8 text-blue-600" />,
      change: '0%',
      changeType: 'increase'
    },
    {
      title: 'Activity',
      value: stats.activity,
      icon: <Shirt className="w-8 h-8 text-green-600" />,
      change: '0%',
      changeType: 'increase'
    },
    {
      title: 'Logins',
      value: stats.logins,
      icon: <Zap className="w-8 h-8 text-purple-600" />,
      change: '0%',
      changeType: 'increase'
    },
    {
      title: 'Success Rate',
      value: stats.successRate,
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      change: '0%',
      changeType: 'increase'
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Dashboard</h2>
        <p className="text-gray-500">Please wait while we prepare your workspace...</p>
      </div>
    );
  }

  return (
    <div className="p-6 w-full space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-gray-600 mt-2">
                Here&apos;s what&apos;s happening with your account today.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Last login</p>
              <p className="font-semibold text-gray-700">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Plan and Credits Information */}
      {user && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Award className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Your Plan & Credits</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Current Plan</h3>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl font-bold text-gray-900 capitalize">{user.plan || 'Free'}</span>
                <Link href="/pricing">
                  <span className="text-xs bg-gray-900 text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors cursor-pointer font-medium">
                    Upgrade
                  </span>
                </Link>
              </div>
              <p className="text-xs text-gray-500">
                Activated: {user.planActivatedAt ? new Date(user.planActivatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                  <CreditCard className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Credits</h3>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl font-bold text-gray-900">{user.credits?.balance || 0}</span>
                <span className="text-xs text-gray-500">remaining</span>
              </div>
              <div className="mb-2 bg-gray-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gray-600 h-full rounded-full" 
                  style={{ width: `${Math.min(100, ((user.credits?.balance || 0) / ((user.credits?.balance || 0) + (user.credits?.imagesGenerated || 1))) * 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {user.credits?.imagesGenerated || 0} images generated
              </p>
              {user.credits?.balance <= 0 && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded">
                  ⚠️ You have run out of credits. Please upgrade your plan to continue generating images.
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Need More?</h3>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Upgrade your plan to get more credits and unlock premium features.
              </p>
              <Link href="/pricing">
                <button className="w-full py-2 px-3 bg-gray-900 hover:bg-gray-800 text-white rounded transition-colors text-sm font-medium">
                  View Plans
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6 ">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#26140c]">
                Recent Activity
              </h2>
              <Link
                href="/profile"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>
            
            <div className="flex flex-col items-center justify-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center">
                No recent activity to display.
              </p>
              <p className="text-gray-500 text-sm text-center mt-2">
                Your recent activities will appear here.
              </p>
            </div>
          </div>
        </div>

        {/* Tips & Getting Started */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#26140c] mb-4">
              Tips for Best Results
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  🔒 Keep your account secure with a strong password
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  ✉️ Verify your email to receive important notifications
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">
                  ⚙️ Check your settings regularly for new options
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap the dashboard content with error boundary
const Dashboard = () => {
  return (
    <DashboardErrorBoundary>
      <DashboardContent />
    </DashboardErrorBoundary>
  );
};

export default Dashboard;