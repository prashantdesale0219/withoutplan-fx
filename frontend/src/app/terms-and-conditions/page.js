import React from 'react';
import TermsAndConditions from '@/components/terms-condition/TermsAndConditions';

export const metadata = {
  title: 'Terms and Conditions | FashionX',
  description: 'Terms and conditions for using FashionX services',
};

const TermsPage = () => {
  return (
    <div className="min-h-screen py-10 bg-white dark:bg-black">
      <TermsAndConditions />
    </div>
  );
};

export default TermsPage;