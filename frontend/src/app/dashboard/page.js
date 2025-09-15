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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 w-full">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#26140c]">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-[#aa7156] mt-2">
          Here&apos;s what&apos;s happening with your account today.
        </p>
      </div>
      
      {/* Plan and Credits Information */}
      {user && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-6 h-6 text-[var(--coffee)]" />
            <h2 className="text-xl font-semibold">Your Plan</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#f9f7f5] p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Current Plan</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold capitalize">{user.plan || 'Free'}</span>
                <Link href="/pricing">
                  <span className="text-xs bg-[var(--coffee)] text-white px-2 py-1 rounded hover:bg-[#3a1e12] transition-colors cursor-pointer">
                    Upgrade
                  </span>
                </Link>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Activated: {user.planActivatedAt ? new Date(user.planActivatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            <div className="bg-[#f9f7f5] p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Credits</h3>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[var(--coffee)]" />
                <span className="text-2xl font-bold">{user.credits?.balance || 0}</span>
              </div>
              <div className="mt-2 bg-gray-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[var(--coffee)] h-full rounded-full" 
                  style={{ width: `${Math.min(100, ((user.credits?.balance || 0) / ((user.credits?.balance || 0) + (user.credits?.imagesGenerated || 1))) * 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {user.credits?.imagesGenerated || 0} images generated
              </p>
              {user.credits?.balance <= 0 && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                  You have run out of credits. Please upgrade your plan to continue generating images.
                </div>
              )}
            </div>
            
            <div className="bg-[#f9f7f5] p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Need More?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Upgrade your plan to get more credits and features.
              </p>
              <Link href="/pricing">
                <button className="w-full py-2 px-4 bg-[var(--coffee)] text-white rounded hover:bg-[#3a1e12] transition-colors font-medium">
                  View Plans
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#26140c] mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.link}
                  className={`${action.color} text-white p-6 rounded-lg transition-colors duration-200 block`}
                >
                  <div className="flex flex-col items-center text-center">
                    {action.icon}
                    <h3 className="text-lg font-semibold mt-3">{action.title}</h3>
                    <p className="text-sm opacity-90 mt-1">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
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
              Getting Started
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Update Profile</p>
                  <p className="text-sm text-gray-600">Keep your profile information up to date</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Manage Settings</p>
                  <p className="text-sm text-gray-600">Configure your account preferences</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full mt-0.5"></div>
                <div>
                  <p className="font-medium text-gray-900">Explore Features</p>
                  <p className="text-sm text-gray-600">Discover all available features</p>
                </div>
              </div>
            </div>
          </div>

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