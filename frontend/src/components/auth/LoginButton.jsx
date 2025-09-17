'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { User, LogOut, ChevronDown } from 'lucide-react';
import LoginModal from './login';
import { getAuthToken, getUserData, clearAuthCookies } from '../../lib/cookieUtils';

const   LoginButton = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check auth status on mount and when storage changes
    const checkAuth = () => {
      // Add a small delay to ensure cookies are properly set
      setTimeout(() => {
        try {
          const token = getAuthToken();
          const userData = getUserData();
          
          if (token && userData) {
            try {
              setUser(userData);
              setIsLoggedIn(true);
              console.log('User is logged in - LoginButton component');
            } catch (error) {
              console.error('Error parsing user data:', error);
              setIsLoggedIn(false);
            }
          } else {
            setIsLoggedIn(false);
            console.log('User is not logged in - LoginButton component');
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          setIsLoggedIn(false);
        }
      }, 1200); // Increased delay to match login timing and ensure cookies are available
    };
    
    checkAuth();
    
    // Listen for login status changes
    window.addEventListener('loginStatusChanged', checkAuth);
    
    // Also check on page focus, as cookies might have changed in another tab
    window.addEventListener('focus', checkAuth);
    
    return () => {
      window.removeEventListener('loginStatusChanged', checkAuth);
      window.removeEventListener('focus', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    clearAuthCookies();
    setIsLoggedIn(false);
    setUser(null);
    setShowDropdown(false);
    // Dispatch custom event for navbar to detect login status change
    window.dispatchEvent(new Event('loginStatusChanged'));
    toast.success('Logged out successfully!');
    router.push('/');
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (isLoggedIn && user) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 text-white px-4 py-2 rounded-full transition-colors bg-coffee hover:bg-coffee-dark"
        >
          <User className="w-4 h-4" />
          <span>{user.firstName}</span>
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${
              showDropdown ? 'transform rotate-180' : ''
            }`} 
          />
        </button>
        
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="py-2">
              <Link
                href="/dashboard"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setShowDropdown(false)}
              >
                <User className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={openModal}
        className="text-white px-6 py-2 rounded-full transition-colors"
      >
        Sign In
      </button>
      <LoginModal isOpen={isModalOpen} onClose={closeModal} initialMode="login" />
    </>
  );
};

export default LoginButton;