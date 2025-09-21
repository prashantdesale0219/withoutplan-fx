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
    credits: { 
      totalPurchased: 0, 
      totalUsed: 0,
      balance: 0,
      imagesGenerated: 0
    }
  });

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getUserById(userId);
        console.log('User data response:', response.data.data); // Debug log to check response
        
        // Extract user data from the nested structure
        const userDataFromResponse = response.data?.data || response.data;
        
        // Ensure we have default values for missing data
        const userData = {
          ...userDataFromResponse,
          name: userDataFromResponse.name || (userDataFromResponse.firstName && userDataFromResponse.lastName ? `${userDataFromResponse.firstName} ${userDataFromResponse.lastName}` : 'N/A'),
          email: userDataFromResponse.email || 'No email available',
          _id: userDataFromResponse._id || userId || 'ID not available',
          plan: userDataFromResponse.plan || 'Free',
          planPrice: userDataFromResponse.planPrice || getPlanPrice(userDataFromResponse.plan), // Use API planPrice or fallback to local calculation
          role: userDataFromResponse.role || 'user',
          termsAccepted: userDataFromResponse.termsAccepted || false,
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
        
        setUser(userData);
        setFormData({
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
    const numValue = parseInt(value, 10) || 0;
    
    setFormData({
      ...formData,
      credits: {
        ...formData.credits,
        [name]: numValue
      }
    });
    
    // Auto-calculate balance if totalPurchased or totalUsed changes
    if (name === 'totalPurchased' || name === 'totalUsed') {
      const totalPurchased = name === 'totalPurchased' ? numValue : formData.credits.totalPurchased;
      const totalUsed = name === 'totalUsed' ? numValue : formData.credits.totalUsed;
      
      setFormData(prev => ({
        ...prev,
        credits: {
          ...prev.credits,
          [name]: numValue,
          balance: Math.max(0, totalPurchased - totalUsed)
        }
      }));
    }
  };

  // Handle save credits
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
      
      const response = await adminApi.updateUserCredits(userId, updatedCredits);
      console.log('Credits update response:', response);
      
      // Update plan based on credits
      const newPlan = getPlanFromCredits(updatedCredits.totalPurchased);
      const newPlanPrice = getPlanPrice(newPlan);
      
      // Update user plan if it has changed
      if (user.plan !== newPlan || user.planPrice !== newPlanPrice) {
        await adminApi.updateUserPlan(userId, { 
          plan: newPlan,
          planPrice: newPlanPrice
        });
      }
      
      // Fetch updated user data to ensure UI is in sync
      const updatedUserResponse = await adminApi.getUserById(userId);
      setUser(updatedUserResponse.data.data || updatedUserResponse.data);
      
      setEditMode(false);
      setLoading(false);
      alert('Credits and plan updated successfully');
    } catch (err) {
      console.error('Error updating credits:', err);
      setError('Failed to update credits. Please try again.');
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
        // Get plan price
        const planPrice = getPlanPrice(newPlan);
        
        // Call API to update plan with price
        await adminApi.updateUserPlan(userId, { 
          plan: newPlan,
          planPrice: planPrice
        });
        
        // Refresh user data
        const response = await adminApi.getUserById(userId);
        setUser(response.data.data || response.data);
        
        alert('User plan updated successfully');
      } catch (err) {
        console.error('Error resetting user plan:', err);
        alert('Failed to reset user plan');
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
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-xl font-bold">
                {user.firstName?.charAt(0) || ''}{user.lastName?.charAt(0) || ''}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {user.name || 'N/A N/A'}
                </h3>
                <p className="text-sm text-gray-500 font-medium">{user.email || 'No email available'}</p>
                <div className="mt-1 flex items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role || 'user'}
                  </span>
                  {user.createdAt && (
                    <span className="ml-2 text-xs text-gray-500">
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
              <h4 className="text-sm font-medium text-gray-500 mb-2">Account Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">User ID</p>
                    <p className="text-sm font-medium overflow-auto break-all">{user._id || 'ID not available'}</p>
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
                      <p className="text-sm font-medium capitalize">
                        {user.plan || 'Free'} 
                        {user.planPrice > 0 && <span className="ml-1 text-green-600">₹{user.planPrice}</span>}
                      </p>
                    </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Credits</p>
                    <p className="text-sm font-medium">
                      {formatCreditDisplay(getUserCredits(user))}
                      <span className="text-xs text-gray-500 ml-1">({Math.round(calculateCreditUsage(getUserCredits(user)))}% used)</span>
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div 
                        className={`${getCreditColorClass(calculateCreditUsage(getUserCredits(user)))} h-2.5 rounded-full`}
                        style={{ width: `${calculateCreditUsage(getUserCredits(user))}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Total: </span>
                        <span className="font-medium">{user.credits?.totalPurchased || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Used: </span>
                        <span className="font-medium">{user.credits?.totalUsed || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Balance: </span>
                        <span className="font-medium">{user.credits?.balance || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Terms Accepted</p>
                    <p className="text-sm font-medium">
                      {user.termsAccepted ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email Address</p>
                    <p className="text-sm font-medium">{user.email || 'No email available'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Last Login</p>
                    <p className="text-sm font-medium">
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
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-500">Plan & Credits</h4>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {editMode ? 'Cancel' : 'Edit Credits'}
                </button>
              </div>
              
              {/* Plan Information */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Current Plan:</span>
                  <span className="text-sm font-bold">{user.plan || 'Free'}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Plan Price:</span>
                  <span className="text-sm">₹{user.planPrice || getPlanPrice(user.plan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Plan Credits:</span>
                  <span className="text-sm">{user.credits?.balance || getCreditsByPlan(user.plan)}</span>
                </div>
              </div>
              
              {editMode ? (
                <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Total Purchased Credits</label>
                      <input
                        type="number"
                        name="totalPurchased"
                        value={formData.credits.totalPurchased}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Used Credits</label>
                      <input
                        type="number"
                        name="totalUsed"
                        value={formData.credits.totalUsed}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Balance (Auto-calculated)</label>
                      <input
                        type="number"
                        name="balance"
                        value={Math.max(0, formData.credits.totalPurchased - formData.credits.totalUsed)}
                        disabled
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Images Generated</label>
                      <input
                        type="number"
                        name="imagesGenerated"
                        value={formData.credits.imagesGenerated}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1">Set Credits Based on Plan</label>
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
                        className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-xs hover:bg-gray-300"
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
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-xs hover:bg-blue-200"
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
                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-md text-xs hover:bg-purple-200"
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
                        className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md text-xs hover:bg-indigo-200"
                      >
                        Enterprise (200)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            credits: { ...formData.credits, total: 200 }
                          });
                        }}
                        className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-xs hover:bg-gray-300"
                      >
                        Pro (200)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            credits: { ...formData.credits, total: 1000 }
                          });
                        }}
                        className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-xs hover:bg-gray-300"
                      >
                        Enterprise (1000)
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Total Purchased Credits</p>
                  <p className="text-sm font-medium">{user.credits?.totalPurchased || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Used Credits</p>
                  <p className="text-sm font-medium">{user.credits?.totalUsed || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Available Credits</p>
                  <p className="text-sm font-medium">
                    {user.credits?.balance || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Images Generated</p>
                  <p className="text-sm font-medium">{user.credits?.imagesGenerated || 0}</p>
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