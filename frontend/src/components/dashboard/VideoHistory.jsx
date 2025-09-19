'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Trash2, Download, ExternalLink, RefreshCw, Video } from 'lucide-react';
import { getUserData, getAuthToken } from '@/lib/cookieUtils';
import api from '@/lib/api';

const VideoHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load history from database
  const loadVideoHistory = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        console.log('No auth token found, skipping video history load');
        setHistory([]);
        return;
      }
      
      const response = await api.get('/api/user/videos');
      
      if (response.data.success) {
        // Convert database format to frontend format
        const formattedHistory = response.data.data.videos.map(video => ({
          id: video.id,
          originalUrl: video.originalUrl || null,
          audioUrl: video.audioUrl || null,
          videoUrl: video.videoUrl,
          prompt: video.prompt,
          type: video.type, // text-to-video, image-to-video, audio-to-video
          timestamp: video.createdAt,
          taskId: video.taskId
        }));
        
        setHistory(formattedHistory);
        console.log('Loaded video history from database:', formattedHistory.length, 'videos');
      } else {
        console.error('Failed to load video history:', response.data.message);
        setHistory([]);
      }
    } catch (err) {
      console.error('Error loading video history:', err);
      if (err.response?.status === 401) {
        console.log('User not authenticated, clearing history');
        setHistory([]);
      } else if (err.response?.status === 404) {
        console.log('Video history endpoint not found, showing empty state');
        setHistory([]);
      } else {
        toast.error('Failed to load video history');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideoHistory();
    
    // Listen for new video generation events
    const handleVideoGenerated = () => {
      console.log('New video generated, refreshing history...');
      loadVideoHistory();
    };
    
    window.addEventListener('videoGenerated', handleVideoGenerated);
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('videoGenerated', handleVideoGenerated);
    };
  }, []);

  // Download video function
  const downloadVideo = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'generated-video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
      
      toast.success('Video download started');
    } catch (err) {
      console.error('Error downloading video:', err);
      toast.error('Failed to download video');
    }
  };

  // Delete history item
  const deleteHistoryItem = async (id) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error('Please login to delete videos');
        return;
      }
      
      const response = await api.delete(`/api/user/videos/${id}`);
      
      if (response.data.success) {
        const updatedHistory = history.filter(item => item.id !== id);
        setHistory(updatedHistory);
        toast.success('Video removed from history');
      } else {
        toast.error('Failed to delete video');
      }
    } catch (err) {
      console.error('Error deleting history item:', err);
      toast.error('Failed to delete history item');
    }
  };

  // Get video type label
  const getVideoTypeLabel = (type) => {
    switch (type) {
      case 'text-to-video':
        return 'Text to Video';
      case 'image-to-video':
        return 'Image to Video';
      case 'audio-to-video':
        return 'Audio to Video';
      default:
        return 'Generated Video';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Video History</h2>
          <button
            onClick={loadVideoHistory}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Your Video History</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={loadVideoHistory}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Video className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">No videos generated yet</p>
          <p className="text-sm mt-1">
            Generated videos will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                <video 
                  src={item.videoUrl} 
                  className="w-full h-full object-cover"
                  controls
                />
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {getVideoTypeLabel(item.type)}
                </div>
              </div>
              
              <div className="p-3">
                <div className="text-xs text-gray-500 mb-1">
                  {formatDate(item.timestamp)}
                </div>
                <p className="text-sm line-clamp-2 mb-2">
                  {item.prompt || 'No prompt provided'}
                </p>
                
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadVideo(item.videoUrl, `video-${item.id}.mp4`)}
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                      title="Download video"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <a
                      href={item.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  
                  <button
                    onClick={() => deleteHistoryItem(item.id)}
                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Delete from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoHistory;