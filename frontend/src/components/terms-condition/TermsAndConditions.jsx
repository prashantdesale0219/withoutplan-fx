import React from 'react';
import { TermsAndConditons } from '@/data/termscondiiton';

const TermsAndConditions = () => {
  const termsData = TermsAndConditons[0];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="relative overflow-hidden rounded-xl shadow-2xl">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-almond to-coffee p-6 text-white">
          <p className="text-xs opacity-75">Last modified May 01 2023</p>
          <h1 className="text-5xl font-bold mt-1">{termsData.title}</h1>
        </div>
        
        {/* Content Area */}
        <div className="bg-white p-8">
          <div className="mb-8">
            <h2 className="text-4xl font-semibold text-coffee dark:text-vanilla mb-3">Introduction</h2>
            <p className="text-coffee/80 dark:text-vanilla/80">{termsData.intro}</p>
          </div>
          
          <div className="space-y-8">
            {termsData.sections.map((section) => (
              <div key={section.id} className="border-l-4 border-almond pl-6 py-4 bg-vanilla/60 0 rounded-r-lg hover:bg-almond/10 transition-all">
                <h2 className="text-xl font-semibold text-coffee dark:text-vanilla mb-3 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-r from-almond to-coffee text-white flex items-center justify-center mr-3 text-sm font-bold">{section.id}</span>
                  {section.heading}
                </h2>
                <p className="text-coffee/80 dark:text-vanilla/80">{section.content}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-10 pt-6 border-t border-almond/30 text-center">
            <p className="text-coffee/70 dark:text-vanilla/70 font-medium">{termsData.contact}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;