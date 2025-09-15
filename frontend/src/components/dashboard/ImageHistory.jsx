'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Trash2, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { getUserData } from '@/lib/cookieUtils';

const ImageHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load history from localStorage with user-specific key
  useEffect(() => {
    try {
      const userData = getUserData();
      const userId = userData?._id || 'guest';
      const historyKey = `imageEditHistory_${userId}`;
      console.log('Loading image history for user:', userId);
      
      const savedHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      setHistory(savedHistory);
    } catch (err) {
      console.error('Error loading image history:', err);
      toast.error('Failed to load image history');
    } finally {
      setLoading(false);
    }
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
  const deleteHistoryItem = (id) => {
    try {
      const userData = getUserData();
      const userId = userData?._id || 'guest';
      const historyKey = `imageEditHistory_${userId}`;
      
      const updatedHistory = history.filter(item => item.id !== id);
      setHistory(updatedHistory);
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
      toast.success('Image removed from history');
    } catch (err) {
      console.error('Error deleting history item:', err);
      toast.error('Failed to delete history item');
    }
  };

  // Clear all history
  const clearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all image history?')) {
      try {
        const userData = getUserData();
        const userId = userData?._id || 'guest';
        const historyKey = `imageEditHistory_${userId}`;
        
        setHistory([]);
        localStorage.setItem(historyKey, '[]');
        toast.success('Image history cleared');
      } catch (err) {
        console.error('Error clearing history:', err);
        toast.error('Failed to clear history');
      }
    }
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

  // Refresh history from localStorage
  const refreshHistory = () => {
    setLoading(true);
    try {
      const userData = getUserData();
      const userId = userData?._id || 'guest';
      const historyKey = `imageEditHistory_${userId}`;
      
      const savedHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      setHistory(savedHistory);
      toast.success('History refreshed');
    } catch (err) {
      console.error('Error refreshing history:', err);
      toast.error('Failed to refresh history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Image Edit History</h2>
        <div className="flex space-x-2">
          <button
            onClick={refreshHistory}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
          {history.length > 0 && (
            <button
              onClick={clearAllHistory}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No image edit history found</p>
          <p className="text-sm mt-2">Edit images to see your history here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <div className="relative">
                <img 
                  src={item.resultUrl} 
                  alt={item.prompt} 
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/images/image-error.png';
                  }}
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={() => downloadImage(item.resultUrl, `edited-image-${item.id}.png`)}
                    className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                    title="Download image"
                  >
                    <Download className="h-4 w-4 text-blue-600" />
                  </button>
                  <a
                    href={item.resultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                  </a>
                  <button
                    onClick={() => deleteHistoryItem(item.id)}
                    className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                    title="Delete from history"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-gray-900 truncate" title={item.prompt}>
                  {item.prompt}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(item.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageHistory;