'use client';

import React, { useState } from 'react';
import { TermsAndConditons } from '@/data/termscondiiton';

const TermsConditionsModal = ({ isOpen, onClose, onAccept, onDecline }) => {
  const [isAccepted, setIsAccepted] = useState(false);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (isAccepted) {
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--coffee)]">{TermsAndConditons[0].title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          <p className="mb-4">{TermsAndConditons[0].intro}</p>
          
          {TermsAndConditons[0].sections.map((section) => (
            <div key={section.id} className="mb-4">
              <h3 className="font-semibold text-lg mb-1">{section.heading}</h3>
              <p>{section.content}</p>
            </div>
          ))}
          
          <p className="mt-6 text-sm text-gray-600">{TermsAndConditons[0].contact}</p>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <input
              type="checkbox"
              id="accept-terms"
              className="mr-2 h-4 w-4 accent-[var(--coffee)]"
              checked={isAccepted}
              onChange={() => setIsAccepted(!isAccepted)}
            />
            <label htmlFor="accept-terms" className="text-sm">
              I have read and agree to the Terms and Conditions
            </label>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onDecline}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={!isAccepted}
              className={`px-4 py-2 rounded-md text-white ${
                isAccepted 
                  ? 'bg-[var(--coffee)] hover:bg-[#5a4232]' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditionsModal;