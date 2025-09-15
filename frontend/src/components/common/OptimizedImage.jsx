'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * OptimizedImage component that handles image loading errors gracefully
 * and provides fallback for aborted requests
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setImgSrc(src);
    setLoading(true);
    setError(false);
  }, [src]);

  // Handle image load error
  const handleError = () => {
    setError(true);
    setLoading(false);
    // You can set a placeholder image here
    // setImgSrc('/placeholder.jpg');
  };

  // Handle image load success
  const handleLoad = () => {
    setLoading(false);
  };

  return (
    <div className={`relative ${className || ''}`} style={!fill ? { width, height } : undefined}>
      {loading && (
        <div 
          className="absolute inset-0 bg-gray-100 animate-pulse rounded"
          style={!fill ? { width, height } : undefined}
        />
      )}
      
      {error ? (
        // Fallback for error state
        <div 
          className="absolute inset-0 bg-gray-200 flex items-center justify-center rounded"
          style={!fill ? { width, height } : undefined}
        >
          <span className="text-gray-400 text-sm">{alt || 'Image'}</span>
        </div>
      ) : (
        // Actual image with error handling
        <Image
          src={imgSrc}
          alt={alt || ''}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          fill={fill}
          onError={handleError}
          onLoad={handleLoad}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          unoptimized={true}
          {...props}
        />
      )}
    </div>
  );
}