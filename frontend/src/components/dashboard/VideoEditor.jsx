'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Upload, Video, Loader, Download, ExternalLink, CreditCard, AlertTriangle, ArrowLeft, Music, Type, Image as ImageIcon } from 'lucide-react';
import VideoHistory from './VideoHistory';
import api from '@/lib/api';
import Link from 'next/link';
import { getUserData, setUserData, getAuthToken } from '@/lib/cookieUtils';
import { useCredits } from '../../contexts/CreditContext';

const VideoEditor = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [resultVideo, setResultVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { credits, creditsLoading, hasEnoughCredits, shouldShowWarning, deductCredits, updateCredits } = useCredits();
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  
  useEffect(() => {
    // Check if we should show credit warning
    setShowCreditWarning(shouldShowWarning());
  }, [shouldShowWarning]);

  // Handle file selection for image
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, WebP)');
        return;
      }
      
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setImageUrl(''); // Clear URL input when file is selected
      setUploadedImageUrl(''); // Clear any previous uploaded URL
      
      // Create preview URL for display only
      const blobUrl = URL.createObjectURL(file);
      setPreviewUrl(blobUrl);
    }
  };

  // Handle file selection for audio
  const handleAudioFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid audio file (MP3, WAV, OGG)');
        return;
      }
      
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setSelectedAudioFile(file);
      setAudioUrl(''); // Clear URL input when file is selected
      setUploadedAudioUrl(''); // Clear any previous uploaded URL
      
      // Create preview URL for display only
      const blobUrl = URL.createObjectURL(file);
      setAudioPreviewUrl(blobUrl);
    }
  };

  // Handle upload area click for image
  const handleUploadAreaClick = () => {
    if (loading || uploading) return;
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.click();
    }
  };

  // Handle upload area click for audio
  const handleAudioUploadAreaClick = () => {
    if (loading || uploading) return;
    const fileInput = document.getElementById('audio-file-upload');
    if (fileInput) {
      fileInput.click();
    }
  };

  // Handle file upload for image
  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const token = getAuthToken();
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      // Clear the blob preview URL and set the server URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
      setUploadedImageUrl(data.data.url);
      setImageUrl(data.data.url);
      setSelectedFile(null); // Clear selected file after successful upload
      toast.success('Image uploaded successfully!');
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err.message);
      toast.error(`Failed to upload image: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle file upload for audio
  const handleAudioFileUpload = async () => {
    if (!selectedAudioFile) {
      toast.error('Please select an audio file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', selectedAudioFile);

      const token = getAuthToken();
      const response = await fetch('/api/upload/audio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload audio');
      }

      // Clear the blob preview URL and set the server URL
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl('');
      }
      setUploadedAudioUrl(data.data.url);
      setAudioUrl(data.data.url);
      setSelectedAudioFile(null); // Clear selected file after successful upload
      toast.success('Audio uploaded successfully!');
    } catch (err) {
      console.error('Error uploading audio:', err);
      setError(err.message);
      toast.error(`Failed to upload audio: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user has enough credits
    if (!hasEnoughCredits()) {
      toast.error('You have no credits left. Please upgrade your plan to continue.');
      setError('Insufficient credits. Please upgrade your plan to continue generating videos.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResultVideo(null);
    
    try {
      const token = getAuthToken();
      let endpoint = '';
      let requestBody = {};
      
      // Different request bodies based on active tab
      if (activeTab === 'text-to-video') {
        if (!prompt.trim()) {
          throw new Error('Please enter a prompt for text-to-video generation');
        }
        
        endpoint = '/api/video-edit/text-to-video';
        requestBody = {
          prompt: prompt.trim()
        };
      } 
      else if (activeTab === 'image-to-video') {
        // Check if we have either uploaded image or URL
        let finalImageUrl = imageUrl.trim();
        
        // If a file is selected but not uploaded yet, upload it first
        if (selectedFile && !uploadedImageUrl) {
          throw new Error('Please click the "Upload Image" button first before generating video');
        }
        
        // Use uploaded URL if available, otherwise use manual URL input
        if (uploadedImageUrl) {
          finalImageUrl = uploadedImageUrl;
        }
        
        if (!finalImageUrl) {
          throw new Error('Please upload an image or enter an image URL');
        }
        
        endpoint = '/api/video-edit/image-to-video';
        requestBody = {
          image_url: finalImageUrl,
          prompt: prompt.trim() // Optional prompt for image-to-video
        };
      }
      else if (activeTab === 'audio-to-video') {
        // Check if we have either uploaded audio or URL
        let finalAudioUrl = audioUrl.trim();
        
        // If a file is selected but not uploaded yet, upload it first
        if (selectedAudioFile && !uploadedAudioUrl) {
          throw new Error('Please click the "Upload Audio" button first before generating video');
        }
        
        // Use uploaded URL if available, otherwise use manual URL input
        if (uploadedAudioUrl) {
          finalAudioUrl = uploadedAudioUrl;
        }
        
        if (!finalAudioUrl) {
          throw new Error('Please upload an audio file or enter an audio URL');
        }
        
        // Check if we have either uploaded image or URL
        let finalImageUrl = imageUrl.trim();
        
        // If a file is selected but not uploaded yet, upload it first
        if (selectedFile && !uploadedImageUrl) {
          throw new Error('Please click the "Upload Image" button first before generating video');
        }
        
        // Use uploaded URL if available, otherwise use manual URL input
        if (uploadedImageUrl) {
          finalImageUrl = uploadedImageUrl;
        }
        
        if (!finalImageUrl) {
          throw new Error('Please upload an image or enter an image URL');
        }
        
        endpoint = '/api/video-edit/audio-to-video';
        requestBody = {
          audio_url: finalAudioUrl,
          image_url: finalImageUrl,
          prompt: prompt.trim() // Optional prompt for audio-to-video
        };
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(requestBody)
      });
      
      let data;
      try {
        const responseText = await response.text();
        
        
        // Check if response starts with "Internal S" (likely "Internal Server Error")
        if (responseText.startsWith('Internal S')) {
          throw new Error('Server returned an internal error. Please try again later.');
        }
        
        // Try to parse as JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        throw new Error('Server returned an invalid response. Please try again.');
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video');
      }
      
      if (data && data.status === 'success') {
        // Get video URL from response
        let resultVideoUrl = null;
        
        if (data.data && data.data.videoUrl) {
          resultVideoUrl = data.data.videoUrl;
        }
        
        if (resultVideoUrl) {
          setResultVideo(resultVideoUrl);
          
          // Update credits using context
          if (data.credits && data.credits.remaining !== undefined) {
            updateCredits(data.credits.remaining);
          } else if (data.credits !== undefined) {
            updateCredits(data.credits);
          } else {
            // Fallback: deduct 1 credit if no specific credit info in response
            deductCredits(1);
          }
          
          toast.success('Video generated successfully!');
        } else {
          throw new Error('No video URL in response');
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error generating video:', err);
      const errorMessage = err.message || 'Failed to generate video';
      setError(errorMessage);
      toast.error(`Failed to generate video: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AI Video Generator</h1>
            </div>
          </div>
          
          {credits !== null && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 px-4 py-2 rounded-lg">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">
                {credits} {credits === 1 ? 'Credit' : 'Credits'} Left
              </span>
              <Link 
                href="/dashboard/billing" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                Get More
              </Link>
            </div>
          )}
        </div>
        
        {showCreditWarning && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 text-sm">Low Credits Warning</h3>
              <p className="text-xs text-amber-700 mt-1">
                You're running low on credits. Each video generation uses 1 credit.
                <Link href="/dashboard/billing" className="font-medium text-amber-800 hover:text-amber-900 ml-1">
                  Upgrade your plan
                </Link> to continue generating videos.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input/Upload */}
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Create Your Video</h2>
            <p className="text-sm text-gray-600">Transform your ideas into stunning videos with AI</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {/* Tabs */}
            <div className="mb-6">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  className={`flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'text-to-video'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveTab('text-to-video')}
                >
                  <Type className="w-4 h-4 mr-2" />
                  Text to Video
                </button>
                <button
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed relative"
                  disabled
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Image to Video
                  <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                    Soon
                  </span>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Text to Video Tab */}
              {activeTab === 'text-to-video' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-800 mb-3">
                      Describe your video in detail
                    </label>
                    <textarea
                      id="prompt"
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 resize-none"
                      placeholder="Describe your video in detail... For example: 'A peaceful mountain landscape at sunrise with golden light reflecting on a crystal clear lake, birds flying in the distance, and gentle morning mist rising from the water'"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      💡 Tip: Be specific and descriptive for better results
                    </p>
                  </div>
                </div>
              )}
              
              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 mr-3 animate-spin" />
                      Generating Your Video...
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5 mr-3" />
                      Generate Video
                    </>
                  )}
                </button>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Panel - Output/Result */}
        <div className="w-1/2 bg-gray-50 flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Generated Video</h2>
            <p className="text-sm text-gray-600">Your AI-generated video will appear here</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Generating your video...</p>
                  <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
                </div>
              </div>
            )}
            
            {!loading && !resultVideo && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No video generated yet</h3>
                  <p className="text-gray-500 text-sm">
                    Enter a detailed description in the left panel and click "Generate Video" to create your AI video.
                  </p>
                </div>
              </div>
            )}
            
            {resultVideo && (
              <div className="space-y-6">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video 
                    src={resultVideo} 
                    controls
                    preload="metadata"
                    className="w-full h-full object-contain"
                    onLoadStart={() => 
                      toast.error('Error loading video. Please try downloading it directly.');
                    }}
                    poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5WaWRlbzwvdGV4dD48L3N2Zz4="
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(resultVideo);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `generated-video-${Date.now()}.mp4`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                        toast.success('Video download started!');
                      } catch (error) {
                        console.error('Download error:', error);
                        toast.error('Download failed. Please try the direct link.');
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                  
                  <a
                    href={resultVideo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </a>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(resultVideo);
                      toast.success('Video URL copied to clipboard!');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy URL
                  </button>
                </div>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✅ Video generated successfully! You can watch it above, download it, or open it in a new tab.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
