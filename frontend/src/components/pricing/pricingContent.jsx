'use client';

import React, { useState, useEffect } from 'react';
import { pricingData } from '../../data/pricing';
import PricingCard from './pricingCard';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { isAuthenticated, getUserData } from '@/lib/cookieUtils';

const PricingContent = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check if user is authenticated
    if (isAuthenticated()) {
      setUser(getUserData());
      
      // Get current plan details from API
      const fetchCurrentPlan = async () => {
        try {
          const response = await api.get('/api/plans/current');
          if (response.data.success) {
            const userData = getUserData();
            if (userData) {
              userData.plan = response.data.data.plan;
              userData.credits = response.data.data.credits;
              userData.imagesGenerated = response.data.data.imagesGenerated;
              localStorage.setItem('user_data', JSON.stringify(userData));
              setUser(userData);
            }
          }
        } catch (error) {
          console.error('Error fetching current plan:', error);
        }
      };
      
      fetchCurrentPlan();
    }
    
    // Check if there's a selected plan in session storage (from login redirect)
    const storedPlan = sessionStorage.getItem('selectedPlan');
    if (storedPlan) {
      setSelectedPlan(storedPlan);
      sessionStorage.removeItem('selectedPlan'); // Clear after setting
    }
  }, []);
  
  const handleSelectPlan = async (planId) => {
    setSelectedPlan(planId);
    
    // Check if user is authenticated
    if (!isAuthenticated()) {
      toast.info('Please login to select a plan');
      // Save the selected plan to session storage so we can auto-select it after login
      sessionStorage.setItem('selectedPlan', planId);
      router.push('/login?redirect=pricing');
      return;
    }
    
    try {
      setLoading(true);
      toast.info('Activating plan, please wait...');
      
      const response = await api.post('/api/plans/select', { plan: planId });
      
      if (response.data.success) {
        toast.success(`${planId.charAt(0).toUpperCase() + planId.slice(1)} plan activated successfully!`);
        // Update user data in local storage
        const userData = getUserData();
        if (userData) {
          userData.plan = planId;
          userData.credits = response.data.data.credits;
          localStorage.setItem('user_data', JSON.stringify(userData));
          // Dispatch event to notify other components
          window.dispatchEvent(new Event('userDataChanged'));
        }
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error(error.response?.data?.error || 'Failed to select plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl"><br /><br />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {pricingData.title.main}{' '}
          <span className="italic">{pricingData.title.highlight}</span>
        </h1>
        <p className="text-lg mb-8">{pricingData.subtitle}</p>
        
        {user && user.plan && (
          <div className="bg-[#f9f7f5] border border-[var(--almond)] text-[var(--coffee)] p-4 rounded-lg mb-8 max-w-xl mx-auto">
            <p className="font-medium text-lg">Current Plan: <span className="font-bold capitalize">{user.plan}</span></p>
            <p className="mb-2">You have access to our platform features based on your current plan.</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-[var(--coffee)] h-full rounded-full" 
                  style={{ width: `${Math.min(100, (((typeof user.credits === 'object' ? user.credits.balance : user.credits) || 0) / (((typeof user.credits === 'object' ? user.credits.balance : user.credits) || 0) + ((typeof user.credits === 'object' ? user.credits.imagesGenerated : user.imagesGenerated) || 1))) * 100)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{typeof user.credits === 'object' ? user.credits.balance : user.credits || 0} credits left</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4 sm:px-6 lg:px-0">
        {pricingData.plans.map((plan, index) => {
          // Check if this is the user's current plan
          const isCurrentPlan = user && user.plan === plan.id;
          
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className={isCurrentPlan ? 'relative' : ''}
            >
              {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[var(--coffee)] text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-[var(--almond)] rounded-full"></span>
                    Current Plan
                  </span>
                </div>
              )}
              <PricingCard 
                plan={plan} 
                onSelect={handleSelectPlan} 
                selectedPlan={selectedPlan} 
                loading={loading} 
                isCurrentPlan={isCurrentPlan}
              />
            </motion.div>
          );
        })}
      </div>

     
    </div>
  );
};

export default PricingContent;