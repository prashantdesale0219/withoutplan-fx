'use client';
import React from 'react';
import Image from 'next/image';
import DashboardErrorBoundary from '@/components/dashboard/DashboardErrorBoundary';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

const AppsContent = () => {
  const router = useRouter();
  
  const categories = [
    {
      title: "Product Type",
      description: "What the outfit is",
      items: [
        { name: "Sari", image: "/assets/images/sunset-beach.jpg" },
        { name: "Lehenga", image: "/assets/images/sunset-beach.jpg" },
        { name: "Kurta Set", image: "/assets/images/sunset-beach.jpg" },
        { name: "Western Dress", image: "/assets/images/sunset-beach.jpg" },
        { name: "Top", image: "/assets/images/sunset-beach.jpg" },
        { name: "Jeans", image: "/assets/images/sunset-beach.jpg" },
        { name: "Mens Shirt", image: "/assets/images/sunset-beach.jpg" },
        { name: "Kids Wear", image: "/assets/images/sunset-beach.jpg" },
        { name: "Lingerie", image: "/assets/images/sunset-beach.jpg" },
        { name: "Swimwear", image: "/assets/images/sunset-beach.jpg" }
      ]
    },
    {
      title: "Scene / Location / Ambience",
      description: "Setting and environment",
      items: [
        { name: "Taj-inspired Palatial", image: "/assets/images/sunset-beach.jpg" },
        { name: "Luxury Hotel Suite", image: "/assets/images/sunset-beach.jpg" },
        { name: "Urban Street", image: "/assets/images/sunset-beach.jpg" },
        { name: "Cafe", image: "/assets/images/sunset-beach.jpg" },
        { name: "Beach", image: "/assets/images/sunset-beach.jpg" },
        { name: "Rooftop Sunset", image: "/assets/images/sunset-beach.jpg" },
        { name: "Studio White", image: "/assets/images/sunset-beach.jpg" },
        { name: "Minimal Editorial", image: "/assets/images/sunset-beach.jpg" },
        { name: "Runway", image: "/assets/images/sunset-beach.jpg" },
        { name: "Home Lifestyle", image: "/assets/images/sunset-beach.jpg" }
      ]
    },
    {
      title: "Shot Style / Use Case",
      description: "Photography style and purpose",
      items: [
        { name: "Hero Banner", image: "/assets/images/sunset-beach.jpg" },
        { name: "Lookbook Full-body", image: "/assets/images/sunset-beach.jpg" },
        { name: "3/4 Crop", image: "/assets/images/sunset-beach.jpg" },
        { name: "Flatlay", image: "/assets/images/sunset-beach.jpg" },
        { name: "Close-up Fabric Detail", image: "/assets/images/sunset-beach.jpg" },
        { name: "Mannequin/Catalog", image: "/assets/images/sunset-beach.jpg" },
        { name: "360° Turntable Set", image: "/assets/images/sunset-beach.jpg" },
        { name: "Thumbnail", image: "/assets/images/sunset-beach.jpg" }
      ]
    },
    {
      title: "Mood / Genre / Finishes",
      description: "Visual style and aesthetic",
      items: [
        { name: "Cinematic", image: "/assets/images/sunset-beach.jpg" },
        { name: "High-fashion Editorial", image: "/assets/images/sunset-beach.jpg" },
        { name: "Clean Ecommerce", image: "/assets/images/sunset-beach.jpg" },
        { name: "Vintage Film", image: "/assets/images/sunset-beach.jpg" },
        { name: "Vivid Commercial", image: "/assets/images/sunset-beach.jpg" },
        { name: "Matte Editorial", image: "/assets/images/sunset-beach.jpg" },
        { name: "High-gloss Retouch", image: "/assets/images/sunset-beach.jpg" }
      ]
    },
    {
      title: "Target Channel Presets",
      description: "Platform-specific optimization",
      items: [
        { name: "Amazon/Flipkart Listing", image: "/assets/images/sunset-beach.jpg" },
        { name: "Shopify PDP", image: "/assets/images/sunset-beach.jpg" },
        { name: "Instagram Feed", image: "/assets/images/sunset-beach.jpg" },
        { name: "Instagram Reels Cover", image: "/assets/images/sunset-beach.jpg" },
        { name: "Facebook Ad", image: "/assets/images/sunset-beach.jpg" },
        { name: "Print Catalogue", image: "/assets/images/sunset-beach.jpg" }
      ]
    }
  ];
  
  const handleCardClick = (categoryTitle, item) => {
    // Format category and item for proper webhook mapping
    let category = '';
    
    // Map category titles to their corresponding webhook category prefixes
    if (categoryTitle === "Product Type") {
      category = 'product-type';
    } else if (categoryTitle === "Scene / Location / Ambience") {
      category = 'scene-loc';
    } else if (categoryTitle === "Shot Style / Use Case") {
      category = 'shot-style';
    } else if (categoryTitle === "Mood / Genre / Finishes") {
      category = 'mood-genre';
    } else if (categoryTitle === "Target Channel Presets") {
      category = 'target-channel';
    } else {
      // Default fallback
      category = categoryTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
    
    // Format item name for webhook mapping
    const itemSlug = item.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Navigate to image editor with category and item info
    const params = new URLSearchParams({
      category: category,
      item: itemSlug,
      type: 'category'
    });
    router.push(`/dashboard/image-editor?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              AI Photo Apps
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Choose from our specialized AI workflows organized by categories. Each option is optimized for specific use cases and styles.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto space-y-12">
        {categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{category.title}</h2>
              <p className="text-gray-600">{category.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {category.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:ring-2 hover:ring-gray-400 h-80"
                    onClick={() => handleCardClick(category.title, item)}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative h-full overflow-hidden">
                      {/* Dynamic sunset beach background image */}
                       <div className="w-full h-full relative">
                         {/* Background image with Next.js Image component */}
                          <Image 
                            src={item.image || "/assets/images/sunset-beach.jpg"} 
                            alt={`${item.name} - ${category.title}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            priority={categoryIndex === 0 && itemIndex < 4}
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                          />
                         
                         {/* Dark overlay for better text readability */}
                         <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />
                         
                         {/* Category label */}
                         <div className="absolute bottom-4 left-4 right-4">
                           <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 group-hover:bg-black/70 transition-colors duration-300">
                             <h4 className="text-white font-semibold text-sm truncate">{item.name}</h4>
                             <p className="text-white/80 text-xs mt-1 truncate">{category.title}</p>
                           </div>
                         </div>
                       </div>

                      
                      {/* Generate Button */}
                      <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button className="w-full bg-black/80 backdrop-blur-sm text-white text-sm font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 border border-white/20 hover:bg-black/90 transition-colors">
                          <Sparkles className="w-4 h-4" />
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA Section */}
      <div className="max-w-4xl mx-auto mt-16 text-center">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Photos?</h2>
          <p className="text-lg mb-6 opacity-90">
            Choose any style above and upload your image to see the magic happen!
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm opacity-75">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2" />
              <span>AI-Powered Editing</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2" />
              <span>Instant Results</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2" />
              <span>High Quality Output</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap the apps content with error boundary
const Apps = () => {
  return (
    <DashboardErrorBoundary>
      <AppsContent />
    </DashboardErrorBoundary>
  );
};

export default Apps;