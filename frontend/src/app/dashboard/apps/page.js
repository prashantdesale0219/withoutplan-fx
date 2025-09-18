'use client';
  import React from 'react';
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
        { name: "Sari", icon: "👘", gradient: "from-pink-400 to-rose-500" },
        { name: "Lehenga", icon: "👗", gradient: "from-purple-400 to-pink-500" },
        { name: "Kurta Set", icon: "🥻", gradient: "from-orange-400 to-red-500" },
        { name: "Western Dress", icon: "👗", gradient: "from-blue-400 to-purple-500" },
        { name: "Top", icon: "👚", gradient: "from-green-400 to-blue-500" },
        { name: "Jeans", icon: "👖", gradient: "from-indigo-400 to-blue-500" },
        { name: "Mens Shirt", icon: "👔", gradient: "from-gray-400 to-gray-600" },
        { name: "Kids Wear", icon: "👶", gradient: "from-yellow-400 to-orange-500" },
        { name: "Lingerie", icon: "🩱", gradient: "from-pink-400 to-red-500" },
        { name: "Swimwear", icon: "🩱", gradient: "from-cyan-400 to-blue-500" }
      ]
    },
    {
      title: "Scene / Location / Ambience",
      description: "Setting and environment",
      items: [
        { name: "Taj-inspired Palatial", icon: "🏛️", gradient: "from-amber-400 to-orange-500" },
        { name: "Luxury Hotel Suite", icon: "🏨", gradient: "from-purple-400 to-pink-500" },
        { name: "Urban Street", icon: "🏙️", gradient: "from-blue-400 to-cyan-500" },
        { name: "Cafe", icon: "☕", gradient: "from-brown-400 to-amber-500" },
        { name: "Beach", icon: "🏖️", gradient: "from-teal-400 to-blue-500" },
        { name: "Rooftop Sunset", icon: "🌅", gradient: "from-orange-400 to-red-500" },
        { name: "Studio White", icon: "📸", gradient: "from-gray-300 to-gray-500" },
        { name: "Minimal Editorial", icon: "📖", gradient: "from-slate-400 to-gray-500" },
        { name: "Runway", icon: "🚶", gradient: "from-black to-gray-700" },
        { name: "Home Lifestyle", icon: "🏠", gradient: "from-green-400 to-emerald-500" }
      ]
    },
    {
      title: "Shot Style / Use Case",
      description: "Photography style and purpose",
      items: [
        { name: "Hero Banner", icon: "🎯", gradient: "from-red-400 to-pink-500" },
        { name: "Lookbook Full-body", icon: "👤", gradient: "from-purple-400 to-indigo-500" },
        { name: "3/4 Crop", icon: "✂️", gradient: "from-blue-400 to-cyan-500" },
        { name: "Flatlay", icon: "📐", gradient: "from-green-400 to-teal-500" },
        { name: "Close-up Fabric Detail", icon: "🔍", gradient: "from-yellow-400 to-orange-500" },
        { name: "Mannequin/Catalog", icon: "🏷️", gradient: "from-gray-400 to-slate-500" },
        { name: "360° Turntable Set", icon: "🔄", gradient: "from-cyan-400 to-blue-500" },
        { name: "Thumbnail", icon: "🖼️", gradient: "from-pink-400 to-rose-500" }
      ]
    },
    {
      title: "Mood / Genre / Finishes",
      description: "Visual style and aesthetic",
      items: [
        { name: "Cinematic", icon: "🎬", gradient: "from-black to-gray-800" },
        { name: "High-fashion Editorial", icon: "✨", gradient: "from-purple-400 to-pink-500" },
        { name: "Clean Ecommerce", icon: "🛒", gradient: "from-blue-400 to-cyan-500" },
        { name: "Vintage Film", icon: "📷", gradient: "from-amber-400 to-orange-500" },
        { name: "Vivid Commercial", icon: "🌈", gradient: "from-red-400 to-pink-500" },
        { name: "Matte Editorial", icon: "📰", gradient: "from-gray-400 to-slate-500" },
        { name: "High-gloss Retouch", icon: "💎", gradient: "from-cyan-400 to-blue-500" }
      ]
    },
    {
      title: "Target Channel Presets",
      description: "Platform-specific optimization",
      items: [
        { name: "Amazon/Flipkart Listing", icon: "📦", gradient: "from-orange-400 to-red-500" },
        { name: "Shopify PDP", icon: "🛍️", gradient: "from-green-400 to-emerald-500" },
        { name: "Instagram Feed", icon: "📱", gradient: "from-pink-400 to-purple-500" },
        { name: "Instagram Reels Cover", icon: "🎥", gradient: "from-purple-400 to-indigo-500" },
        { name: "Facebook Ad", icon: "📢", gradient: "from-blue-400 to-cyan-500" },
        { name: "Print Catalogue", icon: "📖", gradient: "from-gray-400 to-slate-500" }
      ]
    }
  ];
  
  const handleCardClick = (categoryTitle, item) => {
    // Navigate to image editor with category and item info
    const params = new URLSearchParams({
      category: categoryTitle.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      item: item.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
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
                    className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:ring-2 hover:ring-gray-400 h-64"
                    onClick={() => handleCardClick(category.title, item)}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative h-full overflow-hidden">
                      {/* Thumbnail with gradient background and icon */}
                       <div className={`w-full h-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white relative`}>
                         {/* Background pattern */}
                         <div className="absolute inset-0 opacity-20">
                           <div className="w-full h-full" style={{
                             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                             backgroundSize: '30px 30px'
                           }} />
                         </div>
                         
                         {/* Main icon */}
                         <div className="text-8xl drop-shadow-lg">
                           {item.icon}
                         </div>
                         
                         {/* Category label */}
                         <div className="absolute bottom-4 left-4 right-4">
                           <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
                             <h4 className="text-white font-semibold text-sm truncate">{item.name}</h4>
                           </div>
                         </div>
                       </div>
                      
                      {/* Icon Overlay */}
                      <div className="absolute top-3 left-3">
                        <div className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <div className="text-white text-sm">{item.icon}</div>
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