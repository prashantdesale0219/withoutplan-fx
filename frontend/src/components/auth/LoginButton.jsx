'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-toastify';
import { User, LogOut, ChevronDown } from 'lucide-react';
import LoginModal from './login';
import { getAuthToken, getUserData, clearAuthCookies } from '../../lib/cookieUtils';

const LoginButton = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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
              
            } catch (error) {
              console.error('Error parsing user data:', error);
              setIsLoggedIn(false);
            }
          } else {
            setIsLoggedIn(false);
            
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

  // Effect for handling scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (pathname === '/' || pathname.includes('/faq')) {
        // Only change background on scroll for home and FAQ pages
        setIsScrolled(window.scrollY > 50);
      } else {
        // For all other pages, always consider as scrolled
        setIsScrolled(true);
      }
    };

    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

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

  // Determine button color based on scroll state and pathname
  const getButtonColor = () => {
    const isHomeOrFaq = pathname === '/' || pathname.includes('/faq');
    
    if (isLoggedIn && user) {
      // For logged in users, always use coffee background
      return 'bg-coffee hover:bg-coffee-dark';
    } else {
      // For sign in button
      if (isHomeOrFaq && !isScrolled) {
        // On home/FAQ pages when not scrolled - white text
        return 'text-white hover:text-white/80';
      } else {
        // On other pages or when scrolled - coffee text
        return 'text-coffee hover:text-coffee/80';
      }
    }
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
        className={`px-6 py-2 rounded-full transition-colors ${getButtonColor()}`}
      >
        Sign In
      </button>
      <LoginModal isOpen={isModalOpen} onClose={closeModal} initialMode="login" />
    </>
  );
};

export default LoginButton;
