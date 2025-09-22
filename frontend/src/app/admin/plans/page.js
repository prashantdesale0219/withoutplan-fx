'use client';

import { useState, useEffect } from 'react';
import planApi from '@/services/planApi';
import { Pencil, Trash, Plus } from 'lucide-react';
import PlanForm from './PlanForm';

export default function PlansManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewPlan, setIsNewPlan] = useState(false);

  // Fetch plans on component mount
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await planApi.getAllPlans();
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
    setEditingPlan(plan);
    setIsNewPlan(false);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingPlan(null);
    setIsNewPlan(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setIsNewPlan(false);
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      
      if (isNewPlan) {
        const response = await planApi.createPlan(formData);
        console.log('Plan created successfully:', response);
      } else {
        const response = await planApi.updatePlan(formData.id, formData);
        console.log('Plan updated successfully:', response);
      }
      
      handleCloseModal();
      fetchPlans();
    } catch (err) {
      console.error('Error saving plan:', err);
      // Improved error handling to extract more detailed error information
      const errorMessage = err.message || (err.response?.data?.error || err.response?.data?.message || 'Unknown error');
      alert('Failed to save plan: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      try {
        setLoading(true);
        await planApi.deletePlan(planId);
        fetchPlans();
        alert('Plan deleted successfully');
      } catch (err) {
        console.error('Error deleting plan:', err);
        alert('Failed to delete plan: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && plans.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Plans Management</h1>
        <button
          onClick={handleNew}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Plan
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{plan.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{plan.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">₹{plan.price}</td>
                <td className="px-6 py-4 whitespace-nowrap">{plan.credits}</td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md inline-flex items-center"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md inline-flex items-center"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for editing or creating plans */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
            <h2 className="text-xl font-semibold mb-4">
              {isNewPlan ? 'Create New Plan' : 'Edit Plan'}
            </h2>
            <PlanForm 
              plan={editingPlan} 
              onSubmit={handleSubmit} 
              onCancel={handleCloseModal} 
            />
          </div>
        </div>
      )}
    </div>
  );
}