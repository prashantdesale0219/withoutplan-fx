import React from 'react';
import PrivacyPolicy from '@/components/terms-condition/PrivacyPolicy';

export const metadata = {
  title: 'Privacy Policy | FashionX',
  description: 'Privacy policy for FashionX services',
};

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen py-10 bg-white dark:bg-black">
      <PrivacyPolicy />
    </div>
  );
};

export default PrivacyPolicyPage;