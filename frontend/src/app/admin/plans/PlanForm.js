'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function PlanForm({ plan, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    id: plan?.id || '',
    name: plan?.name || '',
    price: plan?.price || 0,
    credits: plan?.credits || 0,
    description: plan?.description || '',
    features: plan?.features || ['']
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Filter out empty features and convert to object format with text property
    const cleanedData = {
      ...formData,
      features: formData.features
        .filter(feature => {
          // Handle both string and object formats
          const featureText = typeof feature === 'object' && feature !== null ? feature.text : feature;
          return featureText && featureText.trim() !== '';
        })
        .map(feature => {
          // Convert to object format with text property
          const featureText = typeof feature === 'object' && feature !== null ? feature.text : feature;
          return { text: featureText, header: false };
        })
    };
    
    onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plan ID</label>
          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            min="0"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows="3"
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
        {formData.features.map((feature, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="text"
              value={typeof feature === 'object' && feature !== null ? feature.text || '' : feature}
              onChange={(e) => handleFeatureChange(index, e.target.value)}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md mr-2"
              placeholder="Feature description"
            />
            <button
              type="button"
              onClick={() => removeFeature(index)}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addFeature}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Feature
        </button>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Save Plan
        </button>
      </div>
    </form>
  );
}