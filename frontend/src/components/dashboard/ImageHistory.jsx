'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Trash2, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { getUserData, getAuthToken } from '@/lib/cookieUtils';
import api from '@/lib/api';

const ImageHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load history from database
  const loadImageHistory = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        console.log('No auth token found, skipping image history load');
        setHistory([]);
        return;
      }
      
      const response = await api.get('/api/user/images');
      
      if (response.data.success) {
        // Convert database format to frontend format
        const formattedHistory = response.data.data.images.map(img => ({
          id: img.id,
          originalUrl: img.originalUrl,
          resultUrl: img.resultUrl,
          prompt: img.prompt,
          timestamp: img.createdAt,
          taskId: img.taskId
        }));
        
        setHistory(formattedHistory);
        console.log('Loaded image history from database:', formattedHistory.length, 'images');
      } else {
        console.error('Failed to load image history:', response.data.message);
        setHistory([]);
      }
    } catch (err) {
      console.error('Error loading image history:', err);
      if (err.response?.status === 401) {
        console.log('User not authenticated, clearing history');
        setHistory([]);
      } else {
        toast.error('Failed to load image history');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImageHistory();
    
    // Listen for new image generation events
    const handleImageGenerated = () => {
      console.log('New image generated, refreshing history...');
      loadImageHistory();
    };
    
    window.addEventListener('imageGenerated', handleImageGenerated);
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('imageGenerated', handleImageGenerated);
    };
  }, []);

  // Download image function
  const downloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'edited-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
      
      toast.success('Image download started');
    } catch (err) {
      console.error('Error downloading image:', err);
      toast.error('Failed to download image');
    }
  };

  // Delete history item
  const deleteHistoryItem = async (id) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error('Please login to delete images');
        return;
      }
      
      const response = await api.delete(`/api/user/images/${id}`);
      
      if (response.data.success) {
        const updatedHistory = history.filter(item => item.id !== id);
        setHistory(updatedHistory);
        toast.success('Image removed from history');
      } else {
        toast.error('Failed to delete image');
      }
    } catch (err) {
      console.error('Error deleting history item:', err);
      toast.error('Failed to delete history item');
    }
  };

  // Clear all history
  const clearAllHistory = async () => {
    if (window.confirm('Are you sure you want to clear all image history?')) {
      try {
        const token = getAuthToken();
        
        if (!token) {
          toast.error('Please login to clear history');
          return;
        }
        
        // Delete all images one by one (since we don't have a bulk delete endpoint)
        const deletePromises = history.map(item => 
          api.delete(`/api/user/images/${item.id}`).catch(err => {
            console.error(`Failed to delete image ${item.id}:`, err);
            return null;
          })
        );
        
        await Promise.all(deletePromises);
        
        setHistory([]);
        toast.success('Image history cleared');
      } catch (err) {
        console.error('Error clearing history:', err);
        toast.error('Failed to clear history');
      }
    }
  };

  // Refresh history
  const refreshHistory = () => {
    loadImageHistory();
    toast.info('Refreshing image history...');
  };

  // Format date for display
  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch (err) {
      return 'Unknown date';
    }
  };



  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl shadow-gray-200/20 border border-gray-200/50 p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-black from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r text-black  bg-clip-text ">Image History</h2>
            <p className="text-gray-500 text-sm mt-1">Your AI-generated image transformations</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={refreshHistory}
            className="inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-md"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {history.length > 0 && (
            <button
              onClick={clearAllHistory}
              className="inline-flex items-center px-4 py-2.5 border border-red-300 shadow-sm text-sm font-semibold rounded-xl text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 hover:shadow-md"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your image history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No images yet</h3>
          <p className="text-gray-500 mb-4">Start creating amazing AI-generated images to see your history here</p>
          <p className="text-sm text-gray-400">Your transformed images will appear in this gallery</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {history.map((item) => (
            <div key={item.id} className="group bg-white border border-gray-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative overflow-hidden">
                <img 
                  src={item.resultUrl} 
                  alt={item.prompt} 
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/images/image-error.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <button
                    onClick={() => downloadImage(item.resultUrl, `edited-image-${item.id}.png`)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all duration-200 transform hover:scale-110"
                    title="Download image"
                  >
                    <Download className="h-4 w-4 text-blue-600" />
                  </button>
                  <a
                    href={item.resultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all duration-200 transform hover:scale-110"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4 text-green-600" />
                  </a>
                  <button
                    onClick={() => deleteHistoryItem(item.id)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all duration-200 transform hover:scale-110"
                    title="Delete from history"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-relaxed" title={item.prompt}>
                    {item.prompt}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDate(item.timestamp)}
                  </span>
                  <span className="px-2 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-xs font-medium">
                    AI Generated
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageHistory;