'use client';

import { useState, useEffect } from 'react';
import * as adminApi from '@/services/adminApi';
import { Pencil, Trash, Plus, Save, X } from 'lucide-react';

export default function PlansManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [newPlan, setNewPlan] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    price: 0,
    credits: 0,
    description: '',
    features: []
  });

  // Fetch plans on component mount
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPlans();
      // Handle multiple possible response formats
      const plansData = response.plans || response.data?.plans || [];
      setPlans(plansData);
      setError(null);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan.id);
    setFormData({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      credits: plan.credits,
      description: plan.description,
      features: plan.features || []
    });
    // Open the modal for editing
    document.getElementById('editPlanModal').showModal();
  };

  const handleNew = () => {
    setNewPlan(true);
    setFormData({
      id: '',
      name: '',
      price: 0,
      credits: 0,
      description: '',
      features: ['']
    });
    // Open the modal for adding a new plan
    document.getElementById('newPlanModal').showModal();
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setNewPlan(false);
    // Close any open modals
    document.getElementById('editPlanModal')?.close();
    document.getElementById('newPlanModal')?.close();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'credits' ? Number(value) : value
    }));
  };

  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = value;
    setFormData(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Filter out empty features
      const cleanedData = {
        ...formData,
        features: formData.features.filter(feature => {
          const featureText = typeof feature === 'object' ? feature.text : feature;
          return featureText.trim() !== '';
        })
      };

      if (newPlan) {
        await adminApi.createPlan(cleanedData);
      } else {
        await adminApi.updatePlan(formData.id, cleanedData);
      }
      
      setEditingPlan(null);
      setNewPlan(false);
      // Close any open modals
      document.getElementById('editPlanModal')?.close();
      document.getElementById('newPlanModal')?.close();
      fetchPlans();
    } catch (err) {
      console.error('Error saving plan:', err);
      setError('Failed to save plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      try {
        setLoading(true);
        await adminApi.deletePlan(planId);
        fetchPlans();
        // Show success message
        alert('Plan deleted successfully');
      } catch (err) {
        console.error('Error deleting plan:', err);
        setError('Failed to delete plan. Please try again.');
        // Show error message
        alert('Failed to delete plan: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && plans.length === 0) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
    </div>;
  }

  if (error && plans.length === 0) {
    return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      {error}
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Plans Management</h1>
        <button
          onClick={handleNew}
          disabled={newPlan || editingPlan !== null}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Plan
        </button>
      </div>

      {/* New Plan Modal */}
      <dialog id="newPlanModal" className="modal modal-bottom sm:modal-middle rounded-lg shadow-lg">
        <div className="bg-white p-6 w-full max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Create New Plan</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan ID</label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., basic, pro, enterprise"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier, lowercase with no spaces</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Basic Plan, Pro Plan"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="2"
                placeholder="Brief description of the plan"
                required
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={typeof feature === 'object' ? feature.text : feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md mr-2"
                    placeholder="e.g., Access to all basic features"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-2"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Feature
              </button>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Plan
              </button>
            </div>
          </form>
        </div>
      </dialog>
      
      {/* Edit Plan Modal */}
      <dialog id="editPlanModal" className="modal modal-bottom sm:modal-middle rounded-lg shadow-lg">
        <div className="bg-white p-6 w-full max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Edit Plan</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan ID</label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                  placeholder="e.g., basic, pro, enterprise"
                  required
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Basic Plan, Pro Plan"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="2"
                placeholder="Brief description of the plan"
                required
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md mr-2"
                    placeholder="e.g., Access to all basic features"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-2"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Feature
              </button>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Plan
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* Plans Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900 capitalize">{plan.name}</div>
                  <div className="text-sm text-gray-500">{plan.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {plan.price === 0 ? (
                    <span className="text-green-600 font-medium">Free</span>
                  ) : (
                    <span className="text-gray-900">₹{plan.price}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {plan.credits}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">{plan.description}</div>
                  {plan.features && plan.features.length > 0 && (
                    <div className="mt-1">
                      <div className="text-xs text-gray-500 font-medium">Features:</div>
                      <ul className="text-xs text-gray-500 list-disc list-inside">
                        {plan.features.slice(0, 2).map((feature, index) => (
                          <li key={index} className="truncate">
                            {typeof feature === 'object' ? feature.text : feature}
                          </li>
                        ))}
                        {plan.features.length > 2 && (
                          <li className="text-blue-500">+{plan.features.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No plans found. Create your first plan to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}