'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import adminApi from '@/services/adminApi';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'FashionX',
    siteDescription: 'AI-powered fashion platform',
    contactEmail: 'support@fashionx.com',
    supportPhone: '+1 (555) 123-4567',
    maintenanceMode: false,
    allowRegistration: true,
    defaultUserCredits: 100,
    maxUploadSize: 10,
    termsLastUpdated: '2023-01-01'
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // In a real implementation, you would fetch settings from the backend
    // For now, we're using the default values
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // In a real implementation, you would save settings to the backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        <button
          onClick={handleSaveSettings}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={saving}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">General Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
              Site Name
            </label>
            <input
              type="text"
              id="siteName"
              name="siteName"
              value={settings.siteName}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Site Description
            </label>
            <input
              type="text"
              id="siteDescription"
              name="siteDescription"
              value={settings.siteDescription}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={settings.contactEmail}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="supportPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Support Phone
            </label>
            <input
              type="text"
              id="supportPhone"
              name="supportPhone"
              value={settings.supportPhone}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">System Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="maintenanceMode"
              name="maintenanceMode"
              checked={settings.maintenanceMode}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700">
              Maintenance Mode
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowRegistration"
              name="allowRegistration"
              checked={settings.allowRegistration}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allowRegistration" className="ml-2 block text-sm text-gray-700">
              Allow User Registration
            </label>
          </div>
          <div>
            <label htmlFor="defaultUserCredits" className="block text-sm font-medium text-gray-700 mb-1">
              Default User Credits
            </label>
            <input
              type="number"
              id="defaultUserCredits"
              name="defaultUserCredits"
              value={settings.defaultUserCredits}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="maxUploadSize" className="block text-sm font-medium text-gray-700 mb-1">
              Max Upload Size (MB)
            </label>
            <input
              type="number"
              id="maxUploadSize"
              name="maxUploadSize"
              value={settings.maxUploadSize}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Advanced Settings</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="termsLastUpdated" className="block text-sm font-medium text-gray-700 mb-1">
              Terms & Conditions Last Updated
            </label>
            <input
              type="date"
              id="termsLastUpdated"
              name="termsLastUpdated"
              value={settings.termsLastUpdated}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-md font-medium mb-2">Environment Variables</h3>
            <p className="text-sm text-gray-600 mb-3">
              Manage application environment variables such as API keys, database connections, and service configurations.
            </p>
            <Link 
              href="/admin/environment"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Manage Environment Variables
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}