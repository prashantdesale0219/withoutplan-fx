'use client';

import React from 'react';
import Image from 'next/image';

/**
 * ProfileAvatar component that displays user profile picture or initials as fallback
 * @param {Object} props - Component props
 * @param {string} props.src - Image source URL
 * @param {string} props.firstName - User's first name
 * @param {string} props.lastName - User's last name
 * @param {string} props.size - Size of avatar (sm, md, lg)
 * @param {string} props.className - Additional CSS classes
 */
const ProfileAvatar = ({ src, firstName, lastName, size = 'md', className = '' }) => {
  // Get initials from name
  const getInitials = () => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    
    // If both names are empty, return 'U' as default
    if (!firstInitial && !lastInitial) {
      return 'U';
    }
    
    return `${firstInitial}${lastInitial}`;
  };

  // Determine size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // If image source is provided and valid, show image
  if (src && src !== 'undefined' && src !== 'null') {
    return (
      <div className={`relative rounded-full overflow-hidden ${sizeClass} ${className}`}>
        <Image
          src={src}
          alt="Profile"
          fill
          className="object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.classList.add('fallback-active');
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-indigo-100 text-indigo-600 font-medium fallback">
          {getInitials()}
        </div>
      </div>
    );
  }

  // Otherwise show initials
  return (
    <div className={`flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-medium ${sizeClass} ${className}`}>
      {getInitials()}
    </div>
  );
};

export default ProfileAvatar;