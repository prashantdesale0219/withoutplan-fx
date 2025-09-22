'use client';

import React, { useState, useEffect } from 'react';
import PricingCard from './pricingCard';
import { motion } from 'framer-motion';
// Fallback pricing data in case API fails
const pricingData = {
  title: { main: "Choose Your", highlight: "Perfect Plan" },
  subtitle: "Select the perfect plan for your needs. Upgrade or downgrade at any time.",
  plans: []
};
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { isAuthenticated, getUserData } from '@/lib/cookieUtils';
import { loadRazorpayScript, createOrder, savePayment, openRazorpayCheckout } from '@/utils/razorpayUtils';
import { useCredits } from '../../contexts/CreditContext';
import TermsConditionsModal from '../common/TermsConditionsModal';

const PricingContent = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const { credits, loading: creditsLoading, refreshCredits } = useCredits();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingPlanData, setPendingPlanData] = useState(null);
  
  useEffect(() => {
    // Fetch available plans
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        const response = await api.get('/api/plans');
        if (response.data.success) {
          setPlans(response.data.plans || response.data.data?.plans || []);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('Failed to load pricing plans');
      } finally {
        setPlansLoading(false);
      }
    };
    
    fetchPlans();
    
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
      router.push('/login');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get the selected plan details
      const selectedPlanData = plans.find(plan => plan.id === planId);
      if (!selectedPlanData) {
        throw new Error('Invalid plan selected');
      }
      
      // Free plan doesn't need payment processing
      if (selectedPlanData.price === 0) {
        // Show terms and conditions modal even for free plan
        setPendingPlanData({
          planId,
          selectedPlanData,
          isFree: true
        });
        setShowTermsModal(true);
        setLoading(false);
        return;
      }
      
      // For paid plans, show terms and conditions first
      setPendingPlanData({
        planId,
        selectedPlanData,
        isFree: false
      });
      setShowTermsModal(true);
      setLoading(false);
      
    } catch (error) {
      console.error('Error processing plan selection:', error);
      toast.error(error.message || 'Failed to select plan');
      setLoading(false);
    }
  };
  
  // Handle terms acceptance and continue with payment
  const handleTermsAccept = async () => {
    if (!pendingPlanData) return;
    
    setLoading(true);
    setShowTermsModal(false);
    
    try {
      const { planId, selectedPlanData, isFree } = pendingPlanData;
      
      // For free plan
      if (isFree) {
        toast.info('Activating free plan, please wait...');
        
        // Save terms acceptance along with plan selection
        const response = await api.post('/api/plans/select', { 
          plan: planId,
          termsAccepted: true
        });
        
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
        return;
      }
      
      // For paid plans, process payment with Razorpay
      toast.info('Preparing payment gateway...');
      
      // Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Failed to load Razorpay checkout script');
      }
      
      // Create Razorpay order with terms acceptance flag
      const orderData = await createOrder(selectedPlanData.name, selectedPlanData.price, true);
      
      if (!orderData || !orderData.data || !orderData.data.order || !orderData.data.key) {
        throw new Error('Failed to create order: Invalid response from server');
      }
      
      const userData = getUserData();
      
      // Configure Razorpay options
      const options = {
        key: orderData.data.key,
        amount: orderData.data.order.amount,
        currency: orderData.data.order.currency,
        name: 'FashionX',
        description: `${selectedPlanData.name} Plan Subscription`,
        order_id: orderData.data.order.id,
        prefill: {
          name: userData?.name || '',
          email: userData?.email || '',
        },
        theme: {
          color: '#6B4F3F', // Coffee color
        },
        handler: async function(response) {
          try {
            // Save payment details with terms acceptance flag
            const paymentDetails = {
              userId: userData.id,
              planName: selectedPlanData.name,
              amount: selectedPlanData.price,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              status: 'success',
              termsAccepted: true
            };
            
            await savePayment(paymentDetails);
            
            toast.success(`${selectedPlanData.name} plan activated successfully!`);
            
            // Update user data in local storage
            if (userData) {
              userData.plan = planId;
              userData.credits = selectedPlanData.credits;
              localStorage.setItem('user_data', JSON.stringify(userData));
              // Dispatch event to notify other components
              window.dispatchEvent(new Event('userDataChanged'));
            }
            
            router.push('/dashboard');
          } catch (error) {
            console.error('Error processing payment:', error);
            toast.error('Payment was successful, but there was an error activating your plan. Please contact support.');
          }
        }
      };
      
      // Open Razorpay checkout
      await openRazorpayCheckout(options);
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle terms decline
  const handleTermsDecline = () => {
    setShowTermsModal(false);
    setPendingPlanData(null);
    toast.info('You must accept the Terms & Conditions to continue');
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl"><br /><br />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Choose Your <span className="italic">Perfect Plan</span>
        </h1>
        <p className="text-lg mb-8">Select the perfect plan for your needs. Upgrade or downgrade at any time.</p>
        
        {user && user.plan && (
          <div className="bg-[#f9f7f5] border border-[var(--almond)] text-[var(--coffee)] p-4 rounded-lg mb-8 max-w-xl mx-auto">
            <p className="font-medium text-lg">Current Plan: <span className="font-bold capitalize">{user.plan}</span></p>
            <p className="mb-2">You have access to our platform features based on your current plan.</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-[var(--coffee)] h-full rounded-full" 
                  style={{ width: `${Math.min(100, (!creditsLoading && credits !== null ? (credits / (credits + (user?.imagesGenerated || 1))) * 100 : 0))}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{!creditsLoading && credits !== null ? credits : 0} credits left</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Pricing Cards */}
      {plansLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--coffee)]"></div>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No pricing plans available at the moment. Please check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4 sm:px-6 lg:px-0">
          {plans.map((plan, index) => {
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
      )}
      
      {/* Terms & Conditions Modal */}
      <TermsConditionsModal 
        isOpen={showTermsModal}
        onClose={() => {
          setShowTermsModal(false);
          setPendingPlanData(null);
        }}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
      />
    </div>
  );
};

export default PricingContent;