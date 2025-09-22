'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import adminApi from '@/lib/adminApi';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    plan: '',
    tcAccepted: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    plan: 'Free',
    planPrice: 0, // Ensure this is always initialized with a number
    password: '', // Add password field for new user creation
    credits: {
      videosGenerated: 0,
      scenesGenerated: 0,
      imagesGenerated: 0,
      totalPurchased: 3, // Default Free plan credits
      totalUsed: 0,
      balance: 3 // Default Free plan credits
    }
  });
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  // OTP verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [userId, setUserId] = useState(null);

  // Fetch users with current filters and pagination
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Create a clean copy of filters without empty values
      const cleanFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
          cleanFilters[key] = filters[key];
        }
      });
      
      const response = await adminApi.getUsers(
        cleanFilters, 
        pagination.page, 
        pagination.limit
      );
      
      // Process user data to ensure credits are properly formatted
      const processedUsers = response.data.data.map(user => ({
        ...user,
        name: user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'N/A'),
        email: user.email || 'No email available',
        plan: user.plan || 'Free',
        planPrice: user.planPrice || 0,
        credits: {
          totalPurchased: user.credits?.totalPurchased || 0,
          totalUsed: user.credits?.totalUsed || 0,
          balance: user.credits?.balance || 0,
          imagesGenerated: user.credits?.imagesGenerated || 0,
          videosGenerated: user.credits?.videosGenerated || 0,
          scenesGenerated: user.credits?.scenesGenerated || 0
        },
        termsAccepted: user.termsAccepted ? {
          status: typeof user.termsAccepted === 'boolean' ? user.termsAccepted : (user.termsAccepted.status || false),
          acceptedAt: user.termsAccepted.acceptedAt ? new Date(user.termsAccepted.acceptedAt).toLocaleString() : 'N/A',
          version: user.termsAccepted.version || 'N/A'
        } : {
          status: false,
          acceptedAt: 'N/A',
          version: 'N/A'
        }
      }));
      
      setUsers(processedUsers);
      setPagination({
        ...pagination,
        total: response.data.total,
        totalPages: response.data.totalPages
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Apply filters
  const applyFilters = (e) => {
    e.preventDefault();
    setPagination({
      ...pagination,
      page: 1 // Reset to first page when applying new filters
    });
    // Call fetchUsers directly with updated filters
    fetchUsers();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      plan: '',
      tcAccepted: '',
      search: ''
    });
    setPagination({
      ...pagination,
      page: 1
    });
    // Call fetchUsers after state updates using setTimeout to ensure state is updated
    setTimeout(() => {
      fetchUsers();
    }, 0);
  };

  // Handle page change
  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({
        ...pagination,
        page: newPage
      });
    }
  };

  // Reset user credits
  const resetCredits = async (userId) => {
    try {
      if (window.confirm('Are you sure you want to reset this user\'s credits?')) {
        setLoading(true);
        await adminApi.updateUserCredits(userId, { 
          totalPurchased: 0, 
          totalUsed: 0,
          balance: 0,
          imagesGenerated: 0,
          videosGenerated: 0,
          scenesGenerated: 0
        });
        await adminApi.updateUserPlan(userId, { plan: 'Free', planPrice: 0 });
        fetchUsers(); // Refresh the list
        alert('User credits and plan reset successfully');
      }
    } catch (err) {
      console.error('Error resetting credits:', err);
      alert('Failed to reset user credits');
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle user block status
  const toggleBlockUser = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const actionText = newStatus ? 'block' : 'unblock';
      
      if (window.confirm(`Are you sure you want to ${actionText} this user?`)) {
        setLoading(true);
        await adminApi.updateUserStatus(userId, newStatus);
        fetchUsers(); // Refresh the list
        alert(`User ${actionText}ed successfully`);
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      alert(`Failed to ${currentStatus ? 'unblock' : 'block'} user`);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete user
  const deleteUser = async (userId) => {
    try {
      if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        setLoading(true);
        await adminApi.deleteUser(userId);
        fetchUsers(); // Refresh the list
        alert('User deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset user to free plan
  const resetToFreePlan = async (userId) => {
    try {
      if (window.confirm('Are you sure you want to reset this user to the Free plan?')) {
        setLoading(true);
        await adminApi.updateUser(userId, { plan: 'Free' });
        fetchUsers(); // Refresh the list
        alert('User reset to Free plan successfully');
      }
    } catch (err) {
      console.error('Error resetting user to Free plan:', err);
      alert('Failed to reset user to Free plan');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening edit modal
  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      plan: user.plan || 'Free',
      planPrice: user.planPrice || 0,
      credits: {
        videosGenerated: user.credits?.videosGenerated || 0,
        scenesGenerated: user.credits?.scenesGenerated || 0,
        imagesGenerated: user.credits?.imagesGenerated || 0,
        totalPurchased: user.credits?.totalPurchased || 0,
        totalUsed: user.credits?.totalUsed || 0,
        balance: user.credits?.balance || 0
      }
    });
    setShowEditModal(true);
  };

  // Get plan details (credits and price)
  const getPlanDetails = (planName) => {
    switch(planName?.toLowerCase()) {
      case 'basic': return { credits: 50, price: 499 };
      case 'pro': return { credits: 200, price: 999 };
      case 'enterprise': return { credits: 1000, price: 2999 };
      case 'business': return { credits: 500, price: 1499 };
      case 'free':
      default: return { credits: 3, price: 0 };
    }
  };

  // Handle form input changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'plan') {
      // When plan changes, update credits and price automatically
      const planDetails = getPlanDetails(value);
      
      // Calculate new balance based on current usage
      const currentUsed = editFormData.credits?.totalUsed || 0;
      const newBalance = Math.max(0, planDetails.credits - currentUsed);
      
      setEditFormData({
        ...editFormData,
        plan: value,
        planPrice: planDetails.price,
        credits: {
          ...editFormData.credits,
          totalPurchased: planDetails.credits,
          balance: newBalance
        }
      });
    } else if (name.includes('credits.')) {
      const creditField = name.split('.')[1];
      
      // If changing totalPurchased, also update balance
      if (creditField === 'totalPurchased') {
        const newTotalPurchased = parseInt(value) || 0;
        const currentUsed = editFormData.credits?.totalUsed || 0;
        const newBalance = Math.max(0, newTotalPurchased - currentUsed);
        
        setEditFormData({
          ...editFormData,
          credits: {
            ...editFormData.credits,
            totalPurchased: newTotalPurchased,
            balance: newBalance
          }
        });
      } else if (creditField === 'totalUsed') {
        // If changing totalUsed, also update balance
        const newTotalUsed = parseInt(value) || 0;
        const currentPurchased = editFormData.credits?.totalPurchased || 0;
        const newBalance = Math.max(0, currentPurchased - newTotalUsed);
        
        setEditFormData({
          ...editFormData,
          credits: {
            ...editFormData.credits,
            totalUsed: newTotalUsed,
            balance: newBalance
          }
        });
      } else {
        // For other credit fields, just update the value
        setEditFormData({
          ...editFormData,
          credits: {
            ...editFormData.credits,
            [creditField]: parseInt(value) || 0
          }
        });
      }
    } else {
      // For other fields, just update the value
      setEditFormData({
        ...editFormData,
        [name]: value
      });
    }
  };

  // Save user edits
  const saveUserEdits = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      setSaving(true);
      
      // Update user basic information
      await adminApi.updateUser(editingUser._id, {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email
      });
      
      // Update user plan separately with proper error handling
      try {
        await adminApi.updateUserPlan(editingUser._id, {
          plan: editFormData.plan,
          planPrice: editFormData.planPrice,
          credits: editFormData.credits // Send credits with plan update to ensure consistency
        });
      } catch (planError) {
        console.error('Error updating user plan:', planError);
        throw new Error('Failed to update user plan');
      }
      
      alert('User updated successfully');
      setShowEditModal(false);
      fetchUsers(); // Refresh the user list
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Verify OTP function
  const verifyOTP = async () => {
    try {
      setSaving(true);
      
      if (!otpValue || !userId) {
        alert('कृपया OTP दर्ज करें');
        setSaving(false);
        return;
      }
      
      try {
        await adminApi.verifyUserOTP({ userId, otp: otpValue });
        alert('Email Verified successfully');
        setShowOtpModal(false);
        setOtpValue('');
        setUserId(null);
        fetchUsers(); // Refresh the user list
      } catch (error) {
        console.error('Error verifying OTP:', error);
        if (error.response && error.response.data && error.response.data.message) {
          alert(`OTP verification error: ${error.response.data.message}`);
        } else {
          alert('Error verifying OTP. Please try again.');
        }
      } finally {
        setSaving(false);
      }
    } catch (err) {
      console.error('Error in verifyOTP:', err);
      setSaving(false);
    }
  };
  
  const addNewUser = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Get plan details to ensure proper credit allocation
      const planDetails = getPlanDetails(editFormData.plan);
      
      // Create user with proper plan and credits
      const userData = {
        ...editFormData,
        password: editFormData.password, // Ensure password is included
        planPrice: editFormData.planPrice || planDetails.price,
        credits: {
          ...editFormData.credits,
          totalPurchased: planDetails.credits,
          balance: planDetails.credits,
          totalUsed: 0,
          videosGenerated: 0,
          scenesGenerated: 0,
          imagesGenerated: 0
        }
      };
      
      try {
        const response = await adminApi.createUser(userData);
        
        // Check if OTP verification is required
        if (response.data && response.data.requiresOTP && response.data.user && response.data.user.id) {
          setUserId(response.data.user.id);
          setShowOtpModal(true);
          alert('OTP has been sent. Please enter the OTP sent to your email.');
        } else if (response.data && response.data.requiresOTP && response.data.userId) {
          // Alternative response format
          setUserId(response.data.userId);
          setShowOtpModal(true);
          alert('OTP has been sent. Please enter the OTP sent to your email.');
        } else {
          alert('User created successfully');
          setShowAddModal(false);
          setEditFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            plan: 'Free',
            planPrice: 0,
            credits: {
              videosGenerated: 0,
              scenesGenerated: 0,
              imagesGenerated: 0,
              totalPurchased: 3,
              totalUsed: 0,
              balance: 3
            }
          });
          fetchUsers(); // Refresh the user list
        }
      } catch (createError) {
        console.error('Error creating user:', createError);
        // Check if user already exists error
        if (createError.response && createError.response.data && createError.response.data.message && createError.response.data.message.includes('already exists')) {
          alert('User already exists: This email is already registered. Please use a different email.');
        } else {
          throw new Error('Failed to create user: ' + (createError.message || 'Unknown error'));
        }
      }
    } catch (err) {
      console.error('Error creating user:', err);
      alert('Failed to create user: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedAdminRoute>
        <div className="mb-6">
          <h2 className="text-4xl font-semibold mb-4">User Management</h2>
        
        {/* Filters */}
        <form onSubmit={applyFilters} className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button
              type="button"
              onClick={() => {
                setEditFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  plan: 'Free',
                  credits: {
                    videosGenerated: 0,
                    scenesGenerated: 0,
                    balance: 0
                  }
                });
                setShowAddModal(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add User
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                name="plan"
                value={filters.plan}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Plans</option>
                <option value="Free">Free</option>
                <option value="Basic">Basic</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">T&C Accepted</label>
              <select
                name="tcAccepted"
                value={filters.tcAccepted}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Name or Email"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Apply Filters
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </form>
        
        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Stats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">T&C</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signup Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.isBlocked && (
                              <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Block
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">
                            {user.plan || 'Free'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div>Total: {user.credits?.totalPurchased || 0}</div>
                            <div>Used: {user.credits?.totalUsed || 0}</div>
                            <div>Available: {user.credits?.balance || 0}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            <span className="font-medium">Images:</span> {user.credits?.imagesGenerated || 0}
                          </div>
                          <div className="text-xs text-gray-900">
                            <span className="font-medium">Videos:</span> {user.credits?.videosGenerated || 0}
                          </div>
                          <div className="text-xs text-gray-900">
                            <span className="font-medium">Scenes:</span> {user.credits?.scenesGenerated || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.termsAccepted?.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.termsAccepted?.status ? 'Yes' : 'No'}
                          </span>
                          {user.termsAccepted?.status && (
                            <div className="text-xs mt-1">
                              <div>Date: {user.termsAccepted.acceptedAt}</div>
                              <div>Version: {user.termsAccepted.version}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.role || 'user'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <div className="relative group">
                              <button className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center">
                                <span>Actions</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block ">
                                <Link href={`/admin/users/${user._id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View Details
                                </Link>
                                <button 
                                  onClick={() => handleEditClick(user)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit User
                                </button>
                                <button
                                  onClick={() => resetCredits(user._id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Reset Credits
                                </button>
                                <button
                                  onClick={() => resetToFreePlan(user._id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Reset to Free Plan
                                </button>
                                <button
                                  onClick={() => toggleBlockUser(user._id, user.isBlocked)}
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50 flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${user.isBlocked ? 'text-green-500' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={user.isBlocked ? 
                                      "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" : 
                                      "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"} />
                                  </svg>
                                  {user.isBlocked ? 'Unblock User' : 'Block User'}
                                </button>
                                <button
                                  onClick={() => deleteUser(user._id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete User
                                </button>
                              </div>
                            </div>
                            
                            <Link href={`/admin/users/${user._id}`} className="bg-indigo-500 text-white hover:bg-indigo-600 p-1.5 rounded-md transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            
                            <button 
                              onClick={() => handleEditClick(user)}
                              className="bg-blue-500 text-white hover:bg-blue-600 p-1.5 rounded-md transition-all"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`px-3 py-1 rounded-md ${
                      pagination.page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`px-3 py-1 rounded-md ${
                      pagination.page === pagination.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Edit User: {editingUser?.name}</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={saveUserEdits} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editFormData.firstName}
                    onChange={handleEditFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editFormData.lastName}
                    onChange={handleEditFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <select
                    name="plan"
                    value={editFormData.plan}
                    onChange={handleEditFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Free">Free</option>
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                    <option value="Business">Business</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Price (₹)</label>
                  <input
                    type="number"
                    name="planPrice"
                    value={editFormData.planPrice || 0}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated from plan</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Credits</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Purchased</label>
                    <input
                      type="number"
                      name="credits.totalPurchased"
                      value={editFormData.credits.totalPurchased}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Used</label>
                    <input
                      type="number"
                      name="credits.totalUsed"
                      value={editFormData.credits.totalUsed}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Balance</label>
                    <input
                      type="number"
                      name="credits.balance"
                      value={editFormData.credits.balance}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                <h4 className="font-medium text-gray-700 mb-2">Usage Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Images Generated</label>
                    <input
                      type="number"
                      name="credits.imagesGenerated"
                      value={editFormData.credits.imagesGenerated}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Videos Generated</label>
                    <input
                      type="number"
                      name="credits.videosGenerated"
                      value={editFormData.credits.videosGenerated}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scenes Generated</label>
                    <input
                      type="number"
                      name="credits.scenesGenerated"
                      value={editFormData.credits.scenesGenerated}
                      onChange={handleEditFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New User</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={addNewUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editFormData.firstName}
                    onChange={handleEditFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editFormData.lastName}
                    onChange={handleEditFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={editFormData.password || ""}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <select
                    name="plan"
                    value={editFormData.plan}
                    onChange={handleEditFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Free">Free</option>
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                    <option value="Business">Business</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Price (₹)</label>
                  <input
                    type="number"
                    name="planPrice"
                    value={editFormData.planPrice}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated from plan</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Credits Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Purchased</label>
                    <input
                      type="number"
                      name="credits.totalPurchased"
                      value={editFormData.credits.totalPurchased}
                      disabled
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-set from plan</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Used</label>
                    <input
                      type="number"
                      name="credits.totalUsed"
                      value={editFormData.credits.totalUsed}
                      disabled
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Balance</label>
                    <input
                      type="number"
                      name="credits.balance"
                      value={editFormData.credits.balance}
                      disabled
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">OTP Verification</h2>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 mb-2">Enter the OTP sent to the email</p>
              <input
                type="text"
                value={otpValue || ""}
                onChange={(e) => setOtpValue(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter OTP"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={verifyOTP}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {saving ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedAdminRoute>
  );
}