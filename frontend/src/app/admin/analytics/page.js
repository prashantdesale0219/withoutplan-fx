'use client';

import React, { useEffect, useState } from 'react';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import adminApi from '@/lib/adminApi';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getAnalytics();
        setAnalytics(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data. Please try again.');
        setLoading(false);
        
        // Fallback data for development/testing
        setAnalytics({
          userStats: {
            total: 125,
            active: 87,
            new: 12,
            planDistribution: {
              Free: 80,
              Basic: 25,
              Pro: 15,
              Enterprise: 5
            },
            termsAcceptanceRate: 0.85
          },
          mediaStats: {
            totalGenerated: 1250,
            images: 850,
            videos: 320,
            scenes: 80,
            byDay: [
              { date: '2023-06-01', count: 42 },
              { date: '2023-06-02', count: 38 },
              { date: '2023-06-03', count: 56 },
              { date: '2023-06-04', count: 61 },
              { date: '2023-06-05', count: 49 },
              { date: '2023-06-06', count: 52 },
              { date: '2023-06-07', count: 45 }
            ]
          },
          creditStats: {
            total: 5000,
            totalIssued: 5000,
            totalUsed: 3200,
            averagePerUser: 40,
            byPlan: {
              Free: { issued: 240, used: 180, total: 240 },
              Basic: { issued: 1250, used: 950, total: 1250 },
              Pro: { issued: 2250, used: 1600, total: 2250 },
              Enterprise: { issued: 1260, used: 470, total: 1260 }
            }
          },
          revenueStats: {
            total: 12500,
            byPlan: {
              Basic: 2500,
              Pro: 6000,
              Enterprise: 4000
            },
            byMonth: [
              { month: 'Jan', amount: 950 },
              { month: 'Feb', amount: 1100 },
              { month: 'Mar', amount: 1250 },
              { month: 'Apr', amount: 1400 },
              { month: 'May', amount: 1600 },
              { month: 'Jun', amount: 1800 }
            ]
          }
        });
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  // Handle time range change
  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );
  }

  if (error && !analytics) {
    return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
    );
  }

  return (
    <ProtectedAdminRoute>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-semibold">Analytics Dashboard</h2>
            <div>
              <select
                value={timeRange}
                onChange={handleTimeRangeChange}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last 12 Months</option>
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Users</h3>
              <p className="text-2xl font-bold text-indigo-600">{analytics?.userStats?.total || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="text-green-500">+{analytics?.userStats?.new || 0}</span> new users
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Media Generated</h3>
              <p className="text-2xl font-bold text-indigo-600">{analytics?.mediaStats?.totalGenerated || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                Across all users
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Credits Used</h3>
              <p className="text-2xl font-bold text-indigo-600">{analytics?.creditStats?.totalUsed || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                Out of {analytics?.creditStats?.totalIssued || 0} issued
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Revenue</h3>
              <p className="text-2xl font-bold text-indigo-600">${analytics?.revenueStats?.total || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                From all subscriptions
              </p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* User Plan Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">User Plan Distribution</h3>
              <div className="h-64 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-8 border-indigo-500 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-indigo-600">{analytics?.userStats?.total || 0}</p>
                      <p className="text-xs text-gray-500">Total Users</p>
                    </div>
                  </div>
                </div>
                <div className="ml-8">
                  <div className="mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-indigo-600 rounded-full mr-2"></div>
                      <span className="text-sm">Free ({analytics?.userStats?.planDistribution?.Free || 0})</span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-indigo-400 rounded-full mr-2"></div>
                      <span className="text-sm">Basic ({analytics?.userStats?.planDistribution?.Basic || 0})</span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-indigo-300 rounded-full mr-2"></div>
                      <span className="text-sm">Pro ({analytics?.userStats?.planDistribution?.Pro || 0})</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-indigo-200 rounded-full mr-2"></div>
                      <span className="text-sm">Enterprise ({analytics?.userStats?.planDistribution?.Enterprise || 0})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms Acceptance Rate */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Terms Acceptance Rate</h3>
              <div className="h-64 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-8 border-green-500 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">{analytics?.userStats?.termsAcceptanceRate ? Math.round(analytics.userStats.termsAcceptanceRate * 100) : 0}%</p>
                      <p className="text-xs text-gray-500">Acceptance Rate</p>
                    </div>
                  </div>
                </div>
                <div className="ml-8">
                  <div className="mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Accepted ({analytics?.userStats?.total && analytics?.userStats?.termsAcceptanceRate ? Math.round(analytics.userStats.total * analytics.userStats.termsAcceptanceRate) : 0})</span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                      <span className="text-sm">Not Accepted ({analytics?.userStats?.total && analytics?.userStats?.termsAcceptanceRate ? Math.round(analytics.userStats.total * (1 - analytics.userStats.termsAcceptanceRate)) : 0})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Credit Usage by Plan */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Credit Usage by Plan</h3>
              <div className="h-64">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Free</span>
                      <span className="text-sm text-gray-500">{analytics?.creditStats?.byPlan?.Free?.used || 0} / {analytics?.creditStats?.byPlan?.Free?.issued || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${analytics?.creditStats?.byPlan?.Free?.issued ? (analytics?.creditStats?.byPlan?.Free?.used / analytics?.creditStats?.byPlan?.Free?.issued) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Basic</span>
                      <span className="text-sm text-gray-500">{analytics?.creditStats?.byPlan?.Basic?.used || 0} / {analytics?.creditStats?.byPlan?.Basic?.issued || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${analytics?.creditStats?.byPlan?.Basic?.issued ? (analytics?.creditStats?.byPlan?.Basic?.used / analytics?.creditStats?.byPlan?.Basic?.issued) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Pro</span>
                      <span className="text-sm text-gray-500">{analytics?.creditStats?.byPlan?.Pro?.used || 0} / {analytics?.creditStats?.byPlan?.Pro?.issued || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${analytics?.creditStats?.byPlan?.Pro?.issued ? (analytics?.creditStats?.byPlan?.Pro?.used / analytics?.creditStats?.byPlan?.Pro?.issued) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Enterprise</span>
                      <span className="text-sm text-gray-500">{analytics?.creditStats?.byPlan?.Enterprise?.used || 0} / {analytics?.creditStats?.byPlan?.Enterprise?.issued || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${analytics?.creditStats?.byPlan?.Enterprise?.issued ? (analytics?.creditStats?.byPlan?.Enterprise?.used / analytics?.creditStats?.byPlan?.Enterprise?.issued) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Media Generation by Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Media Generation by Type</h3>
              <div className="h-64 flex items-center justify-center">
                <div className="w-full max-w-md">
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Images</span>
                      <span className="text-sm text-gray-500">{analytics?.mediaStats?.images || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${analytics?.mediaStats?.totalGenerated ? (analytics?.mediaStats?.images || 0) / analytics?.mediaStats?.totalGenerated * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Videos</span>
                      <span className="text-sm text-gray-500">{analytics?.mediaStats?.videos || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-purple-500 h-4 rounded-full" style={{ width: `${analytics?.mediaStats?.totalGenerated ? (analytics?.mediaStats?.videos || 0) / analytics?.mediaStats?.totalGenerated * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Scenes</span>
                      <span className="text-sm text-gray-500">{analytics?.mediaStats?.scenes || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-green-500 h-4 rounded-full" style={{ width: `${analytics?.mediaStats?.totalGenerated ? (analytics?.mediaStats?.scenes || 0) / analytics?.mediaStats?.totalGenerated * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </ProtectedAdminRoute>

  );
}