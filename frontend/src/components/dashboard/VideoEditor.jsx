'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Upload, Video, Loader, Download, ExternalLink, CreditCard, AlertTriangle, ArrowLeft, Music, Type, Image as ImageIcon } from 'lucide-react';
import VideoHistory from './VideoHistory';
import api from '@/lib/api';
import Link from 'next/link';
import { getUserData, setUserData, getAuthToken } from '@/lib/cookieUtils';

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
  const [credits, setCredits] = useState(null);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  
  useEffect(() => {
    // Get user data and check credits
    const userData = getUserData();
    if (userData && userData.credits !== undefined) {
      // Handle both object and number formats for credits
      let creditsBalance;
      if (typeof userData.credits === 'object' && userData.credits.balance !== undefined) {
        creditsBalance = userData.credits.balance;
      } else if (typeof userData.credits === 'number') {
        creditsBalance = userData.credits;
      } else {
        creditsBalance = 0;
      }
      
      // Ensure we only set a number, not an object
      setCredits(typeof creditsBalance === 'number' ? creditsBalance : 0);
      if (creditsBalance <= 3) {
        setShowCreditWarning(true);
      }
    }
  }, []);

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
    if (credits !== null && credits <= 0) {
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
        
        endpoint = '/api/video-edit/audio-to-video';
        requestBody = {
          audio_url: finalAudioUrl,
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
      
      const data = await response.json();
      
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
          
          // Update credits in state and cookie
          if (data.credits !== undefined) {
            setCredits(data.credits);
            
            // Update user data in cookie
            const userData = getUserData();
            if (userData) {
              userData.credits = data.credits;
              setUserData(userData);
            }
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">AI Video Generator</h2>
              <p className="text-gray-600 text-sm mt-1">
                Generate videos from text, images, or audio using AI
              </p>
            </div>
          </div>
       
          {credits !== null && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
              <CreditCard className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">
                {credits} {credits === 1 ? 'Credit' : 'Credits'} Left
              </span>
              <Link 
                href="/dashboard/billing" 
                className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-2"
              >
                Get More
              </Link>
            </div>
          )}
        </div>
        
        {showCreditWarning && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">Low Credits Warning</h3>
              <p className="text-sm text-amber-700 mt-1">
                You're running low on credits. Each video generation uses 1 credit.
                <Link href="/dashboard/billing" className="font-medium text-amber-800 hover:text-amber-900 ml-1">
                  Upgrade your plan
                </Link> to continue generating videos.
              </p>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex flex-wrap -mb-px">
            <button
              className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                activeTab === 'text-to-video'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('text-to-video')}
            >
              <Type className="w-4 h-4 mr-2" />
              Text to Video
            </button>
            <button
              className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                activeTab === 'image-to-video'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('image-to-video')}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Image to Video
            </button>
            <button
              className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                activeTab === 'audio-to-video'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('audio-to-video')}
            >
              <Music className="w-4 h-4 mr-2" />
              Audio to Video
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Text to Video Tab */}
          {activeTab === 'text-to-video' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                  Describe the video you want to generate
                </label>
                <textarea
                  id="prompt"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="E.g., A serene beach at sunset with gentle waves..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}
          
          {/* Image to Video Tab */}
          {activeTab === 'image-to-video' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload an image or provide an image URL
                </label>
                
                {/* Image Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                    uploading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  onClick={handleUploadAreaClick}
                >
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleFileSelect}
                    disabled={uploading || loading}
                  />
                  
                  {previewUrl ? (
                    <div className="relative">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-64 mx-auto rounded-lg object-contain" 
                      />
                      <div className="mt-2 text-sm text-gray-600">
                        Click to change image
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload className="w-6 h-6 text-gray-500" />
                      </div>
                      <div className="text-sm font-medium">
                        Click to upload an image
                      </div>
                      <p className="text-xs text-gray-500">
                        JPG, PNG, WebP (max 10MB)
                      </p>
                    </div>
                  )}
                </div>
                
                {selectedFile && !uploadedImageUrl && (
                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={handleFileUpload}
                      disabled={uploading || loading}
                    >
                      {uploading ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Image URL Input */}
                <div className="mt-4">
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Or enter an image URL
                  </label>
                  <input
                    type="text"
                    id="imageUrl"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={loading || !!selectedFile}
                  />
                </div>
                
                {/* Optional Prompt */}
                <div className="mt-4">
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                    Optional: Add a prompt to guide the video generation
                  </label>
                  <textarea
                    id="prompt"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="E.g., Transform this image into a cinematic scene..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Audio to Video Tab */}
          {activeTab === 'audio-to-video' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload an audio file or provide an audio URL
                </label>
                
                {/* Audio Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                    uploading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  onClick={handleAudioUploadAreaClick}
                >
                  <input
                    id="audio-file-upload"
                    type="file"
                    className="hidden"
                    accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
                    onChange={handleAudioFileSelect}
                    disabled={uploading || loading}
                  />
                  
                  {audioPreviewUrl ? (
                    <div className="relative">
                      <audio 
                        src={audioPreviewUrl} 
                        controls
                        className="mx-auto" 
                      />
                      <div className="mt-2 text-sm text-gray-600">
                        Click to change audio
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Music className="w-6 h-6 text-gray-500" />
                      </div>
                      <div className="text-sm font-medium">
                        Click to upload an audio file
                      </div>
                      <p className="text-xs text-gray-500">
                        MP3, WAV, OGG (max 10MB)
                      </p>
                    </div>
                  )}
                </div>
                
                {selectedAudioFile && !uploadedAudioUrl && (
                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={handleAudioFileUpload}
                      disabled={uploading || loading}
                    >
                      {uploading ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Audio
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Audio URL Input */}
                <div className="mt-4">
                  <label htmlFor="audioUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Or enter an audio URL
                  </label>
                  <input
                    type="text"
                    id="audioUrl"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/audio.mp3"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    disabled={loading || !!selectedAudioFile}
                  />
                </div>
                
                {/* Optional Prompt */}
                <div className="mt-4">
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                    Optional: Add a prompt to guide the video generation
                  </label>
                  <textarea
                    id="prompt"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="E.g., Create a nature scene to match this audio..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Generate Video
                </>
              )}
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {/* Result Video */}
          {resultVideo && (
            <div className="mt-8 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Video</h3>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video 
                  src={resultVideo} 
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={resultVideo}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Download
                </a>
                <a
                  href={resultVideo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Open in New Tab
                </a>
              </div>
            </div>
          )}
        </form>
      </div>
      
      {/* Video History */}
      <div className="mt-8">
        <VideoHistory />
      </div>
    </div>
  );
};

export default VideoEditor;