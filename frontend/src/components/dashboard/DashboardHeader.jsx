import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getUserData } from '../../lib/cookieUtils';

const DashboardHeader = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const mobileDropdownRef = useRef(null);
  const desktopDropdownRef = useRef(null);
  
  useEffect(() => {
    // Get user data from both cookie and localStorage
    const getUserDataFromAll = () => {
      // First try to get from cookie
      let userData = getUserData();
      
      // If not in cookie, try localStorage
      if (!userData) {
        try {
          const localUserData = localStorage.getItem('user_data');
          if (localUserData) {
            userData = JSON.parse(localUserData);
            console.log('Got user data from localStorage');
          }
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
        }
      }
      
      return userData;
    };
    
    const userData = getUserDataFromAll();
    if (userData) {
      setUser(userData);
      console.log('Initial user data set in header:', userData);
    }
    
    // Add event listener for storage events to update user data in real-time
    const handleStorageChange = () => {
      const updatedUserData = getUserDataFromAll();
      if (updatedUserData) {
        console.log('Storage changed, updating user data in header:', updatedUserData);
        setUser(updatedUserData);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isMobileDropdownClick = mobileDropdownRef.current && mobileDropdownRef.current.contains(event.target);
      const isDesktopDropdownClick = desktopDropdownRef.current && desktopDropdownRef.current.contains(event.target);
      
      if (!isMobileDropdownClick && !isDesktopDropdownClick) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside); // Add touch support for mobile
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30 shadow-sm w-full">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 relative">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 w-full">
          {/* Logo/Title */}
          <div className='flex items-center flex-shrink-0'>
            <div className='text-xl sm:text-2xl font-bold text-coffee'>
              Dashboard
            </div>
            {user && user.credits && (
              <div className='ml-4 px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700 flex items-center'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {user.credits.balance} {user.credits.balance === 1 ? 'Credit' : 'Credits'}
              </div>
            )}
          </div>

          {/* Mobile menu and profile buttons */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Profile Button */}
             <div className="relative" ref={mobileDropdownRef}>
              <button 
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsMobileMenuOpen(false); // Close mobile menu when opening profile dropdown
                }}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5 transition-all duration-200 origin-top-right">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    Your Profile
                  </Link>
                  <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    Settings
                  </Link>
                  <Link href="/logout" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    Sign out
                  </Link>
                </div>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsDropdownOpen(false); // Close profile dropdown when opening mobile menu
              }}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
            <div className="relative">
              <button 
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsMobileMenuOpen(false); // Close mobile menu when opening profile dropdown
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5 transition-all duration-200 origin-top-right">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    Your Profile
                  </Link>
                  <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    Settings
                  </Link>
                  <Link href="/logout" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    Sign out
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-60 opacity-100 py-2 border-t border-gray-200' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col space-y-2 pb-3">
            <Link href="/profile" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
              Your Profile
            </Link>
            <Link href="/settings" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
              Settings
            </Link>
            <Link href="/logout" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
              Sign out
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;