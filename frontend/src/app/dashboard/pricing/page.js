'use client';

import React from 'react';
import PricingContent from '../../../components/pricing/pricingContent';
import DashboardErrorBoundary from '../../../components/dashboard/DashboardErrorBoundary';

const PricingPage = () => {
  return (
    <DashboardErrorBoundary>
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Pricing Plans</h1>
        <PricingContent />
      </div>
    </DashboardErrorBoundary>
  );
};

export default PricingPage;