import React from 'react';
import { FaCheck, FaCrown, FaRocket, FaLeaf, FaBuilding, FaCheckCircle } from 'react-icons/fa';
import { Loader } from 'lucide-react';

const PricingCard = ({ plan, onSelect, selectedPlan, loading, isCurrentPlan }) => {
  const { id, name, icon, description, price, credits, features, popular } = plan;
  
  // Map plan icons to actual React components
  const getIcon = () => {
    switch(icon) {
      case 'FaLeaf': return <FaLeaf className="text-green-500" />;
      case 'FaRocket': return <FaRocket className="text-blue-500" />;
      case 'FaCrown': return <FaCrown className="text-yellow-500" />;
      case 'FaBuilding': return <FaBuilding className="text-gray-700" />;
      default: return null;
    }
  };

  return (
    <div className={`flex flex-col ${isCurrentPlan ? 'p-5 sm:p-8 border-2 border-[var(--coffee)] bg-[#f9f7f5] shadow-lg hover:shadow-xl' : popular ? 'p-5 sm:p-8 border-2 border-[var(--almond)] bg-[#f9f7f5] scale-105 md:scale-110 md:h-[105%] shadow-lg hover:shadow-xl' : 'p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md'} rounded-lg relative h-full transition-all duration-300`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[var(--coffee)] text-white text-xs font-semibold px-3 py-1 rounded-full">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-[var(--almond)] rounded-full"></span>
            Most Popular
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-2 flex-wrap sm:flex-nowrap">
        <span className="text-xl">{getIcon()}</span>
        <h3 className="text-xl font-semibold">{name}</h3>
        {credits > 0 && (
          <span className="ml-auto text-sm bg-[var(--vanilla)] text-[var(--coffee)] px-2 py-0.5 rounded whitespace-nowrap">
            {credits} Credits/month
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      
      <div className="mb-6">
        <div className="flex items-end flex-wrap sm:flex-nowrap">
          {price === 0 ? (
            <span className="text-3xl font-bold transition-all duration-300">Free</span>
          ) : (
            <>
              <span className="text-3xl font-bold transition-all duration-300">₹{price}</span>
              <div className="text-xs sm:text-sm text-gray-500 ml-1 mb-1">
                <div>INR/month</div>
                {id === 'enterprise' && <div className="text-xs">Custom pricing available</div>}
              </div>
            </>
          )}
        </div>
      </div>
      
      <button
        onClick={() => onSelect(id)}
        disabled={loading || selectedPlan === id || isCurrentPlan}
        className={`w-full py-2 px-4 rounded transition-colors mb-6 font-medium flex items-center justify-center ${isCurrentPlan 
          ? 'bg-green-600 text-white cursor-default' 
          : selectedPlan === id 
            ? 'bg-green-600 text-white cursor-default' 
            : loading 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-[var(--coffee)] text-white hover:bg-[#3a1e12]'}`}
      >
        {loading && selectedPlan === id ? (
          <>
            <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
            <span>Processing...</span>
          </>
        ) : isCurrentPlan ? (
          <>
            <FaCheckCircle className="mr-2" />
            <span>Current Plan</span>
          </>
        ) : selectedPlan === id ? (
          'Selected'
        ) : id === 'enterprise' ? (
          'Contact Sales'
        ) : (
          'Select Plan'
        )}
      </button>
      
      <div className="space-y-3 mt-auto">
        {features.map((feature, index) => (
          <div key={index}>
            {feature.header ? (
              <p className="text-sm font-medium">{feature.text}</p>
            ) : (
              <div className="flex items-start gap-2">
                <span className="text-[var(--almond)] mt-1">
                  <FaCheck size={12} />
                </span>
                <span className="text-sm text-gray-800">{feature.text}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingCard;