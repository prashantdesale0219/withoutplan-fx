'use client';
import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

const RefreshImagesSection = ({ content }) => {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if device is mobile or tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint is 1024px
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Register ScrollTrigger plugin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }
  }, []);
  
  // Use the content passed from parent component
  const imageData = content || [];
  
  // Setup GSAP ScrollTrigger for content change - only on desktop
  useEffect(() => {
    if (!sectionRef.current || !containerRef.current || !imageData.length || isMobile) return;
    
    // Clear any existing ScrollTriggers to prevent duplicates
    ScrollTrigger.getAll().forEach(st => st.kill());
    
    const totalPanels = imageData.length;
    
    // Create the ScrollTrigger - only for desktop
    const scrollTrigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5, // Increased for smoother scrubbing
      pin: containerRef.current,
      anticipatePin: 1,
      markers: false,
      onUpdate: (self) => {
        // Calculate which panel should be active based on scroll progress
        const newIndex = Math.min(
          totalPanels - 1,
          Math.floor(self.progress * totalPanels)
        );
        
        if (newIndex !== activeIndex) {
          setActiveIndex(newIndex);
          
          // Create a timeline for smoother transitions
          const tl = gsap.timeline();
          tl.to('.image-container', {
            opacity: 0.5,
            scale: 0.95,
            duration: 0.5, // Increased duration
            ease: 'power3.out' // Changed ease function for smoother animation
          }).to('.image-container', {
            opacity: 1,
            scale: 1,
            duration: 0.7, // Increased duration
            ease: 'power2.inOut' // Changed ease function
          });
        }
      }
    });
    
    return () => {
      // Clean up ScrollTrigger
      scrollTrigger.kill();
    };
  }, [activeIndex, imageData.length, isMobile]);
  
  // If no content is provided, return null
  if (!imageData || !imageData.length) {
    return null;
  }
  
  // Set section height based on number of panels - only for desktop
  const sectionHeight = isMobile ? 'auto' : `${imageData.length * 100}vh`;
  
  // For mobile/tablet view, render all cards stacked
  if (isMobile) {
    return (
      <section 
        ref={sectionRef}
        className="w-full bg-white overflow-hidden py-12 sm:py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {imageData.map((item, index) => (
            <div key={`mobile-card-${index}`} className="mb-16 sm:mb-24">
              <div className="flex flex-col items-center justify-center gap-8 sm:gap-12">
                {/* Image container */}
                <div className="w-full relative h-[350px] sm:h-[400px] flex items-center justify-center">
                  <div className="relative w-[300px] sm:w-[350px] h-full flex items-center justify-center">
                    <div className="image-container bg-white p-3 sm:p-4 rounded-xl shadow-2xl w-full">
                      <div className="aspect-square overflow-hidden rounded-lg">
                        {item?.mainImage ? (
                          <Image 
                            src={item.mainImage} 
                            alt={`${item?.title || 'Fashion model'}`}
                            width={600} 
                            height={600}
                            className="w-full h-full object-cover"
                            priority={index === 0}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Text content */}
                <div className="w-full text-center">
                  <h2 className="text-3xl sm:text-4xl font-medium text-gray-900 mb-6 sm:mb-8 leading-tight">
                    {item?.title || ''}
                  </h2>
                  <p className="text-lg sm:text-lg text-gray-600 mb-8 sm:mb-10 max-w-lg mx-auto">
                    {item?.description || ''}
                  </p>
                  <div>
                    <Link href="/try-now">
                      <button className="w-full sm:w-auto bg-black text-white px-8 sm:px-10 py-3 sm:py-4 rounded-md font-medium transition-all hover:scale-105 hover:bg-coffee text-base sm:text-lg shadow-md">
                        Try it now
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  
  // Desktop view with scroll animation
  return (
    <section 
      ref={sectionRef}
      className="w-full bg-white overflow-hidden"
      style={{ height: sectionHeight }} // Height for scrolling through all panels
    >
      <div ref={containerRef} className="sticky top-0 h-screen flex items-center justify-center py-12 sm:py-16 md:py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="relative h-screen flex flex-col items-center justify-center w-full">
            {/* Main content container - flex row on desktop */}
            <div className="w-full flex flex-row items-center justify-between gap-16 z-10 px-4 md:px-8 lg:px-12">
              {/* Image container - now at the top for mobile */}
              <div className="w-full md:w-1/2 relative h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px] flex items-center justify-center mb-8 md:mb-0">
                {/* Image container with actual content */}
                <div className="relative w-[300px] sm:w-[350px] md:w-[400px] lg:w-[450px] h-full flex items-center justify-center">
                  <AnimatePresence mode="sync">
                    <motion.div 
                      key={`main-${activeIndex}`}
                      className="w-full"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ 
                        duration: 0.8, 
                        ease: [0.25, 0.1, 0.25, 1.0],
                        delay: 0.1 
                      }}
                    >
                      <div className="image-container bg-white p-3 sm:p-4 rounded-xl shadow-2xl">
                        <div className="aspect-square overflow-hidden rounded-lg">
                          {imageData[activeIndex]?.mainImage ? (
                            <Image 
                              src={imageData[activeIndex].mainImage} 
                              alt={`${imageData[activeIndex]?.title || 'Fashion model'}`}
                              width={600} 
                              height={600}
                              className="w-full h-full object-cover"
                              priority
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400">No image</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Text content - now below image on mobile */}
              <div className="w-full md:w-1/2 text-center md:text-left">
                <AnimatePresence mode="sync">
                  <motion.div
                    key={`text-${activeIndex}`}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -30, opacity: 0 }}
                    transition={{ 
                      duration: 0.7, 
                      ease: "easeInOut", 
                      staggerChildren: 0.1 
                    }}
                    className="relative"
                  >
                    <motion.h2 
                      className="text-3xl sm:text-4xl md:text-5xl font-medium text-gray-900 mb-6 sm:mb-8 leading-tight"
                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                    >
                      {imageData[activeIndex]?.title || ''}
                    </motion.h2>
                    <motion.p 
                      className="text-lg sm:text-lg text-gray-600 mb-8 sm:mb-10 max-w-lg mx-auto md:mx-0"
                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                    >
                      {imageData[activeIndex]?.description || ''}
                    </motion.p>
                    <motion.div>
                      <Link href="/try-now">
                        <button className="w-full sm:w-auto bg-black text-white px-8 sm:px-10 py-3 sm:py-4 rounded-md font-medium  transition-all hover:scale-105 hover:bg-coffee text-base sm:text-lg shadow-md">
                          Try it now
                        </button>
                      </Link>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RefreshImagesSection;