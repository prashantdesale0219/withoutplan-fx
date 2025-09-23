'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save, RefreshCw, Search, Edit, Trash2, Plus } from 'lucide-react';
import adminApi from '@/services/adminApi';

export default function EnvironmentSettings() {
  const [envVariables, setEnvVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVariables, setFilteredVariables] = useState([]);
  const [newVariable, setNewVariable] = useState({ key: '', value: '', category: 'other' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Categories for organizing environment variables
  const categories = [
    { id: 'server', name: 'Server Configuration' },
    { id: 'database', name: 'Database' },
    { id: 'webhook', name: 'Webhook Configuration' },
    { id: 'jwt', name: 'JWT Configuration' },
    { id: 'payment', name: 'Payment Configuration' },
    { id: 'email', name: 'Email Configuration' },
    { id: 'aws', name: 'AWS Configuration' },
    { id: 'cors', name: 'CORS Configuration' },
    { id: 'api', name: 'API Configuration' },
    { id: 'rate', name: 'Rate Limiting' },
    { id: 'upload', name: 'File Upload Configuration' },
    { id: 'n8n', name: 'n8n Webhook Configuration' },
    { id: 'photoshoot', name: 'Photoshoot Card Webhooks' },
    { id: 'product', name: 'Product Type Webhooks' },
    { id: 'scene', name: 'Scene/Location Webhooks' },
    { id: 'shot', name: 'Shot Style Webhooks' },
    { id: 'mood', name: 'Mood/Genre Webhooks' },
    { id: 'target', name: 'Target Channel Webhooks' },
    { id: 'other', name: 'Other' }
  ];

  useEffect(() => {
    fetchEnvironmentVariables();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = envVariables.filter(
        variable => 
          variable.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
          variable.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
          variable.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVariables(filtered);
    } else {
      setFilteredVariables(envVariables);
    }
  }, [searchTerm, envVariables]);

  const fetchEnvironmentVariables = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getEnvironmentVariables();
      
      // Ensure data is an array before mapping
      const envData = response.data?.data || [];
      
      // Categorize variables based on their keys
      const categorizedVariables = envData.map(variable => {
        let category = 'other';
        
        if (variable.key.startsWith('NODE_') || variable.key === 'PORT' || variable.key === 'PUBLIC_URL') {
          category = 'server';
        } else if (variable.key.startsWith('MONGODB_')) {
          category = 'database';
        } else if (variable.key.startsWith('WEBHOOK_')) {
          category = 'webhook';
        } else if (variable.key.startsWith('JWT_')) {
          category = 'jwt';
        } else if (variable.key.startsWith('RAZORPAY_')) {
          category = 'payment';
        } else if (variable.key.startsWith('SMTP_') || variable.key.startsWith('EMAIL_') || variable.key.includes('EMAIL')) {
          category = 'email';
        } else if (variable.key.startsWith('AWS_')) {
          category = 'aws';
        } else if (variable.key.startsWith('CORS_')) {
          category = 'cors';
        } else if (variable.key.startsWith('KIE_')) {
          category = 'api';
        } else if (variable.key.startsWith('RATE_')) {
          category = 'rate';
        } else if (variable.key.startsWith('UPLOAD_') || variable.key.startsWith('MAX_FILE_')) {
          category = 'upload';
        } else if (variable.key.startsWith('N8N_')) {
          category = 'n8n';
        } else if (variable.key.includes('CARD') && variable.key.includes('N8N_WEBHOOK')) {
          category = 'photoshoot';
        } else if (variable.key.startsWith('PRODUCT_TYPE_')) {
          category = 'product';
        } else if (variable.key.startsWith('SCENE_LOCATION_')) {
          category = 'scene';
        } else if (variable.key.startsWith('SHOT_STYLE_')) {
          category = 'shot';
        } else if (variable.key.startsWith('MOOD_GENRE_')) {
          category = 'mood';
        } else if (variable.key.startsWith('TARGET_CHANNEL_')) {
          category = 'target';
        }
        
        return {
          ...variable,
          category
        };
      });
      
      setEnvVariables(categorizedVariables);
      setFilteredVariables(categorizedVariables);
    } catch (error) {
      console.error('Failed to fetch environment variables:', error);
      toast.error('Failed to load environment variables');
    } finally {
      setLoading(false);
    }
  };

  const handleVariableChange = (index, value) => {
    const updatedVariables = [...filteredVariables];
    updatedVariables[index].value = value;
    
    // Update the main array as well
    const mainIndex = envVariables.findIndex(v => v.key === updatedVariables[index].key);
    if (mainIndex !== -1) {
      const newEnvVariables = [...envVariables];
      newEnvVariables[mainIndex].value = value;
      setEnvVariables(newEnvVariables);
    }
    
    setFilteredVariables(updatedVariables);
  };

  const saveEnvironmentVariables = async () => {
    setSaving(true);
    try {
      await adminApi.updateEnvironmentVariables(envVariables);
      toast.success('Environment variables updated successfully');
    } catch (error) {
      console.error('Failed to update environment variables:', error);
      toast.error('Failed to update environment variables');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddVariable = async () => {
    if (!newVariable.key || !newVariable.value) {
      toast.error('Key and value are required');
      return;
    }
    
    try {
      setSaving(true);
      await adminApi.addEnvironmentVariable(newVariable.key, newVariable.value);
      
      // Add to local state with category
      const addedVariable = {
        key: newVariable.key,
        value: newVariable.value,
        category: newVariable.category
      };
      
      setEnvVariables([...envVariables, addedVariable]);
      setFilteredVariables([...filteredVariables, addedVariable]);
      
      // Reset form
      setNewVariable({ key: '', value: '', category: 'other' });
      setShowAddForm(false);
      
      toast.success('Environment variable added successfully');
    } catch (error) {
      console.error('Failed to add environment variable:', error);
      toast.error(error.response?.data?.message || 'Failed to add environment variable');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteVariable = async (key) => {
    if (window.confirm(`Are you sure you want to delete ${key}?`)) {
      try {
        setSaving(true);
        await adminApi.deleteEnvironmentVariable(key);
        
        // Remove from local state
        const updatedVariables = envVariables.filter(v => v.key !== key);
        setEnvVariables(updatedVariables);
        setFilteredVariables(filteredVariables.filter(v => v.key !== key));
        
        toast.success('Environment variable deleted successfully');
      } catch (error) {
        console.error('Failed to delete environment variable:', error);
        toast.error(error.response?.data?.message || 'Failed to delete environment variable');
      } finally {
        setSaving(false);
      }
    }
  };

  const renderVariablesByCategory = (categoryId) => {
    const categoryVariables = filteredVariables.filter(variable => variable.category === categoryId);
    
    if (categoryVariables.length === 0) {
      return null;
    }
    
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          {categories.find(cat => cat.id === categoryId)?.name || 'Other'}
        </h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variable Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryVariables.map((variable, index) => (
                <tr key={variable.key}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {variable.key}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={variable.value}
                      onChange={(e) => handleVariableChange(
                        filteredVariables.findIndex(v => v.key === variable.key),
                        e.target.value
                      )}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // Focus on the input field for this variable
                          const inputField = document.querySelector(`input[value="${variable.value}"]`);
                          if (inputField) {
                            inputField.focus();
                            // Select all text in the input field
                            inputField.select();
                          }
                          toast.info(`Editing ${variable.key} - make your changes and click Save Changes when done`);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        disabled={saving}
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteVariable(variable.key)}
                        className="text-red-600 hover:text-red-900 p-1"
                        disabled={saving}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Environment Settings</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            disabled={saving}
          >
            {showAddForm ? 'Cancel' : 'Add Variable'}
          </button>
          <button
            onClick={fetchEnvironmentVariables}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={saveEnvironmentVariables}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
      
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Environment Variable</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={newVariable.key}
                onChange={(e) => setNewVariable({...newVariable, key: e.target.value})}
                placeholder="VARIABLE_NAME"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={newVariable.value}
                onChange={(e) => setNewVariable({...newVariable, value: e.target.value})}
                placeholder="variable_value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={newVariable.category}
                onChange={(e) => setNewVariable({...newVariable, category: e.target.value})}
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleAddVariable}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={saving}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Variable
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search environment variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            These settings allow you to configure the application environment. Changes will be applied after saving and may require a server restart to take effect.
          </p>
          
          {categories.map(category => (
            <div key={category.id}>
              {renderVariablesByCategory(category.id)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}