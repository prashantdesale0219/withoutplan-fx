'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { photoshootCards } from '@/data/photoshootCards';
import { Camera, MapPin, Palette, ArrowRight, Sparkles, Edit3 } from 'lucide-react';

const PhotoshootCards = () => {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleCardClick = (card) => {
    // Store selected card in localStorage for ImageEditor to access
    localStorage.setItem('selectedPhotoshootCard', JSON.stringify(card));
    
    // Navigate to image editor with card context
    router.push(`/dashboard/image-editor?card=${card.id}`);
  };

  return (
    <div>


      {/* Cards Grid */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          {photoshootCards.map((card, index) => {
            // Bento grid layout - same width, different heights only
             const getBentoClass = (index) => {
               const patterns = [
                 'md:col-span-1 md:row-span-2', // Tall
                 'md:col-span-1 md:row-span-1', // Normal
                 'md:col-span-1 md:row-span-2', // Tall
                 'md:col-span-1 md:row-span-1', // Normal
                 'md:col-span-1 md:row-span-1', // Normal
                 'md:col-span-1 md:row-span-2', // Tall
                 'md:col-span-1 md:row-span-1', // Normal
                 'md:col-span-1 md:row-span-2', // Tall
                 'md:col-span-1 md:row-span-1', // Normal
                 'md:col-span-1 md:row-span-2', // Tall
                 'md:col-span-1 md:row-span-1', // Normal
                 'md:col-span-1 md:row-span-1', // Normal
                 'md:col-span-1 md:row-span-2', // Tall
                 'md:col-span-1 md:row-span-1', // Normal
                 'md:col-span-1 md:row-span-2', // Tall
                 'md:col-span-1 md:row-span-1', // Normal
                 'md:col-span-1 md:row-span-1', // Normal
                 'md:col-span-1 md:row-span-2', // Tall
                 'md:col-span-1 md:row-span-1', // Normal
                 'md:col-span-1 md:row-span-1'  // Normal
               ];
               return patterns[index % patterns.length];
             };
            
            return (
              <div
                key={card.id}
                className={`group relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                  hoveredCard === card.id ? 'ring-2 ring-gray-400 ring-opacity-50' : ''
                } ${getBentoClass(index)}`}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardClick(card)}
              >
              {/* Thumbnail Image */}
               <div className="relative h-full overflow-hidden">
                 <img 
                   src={card.thumbnail} 
                   alt={card.title}
                   className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                 />
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent`} />
                
                {/* Icon Overlay */}
                 <div className="absolute top-4 left-4">
                   <div className="w-10 h-10 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-lg font-bold shadow-lg">
                     {card.icon}
                   </div>
                 </div>
                

              </div>
              
              {/* Generate Button Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <button className="w-full bg-black/80 backdrop-blur-sm hover:bg-black/90 text-white text-sm font-bold py-3 px-4 rounded-lg transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center gap-2 shadow-lg border border-white/20">
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </button>
                </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default PhotoshootCards;