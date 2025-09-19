'use client';
import React, { useState } from 'react';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import Sidebar from '../../components/dashboard/Sidebar';
import DashboardErrorBoundary from '../../components/dashboard/DashboardErrorBoundary';
// ToastContainer is handled in ClientLayout

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    return (
          <div className="p-6 w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to FashionX Dashboard</h1>
              <p className="text-gray-600">
                Manage your fashion design projects and account settings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <DashboardCard 
                title="Profile" 
                description="Manage your account settings"
                icon="👤"
                onClick={() => setActiveTab('profile')}
              />
              <DashboardCard 
                title="Settings" 
                description="Configure application preferences"
                icon="⚙️"
                onClick={() => setActiveTab('settings')}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 text-blue-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5">1</div>
                  <div>
                    <h3 className="font-medium text-gray-900">Create your account</h3>
                    <p className="text-gray-600 mt-1">Sign up and complete your profile information.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 text-blue-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5">2</div>
                  <div>
                    <h3 className="font-medium text-gray-900">Configure settings</h3>
                    <p className="text-gray-600 mt-1">Customize your application preferences.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
    );
  };

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="flex-1 p-4">
            {renderContent()}
          </main>
        </div>
        {/* ToastContainer is handled in ClientLayout */}
      </div>
    </DashboardErrorBoundary>
  );
}

const DashboardCard = ({ title, description, icon, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};