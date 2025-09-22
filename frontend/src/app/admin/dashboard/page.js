'use client';

import React, { useEffect, useState } from 'react';
import { Users, BarChart2, CreditCard, CheckCircle, Clock, Award, UserCheck, FileText, Coins, DollarSign, Image, Video, Box, Zap, User } from 'lucide-react';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import adminApi from '@/lib/adminApi';
import Link from 'next/link';

// Dashboard KPI Card Component
const KPICard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// Quick Action Card Component
const QuickActionCard = ({ title, description, icon, link, color }) => (
  <Link href={link}>
    <div className={`rounded-lg p-6 ${color} text-white transition-all duration-200 hover:shadow-lg cursor-pointer h-full`}>
      <div className="flex flex-col h-full">
        <div className="mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </div>
  </Link>
);

// Recent Activity Table Component
const RecentActivityTable = ({ activities = [] }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
    <div className="p-6 border-b">
      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{activity.user}</div>
                      <div className="text-sm text-gray-500">{activity.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{activity.type}</div>
                  <div className="text-sm text-gray-500">{activity.prompt}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {activity.plan}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(activity.date).toLocaleString()}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                No recent activities found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    usersByPlan: {},
    termsAcceptance: { accepted: 0, notAccepted: 0 },
    mediaGenerated: {
      images: 0,
      videos: 0,
      scenes: 0
    },
    creditsUsed: 0,
    creditsTotal: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Quick actions for admin
  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage user accounts',
      icon: <Users className="w-8 h-8" />,
      link: '/admin/users',
      color: 'bg-[#26140c] hover:bg-[#aa7156]'
    }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch analytics data
        const analyticsResponse = await adminApi.getAnalytics();
        const analyticsData = analyticsResponse.data.data;
        
        // Transform backend data to match frontend structure
        const transformedAnalytics = {
          totalUsers: analyticsData.userStats?.total || 0,
          usersByPlan: analyticsData.userStats?.planDistribution || {},
          termsAcceptance: {
            accepted: Math.round((analyticsData.userStats?.termsAcceptanceRate || 0) * (analyticsData.userStats?.total || 0)),
            notAccepted: Math.round((1 - (analyticsData.userStats?.termsAcceptanceRate || 0)) * (analyticsData.userStats?.total || 0))
          },
          mediaGenerated: {
            images: analyticsData.mediaStats?.images || 0,
            videos: analyticsData.mediaStats?.videos || 0,
            scenes: analyticsData.mediaStats?.scenes || 0
          },
          creditsUsed: analyticsData.creditStats?.totalUsed || 0,
          creditsTotal: analyticsData.creditStats?.total || 0
        };
        
        setAnalytics(transformedAnalytics);
        
        // Fetch recent users for activity
        const usersResponse = await adminApi.getUsers({}, 1, 5);
        
        // Transform user data to activity format
        const activities = usersResponse.data.data.map(user => ({
          user: `${user.firstName} ${user.lastName}`,
          email: user.email,
          type: 'Account Created',
          plan: user.plan || 'Free',
          date: user.createdAt
        }));
        
        setRecentActivities(activities);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  // Calculate plan distribution
  const planCounts = analytics.usersByPlan || {};
  const plans = Object.keys(planCounts);
  
  return (
    <ProtectedAdminRoute>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <h2 className="text-4xl font-semibold text-gray-900">Admin Dashboard</h2>
          <div className="mt-4 md:mt-0">
            <button className="bg-[#26140c] hover:bg-[#aa7156] text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#aa7156]"></div>
              <p className="mt-4 text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-6">
            <div className="flex items-center">
              <div className="mr-3">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Error!</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard 
                title="Total Users" 
                value={analytics?.totalUsers || 0} 
                icon={<Users className="h-6 w-6 text-white" />} 
                color="bg-[#26140c]" 
              />
              
              {plans.map((plan, index) => (
                <KPICard 
                  key={plan}
                  title={`${plan} Plan Users`}
                  value={planCounts[plan]}
                  icon={<UserCheck className="h-6 w-6 text-white" />}
                  color={
                    index === 0 ? "bg-[#aa7156]" : 
                    index === 1 ? "bg-[#26140c]" : 
                    index === 2 ? "bg-[#aa7156]" : "bg-[#26140c]"
                  }
                />
              ))}
              
              <KPICard 
                title="T&C Accepted" 
                value={`${analytics.termsAcceptance?.accepted || 0} / ${analytics.totalUsers}`} 
                icon={<CheckCircle className="h-6 w-6 text-white" />} 
                color="bg-[#aa7156]" 
              />
            </div>
            
            {/* Quick Actions */}
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {quickActions.map((action, index) => (
                <QuickActionCard
                  key={index}
                  title={action.title}
                  description={action.description}
                  icon={action.icon}
                  link={action.link}
                  color={action.color}
                />
              ))}
            </div>
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* User Plan Distribution */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">User Plan Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(analytics.usersByPlan || {}).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {Object.entries(analytics.usersByPlan || {}).map(([entry, value], index) => (
                          <Cell key={`cell-${index}`} fill={['#4F46E5', '#10B981', '#F59E0B', '#EF4444'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Credit Usage */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Credit Usage</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Total Credits', value: analytics.creditsTotal || 0 },
                        { name: 'Used Credits', value: analytics.creditsUsed || 0 }
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#aa7156" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* T&C Acceptance Ratio */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">T&C Acceptance Ratio</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Accepted', value: analytics.termsAcceptance?.accepted || 0 },
                          { name: 'Not Accepted', value: analytics.termsAcceptance?.notAccepted || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#4F46E5" />
                        <Cell fill="#EF4444" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Media Generation Bar Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Media Generated</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Images', value: analytics.mediaGenerated?.images || 0 },
                        { name: 'Videos', value: analytics.mediaGenerated?.videos || 0 },
                        { name: 'Scenes', value: analytics.mediaGenerated?.scenes || 0 }
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#26140c" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-3">Credits & Media Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard 
                title="Total Credits" 
                value={analytics?.creditsTotal || 0} 
                icon={<Coins className="h-6 w-6 text-white" />} 
                color="bg-[#26140c]" 
              />
              <KPICard 
                title="Credits Used" 
                value={analytics?.creditsUsed || 0} 
                icon={<DollarSign className="h-6 w-6 text-white" />} 
                color="bg-[#aa7156]" 
              />
              <KPICard 
                title="Images Generated" 
                value={analytics.mediaGenerated?.images || 0} 
                icon={<Image className="h-6 w-6 text-white" />} 
                color="bg-[#26140c]" 
              />
              <KPICard 
                title="Videos Generated" 
                value={analytics.mediaGenerated?.videos || 0} 
                icon={<Video className="h-6 w-6 text-white" />} 
                color="bg-[#aa7156]" 
              />
              <KPICard 
                title="Scenes Generated" 
                value={analytics.mediaGenerated?.scenes || 0} 
                icon={<Box className="h-6 w-6 text-white" />} 
                color="bg-[#26140c]" 
              />
            </div>
            
            {/* Recent Activity Table */}
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Activity</h3>
            <RecentActivityTable activities={recentActivities} />
          </>
        )}
    </ProtectedAdminRoute>
  );
}