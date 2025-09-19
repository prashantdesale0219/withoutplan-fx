import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserData, getAuthToken, setUserData } from '../lib/cookieUtils';

const CreditContext = createContext();

export const useCredits = () => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredits must be used within a CreditProvider');
  }
  return context;
};

export const CreditProvider = ({ children }) => {
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch credits from user data
  const fetchCredits = async () => {
    try {
      setLoading(true);
      const userData = getUserData();
      
      if (userData && userData.credits !== undefined) {
        // Handle both object and number formats for credits
        let creditsBalance;
        if (typeof userData.credits === 'object' && userData.credits.balance !== undefined) {
          creditsBalance = userData.credits.balance;
        } else if (typeof userData.credits === 'number') {
          creditsBalance = userData.credits;
        } else {
          creditsBalance = 0;
        }
        
        setCredits(creditsBalance);
        setError(null);
      } else {
        // If no local data, fetch from API
        await fetchCreditsFromAPI();
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch credits from API
  const fetchCreditsFromAPI = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setCredits(0);
        return;
      }

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        let creditsBalance;
        
        if (typeof userData.credits === 'object' && userData.credits.balance !== undefined) {
          creditsBalance = userData.credits.balance;
        } else if (typeof userData.credits === 'number') {
          creditsBalance = userData.credits;
        } else {
          creditsBalance = 0;
        }
        
        setCredits(creditsBalance);
        
        // Update user data in cookies with fresh data
        setUserData(userData);
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (err) {
      console.error('Error fetching credits from API:', err);
      setError(err.message);
    }
  };

  // Function to update credits after usage
  const updateCredits = (newCredits) => {
    setCredits(newCredits);
    
    // Update user data in cookies
    const userData = getUserData();
    if (userData) {
      if (typeof userData.credits === 'object') {
        userData.credits.balance = newCredits;
      } else {
        userData.credits = newCredits;
      }
      setUserData(userData);
    }
  };

  // Function to deduct credits
  const deductCredits = (amount = 1) => {
    const newCredits = Math.max(0, credits - amount);
    updateCredits(newCredits);
    return newCredits;
  };

  // Function to add credits
  const addCredits = (amount) => {
    const newCredits = credits + amount;
    updateCredits(newCredits);
    return newCredits;
  };

  // Function to check if user has enough credits
  const hasEnoughCredits = (required = 1) => {
    return credits !== null && credits >= required;
  };

  // Function to get credit warning status
  const shouldShowWarning = (threshold = 3) => {
    return credits !== null && credits <= threshold;
  };

  // Initialize credits on mount
  useEffect(() => {
    fetchCredits();
  }, []);

  // Listen for storage changes (when user data is updated in other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userData') {
        fetchCredits();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    credits,
    loading,
    error,
    fetchCredits,
    fetchCreditsFromAPI,
    updateCredits,
    deductCredits,
    addCredits,
    hasEnoughCredits,
    shouldShowWarning,
    refreshCredits: fetchCreditsFromAPI
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
};

export default CreditContext;