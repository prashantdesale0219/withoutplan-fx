'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Shirt, Zap, Clock, CheckCircle, Award, CreditCard } from 'lucide-react';
import DashboardErrorBoundary from '@/components/dashboard/DashboardErrorBoundary';
import { getAuthToken, getUserData } from '../../lib/cookieUtils';
import { calculateCreditUsage, formatCreditDisplay, getCreditColorClass } from '@/lib/creditUtils';

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
                Choose from our photoshoot styles or create custom edits.
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
                <span className="text-xl font-bold text-gray-900">{user.credits?.total - user.credits?.used || 0}</span>
                <span className="text-xs text-gray-500">remaining of {user.credits?.total || 0}</span>
              </div>
              <div className="mb-2 bg-gray-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={`${getCreditColorClass(calculateCreditUsage(user.credits))} h-full rounded-full`}
                  style={{ width: `${calculateCreditUsage(user.credits)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {user.credits?.used || 0} credits used ({Math.round(calculateCreditUsage(user.credits))}%)
              </p>
              {(user.credits?.total - user.credits?.used <= 0) && (
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

      {/* Quick Actions Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h2>
          <p className="text-gray-600">
            Get started with our AI-powered image editing tools.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Photoshoot Apps Card */}
          <Link href="/dashboard/apps">
            <div className="group bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:border-purple-400 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">Photoshoot Apps</h3>
                  <p className="text-sm text-gray-600">20+ Pre-configured Styles</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-4">
                Choose from curated photoshoot themes with specialized AI workflows for authentic Indian locations.
              </p>
              <div className="flex items-center text-purple-600 text-sm font-medium">
                <span>Explore Apps</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
          
          {/* Custom Editor Card */}
          <Link href="/dashboard/image-editor">
            <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:border-blue-400 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Custom Editor</h3>
                  <p className="text-sm text-gray-600">AI-Powered Editing</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-4">
                Create custom image transformations with your own prompts and AI-powered editing capabilities.
              </p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <span>Start Editing</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
          
          {/* Pricing Card */}
          <Link href="/dashboard/pricing">
            <div className="group bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-400 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">Upgrade Plan</h3>
                  <p className="text-sm text-gray-600">More Credits & Features</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-4">
                Unlock premium features and get more credits to generate unlimited AI-powered images.
              </p>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <span>View Plans</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
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