'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import adminApi from '@/lib/adminApi';
import { getCreditsByPlan, calculateCreditUsage, formatCreditDisplay, getCreditColorClass } from '@/lib/creditUtils';
import { getUserCredits, updateUserCredits, resetUserCredits } from '@/lib/creditsManager';

// Function to get plan price based on plan name
const getPlanPrice = (planName) => {
  switch(planName?.toLowerCase()) {
    case 'basic': return 399;
    case 'pro': return 999;
    case 'enterprise': return 2999;
    case 'free':
    default: return 0;
  }
};

export default function UserDetail({ params }) {
  const router = useRouter();
  // Fix for params.id error - using React.use() to unwrap params
  const unwrappedParams = React.use(params);
  const userId = unwrappedParams.id;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    plan: 'Free',
    planPrice: 0,
    role: 'user',
    credits: { 
      totalPurchased: 0, 
      totalUsed: 0,
      balance: 0,
      imagesGenerated: 0,
      videosGenerated: 0,
      scenesGenerated: 0
    }
  });

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getUserById(userId);
        console.log('User data response:', response); // Debug log to check full response
        
        // Extract user data from the nested structure, handling different response formats
        let userDataFromResponse;
        
        if (response.data?.data) {
          userDataFromResponse = response.data.data.user;
        } else if (response.data) {
          userDataFromResponse = response.data;
        } else {
          userDataFromResponse = response;
        }
        
        console.log('Extracted user data:', userDataFromResponse); // Debug log for extracted data
        
        // Ensure we have default values for missing data
        const userData = {
          ...userDataFromResponse,
          name: userDataFromResponse.name || 
                (userDataFromResponse.firstName && userDataFromResponse.lastName ? 
                  `${userDataFromResponse.firstName} ${userDataFromResponse.lastName}` : 
                  'N/A'),
          email: userDataFromResponse.email || 'No email available',
          _id: userDataFromResponse._id || userId || 'ID not available',
          plan: userDataFromResponse.plan || 'Free',
          planPrice: userDataFromResponse.planPrice || getPlanPrice(userDataFromResponse.plan), // Use API planPrice or fallback to local calculation
          role: userDataFromResponse.role || 'user',
          termsAccepted: userDataFromResponse.termsAccepted ? 
            (typeof userDataFromResponse.termsAccepted === 'boolean' ? 
              { status: userDataFromResponse.termsAccepted, acceptedAt: null, version: 'N/A' } : 
              userDataFromResponse.termsAccepted) : 
            { status: false, acceptedAt: null, version: 'N/A' },
          lastLogin: userDataFromResponse.lastLogin || null,
          credits: userDataFromResponse.credits || {
            totalPurchased: userDataFromResponse.credits?.totalPurchased || 0,
            totalUsed: userDataFromResponse.credits?.totalUsed || 0,
            balance: userDataFromResponse.credits?.balance || 0,
            imagesGenerated: userDataFromResponse.credits?.imagesGenerated || 0,
            videosGenerated: userDataFromResponse.credits?.videosGenerated || 0,
            scenesGenerated: userDataFromResponse.credits?.scenesGenerated || 0
          }
        };
        
        console.log('Processed user data:', userData); // Debug log for processed data
        
        setUser(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          plan: userData.plan || 'Free',
          planPrice: userData.planPrice || 0,
          role: userData.role || 'user',
          credits: {
            totalPurchased: userData.credits?.totalPurchased || 0,
            totalUsed: userData.credits?.totalUsed || 0,
            balance: userData.credits?.balance || 0,
            imagesGenerated: userData.credits?.imagesGenerated || 0,
            videosGenerated: userData.credits?.videosGenerated || 0,
            scenesGenerated: userData.credits?.scenesGenerated || 0
          }
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try again.');
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Check if this is a credit field
    if (name.includes('totalPurchased') || name.includes('totalUsed') || 
        name.includes('imagesGenerated') || name.includes('videosGenerated') || 
        name.includes('scenesGenerated')) {
      
      const creditField = name;
      const numValue = parseInt(value, 10) || 0;
      
      setFormData({
        ...formData,
        credits: {
          ...formData.credits,
          [creditField]: numValue
        }
      });
      
      // Auto-calculate balance if totalPurchased or totalUsed changes
      if (creditField === 'totalPurchased' || creditField === 'totalUsed') {
        const totalPurchased = creditField === 'totalPurchased' ? numValue : formData.credits.totalPurchased;
        const totalUsed = creditField === 'totalUsed' ? numValue : formData.credits.totalUsed;
        
        setFormData(prev => ({
          ...prev,
          credits: {
            ...prev.credits,
            [creditField]: numValue,
            balance: Math.max(0, totalPurchased - totalUsed)
          }
        }));
      }
    } 
    // Handle plan change
    else if (name === 'plan') {
      const planPrice = getPlanPrice(value);
      const planCredits = getCreditsByPlan(value);
      
      setFormData(prev => ({
        ...prev,
        plan: value,
        planPrice: planPrice,
        credits: {
          ...prev.credits,
          totalPurchased: planCredits.totalCredits || prev.credits.totalPurchased,
          balance: Math.max(0, (planCredits.totalCredits || prev.credits.totalPurchased) - prev.credits.totalUsed)
        }
      }));
    }
    // Handle all other fields
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle save all user data
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Calculate balance based on purchased and used
      const balance = formData.credits.totalPurchased - formData.credits.totalUsed;
      const updatedCredits = {
        ...formData.credits,
        balance
      };
      
      // Update user basic information
      await adminApi.updateUser(userId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role
      });
      
      // Update user plan
      await adminApi.updateUserPlan(userId, { 
        plan: formData.plan,
        planPrice: formData.planPrice
      });
      
      // Update user credits
      await adminApi.updateUserCredits(userId, updatedCredits);
      
      // Fetch updated user data to ensure UI is in sync
      const updatedUserResponse = await adminApi.getUserById(userId);
      setUser(updatedUserResponse.data.data || updatedUserResponse.data);
      
      setEditMode(false);
      setLoading(false);
      toast.success('User information updated successfully');
    } catch (err) {
      console.error('Error updating user information:', err);
      setError('Failed to update user information. Please try again.');
      setLoading(false);
    }
  };
  
  // Helper function to determine plan based on credits
  const getPlanFromCredits = (totalCredits) => {
    if (totalCredits >= 1000) return 'Enterprise';
    if (totalCredits >= 200) return 'Pro';
    if (totalCredits >= 50) return 'Basic';
    return 'Free';
  };
  
  // Helper function to get plan price based on plan name
  const getPlanPrice = (plan) => {
    const normalizedPlan = plan?.toLowerCase() || 'free';
    switch (normalizedPlan) {
      case 'basic': return 500;
      case 'pro': return 999;
      case 'enterprise': return 2999;
      default: return 0; // Free plan
    }
  };
  
  // Update user plan
  const updateUserPlan = async (newPlan) => {
    if (window.confirm(`Are you sure you want to update this user's plan to ${newPlan}?`)) {
      try {
        setLoading(true);
        // Get plan price
        const planPrice = getPlanPrice(newPlan);
        
        // Get default credits for the new plan
        const planCredits = getCreditsByPlan(newPlan);
        
        // Update credits based on the new plan
        const updatedCredits = {
          totalPurchased: planCredits.totalCredits || 0,
          totalUsed: user.credits?.totalUsed || 0,
          balance: Math.max(0, (planCredits.totalCredits || 0) - (user.credits?.totalUsed || 0)),
          imagesGenerated: user.credits?.imagesGenerated || 0,
          videosGenerated: user.credits?.videosGenerated || 0,
          scenesGenerated: user.credits?.scenesGenerated || 0
        };
        
        // Call API to update plan with price
        await adminApi.updateUserPlan(userId, { 
          plan: newPlan,
          planPrice: planPrice
        });
        
        // Update user credits based on the new plan
        await adminApi.updateUserCredits(userId, updatedCredits);
        
        // Refresh user data
        const response = await adminApi.getUserById(userId);
        let userData;
        
        // Extract user data from the nested structure, handling different response formats
        if (response.data?.data?.user) {
          userData = response.data.data.user;
        } else if (response.data?.data) {
          userData = response.data.data;
        } else if (response.data) {
          userData = response.data;
        } else {
          userData = response;
        }
        
        // Ensure credits are properly set
        userData = {
          ...userData,
          credits: {
            ...updatedCredits,
            ...userData.credits
          },
          planPrice: planPrice
        };
        
        setUser(userData);
        
        // Update form data with new credits
        setFormData({
          ...formData,
          plan: newPlan,
          planPrice: planPrice,
          credits: {
            ...updatedCredits,
            ...userData.credits
          }
        });
        
        setLoading(false);
        alert('User plan and credits updated successfully');
      } catch (err) {
        console.error('Error updating user plan:', err);
        alert('Failed to update user plan');
        setLoading(false);
      }
    }
  };
  
  // Reset user plan to Free
  const resetUserPlan = async () => {
    if (window.confirm('Are you sure you want to reset this user to Free plan?')) {
      try {
        // Call API to update plan to Free
        await adminApi.updateUserPlan(userId, { 
          plan: 'Free',
          planPrice: 0
        });
        
        // Update credits based on Free plan
        const planCredits = getCreditsByPlan('Free');
        
        // Refresh user data
        const response = await adminApi.getUserById(userId);
        setUser(response.data);
        
        alert('User plan reset to Free successfully');
      } catch (err) {
        console.error('Error resetting user plan:', err);
        alert('Failed to reset user plan');
      }
    }
  };

  // Go back to users list
  const handleBack = () => {
    router.push('/admin/users');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={handleBack}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
        >
          Back to Users
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          User not found
        </div>
        <button
          onClick={handleBack}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
        >
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <ProtectedAdminRoute>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-semibold">User Details</h2>
            <button
              onClick={handleBack}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Back to Users
            </button>
          </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* User Profile Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-2xl font-bold shadow-md">
                {user.firstName?.charAt(0) || user.name?.charAt(0) || 'U'}{user.lastName?.charAt(0) || ''}
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'User')}
                </h3>
                <p className="text-sm text-gray-600 font-medium">{user.email || 'No email available'}</p>
                <div className="mt-2 flex items-center">
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>
                    {user.role || 'user'}
                  </span>
                  {user.createdAt && (
                    <span className="ml-3 text-xs text-gray-500">
                      Joined: {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account Information
              </h4>
              <div className="bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-100">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">User ID</p>
                    <p className="text-sm font-medium overflow-auto break-all bg-gray-100 p-1 rounded mt-1">{user._id || 'ID not available'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Created At</p>
                    <p className="text-sm font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Not available'}
                    </p>
                  </div>
                  <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-medium">Plan</p>
                        <button
                          onClick={() => updateUserPlan('Free')}
                          className="text-xs text-indigo-600 hover:text-indigo-900 font-medium"
                          title="Reset to Free Plan"
                        >
                          Reset Plan
                        </button>
                      </div>
                      <p className="text-sm font-medium capitalize flex items-center mt-1">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          user.plan?.toLowerCase() === 'free' ? 'bg-gray-400' :
                          user.plan?.toLowerCase() === 'basic' ? 'bg-green-400' :
                          user.plan?.toLowerCase() === 'pro' ? 'bg-blue-500' :
                          user.plan?.toLowerCase() === 'enterprise' ? 'bg-purple-600' : 'bg-gray-400'
                        }`}></span>
                        {user.plan || 'Free'} 
                        {user.planPrice > 0 && <span className="ml-1 text-green-600 font-bold">₹{user.planPrice}</span>}
                      </p>
                    </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Credits</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm font-bold text-blue-600">
                        Available: <span className="text-lg">{user.credits?.balance || 0}</span>
                      </p>
                      <p className="text-sm font-medium">
                        Total: <span className="font-bold">{user.credits?.totalPurchased || 0}</span>
                      </p>
                    </div>
                    
                    
                    <div className="mt-3 grid grid-cols-3 gap-2 bg-gray-50 p-2 rounded-md border border-gray-200">
                      <div>
                        <span className="text-xs text-gray-500 block">Images:</span>
                        <span className="font-medium text-sm">{user.credits?.imagesGenerated || 0}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Videos:</span>
                        <span className="font-medium text-sm">{user.credits?.videosGenerated || 0}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Scenes:</span>
                        <span className="font-medium text-sm">{user.credits?.scenesGenerated || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Terms Accepted</p>
                    <div className="text-sm mt-1">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.termsAccepted?.status ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                        {user.termsAccepted?.status ? 'Yes' : 'No'}
                      </span>
                      {user.termsAccepted?.status && user.termsAccepted?.acceptedAt && (
                        <div className="text-xs mt-1">
                          <div>Date: {new Date(user.termsAccepted.acceptedAt).toLocaleString()}</div>
                          <div>Version: {user.termsAccepted.version || 'N/A'}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email Address</p>
                    <p className="text-sm font-medium mt-1">{user.email || 'No email available'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Last Login</p>
                    <p className="text-sm font-medium mt-1">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Never logged in'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Plan & Credits
                </h4>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="text-xs bg-blue-50 text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200"
                >
                  {editMode ? 'Cancel' : 'Edit Credits'}
                </button>
              </div>
              
              {/* Plan Information */}
              <div className="mb-4 p-5 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between mb-3">
                  <span className="text-sm font-medium">Current Plan:</span>
                  <span className="text-sm font-bold">{user.plan || 'Free'}</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-sm font-medium">Plan Price:</span>
                  <span className="text-sm font-bold text-green-600">₹{user.planPrice || getPlanPrice(user.plan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Plan Credits:</span>
                  <span className="text-sm font-bold text-blue-600">{user.credits?.balance || getCreditsByPlan(user.plan)}</span>
                </div>
              </div>
              
              {editMode ? (
                <form onSubmit={handleSave} className="bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-100">
                  {/* Basic User Information */}
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Role</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Plan Information */}
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Plan Information</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Plan</label>
                      <select
                        name="plan"
                        value={formData.plan}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="Free">Free</option>
                        <option value="Basic">Basic</option>
                        <option value="Pro">Pro</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Plan Price</label>
                      <input
                        type="number"
                        name="planPrice"
                        value={formData.planPrice}
                        disabled
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                      />
                      <p className="text-xs text-gray-400 mt-1">Auto-calculated from plan</p>
                    </div>
                  </div>
                  
                  {/* Credits Information */}
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Credits Information</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Total Purchased Credits</label>
                      <input
                        type="number"
                        name="totalPurchased"
                        value={formData.credits.totalPurchased}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Used Credits</label>
                      <input
                        type="number"
                        name="totalUsed"
                        value={formData.credits.totalUsed}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Balance (Auto-calculated)</label>
                      <input
                        type="number"
                        name="balance"
                        value={Math.max(0, formData.credits.totalPurchased - formData.credits.totalUsed)}
                        disabled
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Images Generated</label>
                      <input
                        type="number"
                        name="imagesGenerated"
                        value={formData.credits.imagesGenerated}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Videos Generated</label>
                      <input
                        type="number"
                        name="videosGenerated"
                        value={formData.credits.videosGenerated}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Scenes Generated</label>
                      <input
                        type="number"
                        name="scenesGenerated"
                        value={formData.credits.scenesGenerated}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Set Credits Based on Plan</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const planCredits = 3; // Free plan credits
                          setFormData({
                            ...formData,
                            credits: { 
                              ...formData.credits, 
                              totalPurchased: planCredits,
                              balance: planCredits - formData.credits.totalUsed
                            }
                          });
                          // Also update user plan
                          adminApi.updateUserPlan(userId, { 
                            plan: 'free',
                            credits: {
                              totalPurchased: planCredits,
                              totalUsed: formData.credits.totalUsed,
                              balance: planCredits - formData.credits.totalUsed,
                              imagesGenerated: formData.credits.imagesGenerated
                            }
                          })
                            .then(response => {
                              console.log('Plan update response:', response);
                              alert(`Plan updated to Free with ${planCredits} credits`);
                              // Update user data in state
                              setUser(prev => ({
                                ...prev,
                                plan: 'free',
                                planPrice: 0,
                                credits: {
                                  ...prev.credits,
                                  totalPurchased: planCredits,
                                  balance: planCredits - formData.credits.totalUsed
                                }
                              }));
                            })
                            .catch(err => {
                              console.error('Error updating plan:', err);
                              alert('Failed to update plan. Please try again.');
                            });
                        }}
                        className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-300 border border-gray-300 transition-all"
                      >
                        Free (3)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const planCredits = 50; // Basic plan credits
                          const planPrice = 499; // Basic plan price
                          setFormData({
                            ...formData,
                            credits: { 
                              ...formData.credits, 
                              totalPurchased: planCredits,
                              balance: planCredits - formData.credits.totalUsed
                            }
                          });
                          // Also update user plan
                          adminApi.updateUserPlan(userId, { 
                            plan: 'basic',
                            credits: {
                              totalPurchased: planCredits,
                              totalUsed: formData.credits.totalUsed,
                              balance: planCredits - formData.credits.totalUsed,
                              imagesGenerated: formData.credits.imagesGenerated
                            },
                            planPrice: planPrice
                          })
                            .then(response => {
                              console.log('Plan update response:', response);
                              alert(`Plan updated to Basic with ${planCredits} credits`);
                              // Update user data in state
                              setUser(prev => ({
                                ...prev,
                                plan: 'basic',
                                planPrice: planPrice,
                                credits: {
                                  ...prev.credits,
                                  totalPurchased: planCredits,
                                  balance: planCredits - formData.credits.totalUsed
                                }
                              }));
                            })
                            .catch(err => {
                              console.error('Error updating plan:', err);
                              alert('Failed to update plan. Please try again.');
                            });
                        }}
                        className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-200 border border-blue-200 transition-all"
                      >
                        Basic (50)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const planCredits = 100; // Pro plan credits
                          const planPrice = 999; // Pro plan price
                          setFormData({
                            ...formData,
                            credits: { 
                              ...formData.credits, 
                              totalPurchased: planCredits,
                              balance: planCredits - formData.credits.totalUsed
                            }
                          });
                          // Also update user plan
                          adminApi.updateUserPlan(userId, { 
                            plan: 'pro',
                            credits: {
                              totalPurchased: planCredits,
                              totalUsed: formData.credits.totalUsed,
                              balance: planCredits - formData.credits.totalUsed,
                              imagesGenerated: formData.credits.imagesGenerated
                            },
                            planPrice: planPrice
                          })
                            .then(response => {
                              console.log('Plan update response:', response);
                              alert(`Plan updated to Pro with ${planCredits} credits`);
                              // Update user data in state
                              setUser(prev => ({
                                ...prev,
                                plan: 'pro',
                                planPrice: planPrice,
                                credits: {
                                  ...prev.credits,
                                  totalPurchased: planCredits,
                                  balance: planCredits - formData.credits.totalUsed
                                }
                              }));
                            })
                            .catch(err => {
                              console.error('Error updating plan:', err);
                              alert('Failed to update plan. Please try again.');
                            });
                        }}
                        className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-purple-200 border border-purple-200 transition-all"
                      >
                        Pro (100)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const planCredits = 200; // Enterprise plan credits
                          const planPrice = 1999; // Enterprise plan price
                          setFormData({
                            ...formData,
                            credits: { 
                              ...formData.credits, 
                              totalPurchased: planCredits,
                              balance: planCredits - formData.credits.totalUsed
                            }
                          });
                          // Also update user plan
                          adminApi.updateUserPlan(userId, { 
                            plan: 'enterprise',
                            credits: {
                              totalPurchased: planCredits,
                              totalUsed: formData.credits.totalUsed,
                              balance: planCredits - formData.credits.totalUsed,
                              imagesGenerated: formData.credits.imagesGenerated
                            },
                            planPrice: planPrice
                          })
                            .then(response => {
                              console.log('Plan update response:', response);
                              alert(`Plan updated to Enterprise with ${planCredits} credits`);
                              // Update user data in state
                              setUser(prev => ({
                                ...prev,
                                plan: 'enterprise',
                                planPrice: planPrice,
                                credits: {
                                  ...prev.credits,
                                  totalPurchased: planCredits,
                                  balance: planCredits - formData.credits.totalUsed
                                }
                              }));
                            })
                            .catch(err => {
                              console.error('Error updating plan:', err);
                              alert('Failed to update plan. Please try again.');
                            });
                        }}
                        className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-indigo-200 border border-indigo-200 transition-all"
                      >
                        Enterprise (200)
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium shadow-sm transition-all hover:shadow"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      ) : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-100">
                  <h5 className="text-sm font-medium mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Credit Usage
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600 font-medium">Total Purchased</p>
                      <p className="text-sm font-bold text-blue-700">{user.credits?.totalPurchased || 0}</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded border border-red-100">
                      <p className="text-xs text-gray-600 font-medium">Total Used</p>
                      <p className="text-sm font-bold text-red-700">{user.credits?.totalUsed || 0}</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded border border-green-100">
                      <p className="text-xs text-gray-600 font-medium">Balance</p>
                      <p className="text-sm font-bold text-green-700">{user.credits?.balance || 0}</p>
                    </div>
                    <div className="bg-purple-50 p-2 rounded border border-purple-100">
                      <p className="text-xs text-gray-600 font-medium">Images Generated</p>
                      <p className="text-sm font-bold text-purple-700">{user.credits?.imagesGenerated || 0}</p>
                    </div>
                    <div className="bg-indigo-50 p-2 rounded border border-indigo-100">
                      <p className="text-xs text-gray-600 font-medium">Videos Generated</p>
                      <p className="text-sm font-bold text-indigo-700">{user.credits?.videosGenerated || 0}</p>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded border border-yellow-100">
                      <p className="text-xs text-gray-600 font-medium">Scenes Generated</p>
                      <p className="text-sm font-bold text-yellow-700">{user.credits?.scenesGenerated || 0}</p>
                    </div>
                  </div>
                  
                  <div className="mt-5">
                    <h5 className="text-sm font-medium mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Quick Actions
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateUserPlan('Basic')}
                        className="bg-green-100 text-green-800 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-200 border border-green-200 transition-all"
                      >
                        Set Basic Plan
                      </button>
                      <button
                        onClick={() => updateUserPlan('Pro')}
                        className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-200 border border-blue-200 transition-all"
                      >
                        Set Pro Plan
                      </button>
                      <button
                        onClick={() => updateUserPlan('Enterprise')}
                        className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-purple-200 border border-purple-200 transition-all"
                      >
                        Set Enterprise Plan
                      </button>
                      <button
                        onClick={() => updateUserPlan('Free')}
                        className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 border border-gray-200 transition-all"
                      >
                        Reset to Free
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Media Generation Statistics */}
          <div className="p-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-4">Media Generation Statistics</h4>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Images Generated</p>
                  <p className="text-xl font-semibold text-blue-600">
                    {user.credits?.imagesGenerated || 0}
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Videos Generated</p>
                  <p className="text-xl font-semibold text-purple-600">
                    {user.credits?.videosGenerated || 0}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Scenes Generated</p>
                  <p className="text-xl font-semibold text-green-600">
                    {user.credits?.scenesGenerated || 0}
                  </p>
                </div>
              </div>
              
              {/* Image Analysis Section */}
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Image Analysis</p>
                <p className="text-xl font-semibold text-yellow-600">
                  {user.imageAnalysis?.length || user.mediaAnalyzed?.length || 0}
                </p>
                {(!user.imageAnalysis && !user.mediaAnalyzed) && (
                  <p className="text-sm text-gray-500 mt-1">No image analysis available</p>
                )}
              </div>
            </div>
          </div>
          
          {/* User Activity */}
          <div className="p-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-4">Recent Activity</h4>
            
            {/* Media Generation History */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Media Generation History</h5>
              {user.mediaGenerated && user.mediaGenerated.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {user.mediaGenerated.slice(0, 5).map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              item.type === 'image' ? 'bg-blue-100 text-blue-800' :
                              item.type === 'video' ? 'bg-purple-100 text-purple-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm">{item.prompt}</td>
                          <td className="px-4 py-2 text-sm">{new Date(item.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">
                  No media generation history available
                </div>
              )}
            </div>
            
            {/* Transaction History */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-sm font-medium text-gray-700">Transaction History</h5>
              </div>
              
              {user.transactions && user.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(user.transactions || []).map((transaction, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm font-mono">{transaction.transactionId || `TXN-${Math.random().toString(36).substr(2, 9)}`}</td>
                          <td className="px-4 py-2 text-sm">{transaction.plan || user.plan || 'Free'}</td>
                          <td className="px-4 py-2 text-sm">${transaction.amount || '0.00'}</td>
                          <td className="px-4 py-2 text-sm">{transaction.date ? new Date(transaction.date).toLocaleDateString() : new Date().toLocaleDateString()}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              transaction.status === 'refunded' ? 'bg-gray-100 text-gray-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {transaction.status || 'completed'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <button 
                              onClick={() => {
                                if (window.confirm('Are you sure you want to process a refund for this transaction?')) {
                                  alert('Refund process initiated. Transaction will be marked as refunded.');
                                }
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                              disabled={transaction.status === 'refunded'}
                            >
                              {transaction.status === 'refunded' ? 'Refunded' : 'Process Refund'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">
                  No transaction history available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
}