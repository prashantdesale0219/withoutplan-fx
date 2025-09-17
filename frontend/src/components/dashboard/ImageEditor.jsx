'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Upload, Image as ImageIcon, Loader, Download, ExternalLink, CreditCard, AlertTriangle } from 'lucide-react';
import ImageHistory from './ImageHistory';
import api from '@/lib/api';
import Link from 'next/link';
import { getUserData, setUserData, getAuthToken } from '@/lib/cookieUtils';

const ImageEditor = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [resultImage, setResultImage] = useState(null);
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
    
    // Add event listener for storage events to update credits in real-time
    const handleStorageChange = () => {
      const updatedUserData = getUserData();
      if (updatedUserData && updatedUserData.credits !== undefined) {
        // Handle both object and number formats for credits
        let creditsBalance;
        if (typeof updatedUserData.credits === 'object' && updatedUserData.credits.balance !== undefined) {
          creditsBalance = updatedUserData.credits.balance;
        } else if (typeof updatedUserData.credits === 'number') {
          creditsBalance = updatedUserData.credits;
        } else {
          creditsBalance = 0;
        }
        
        console.log('Storage changed, updating credits:', creditsBalance);
        // Ensure we only set a number, not an object
        setCredits(typeof creditsBalance === 'number' ? creditsBalance : 0);
        if (creditsBalance <= 3) {
          setShowCreditWarning(true);
        } else {
          setShowCreditWarning(false);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Update credits display whenever they change
  useEffect(() => {
    console.log('Credits updated:', credits);
    
    // Update credit warning based on current credits
    if (credits !== null) {
      if (credits <= 3) {
        setShowCreditWarning(true);
      } else {
        setShowCreditWarning(false);
      }
    }
  }, [credits]);

  // Handle file selection
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
      
      console.log('File selected:', file.name, file.type, file.size);
    }
  };

  // Handle upload area click
  const handleUploadAreaClick = () => {
    if (loading || uploading) return;
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.click();
    }
  };

  // Handle file upload
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    // Debug logging
    console.log('Submit validation:', {
      selectedFile: !!selectedFile,
      uploadedImageUrl: !!uploadedImageUrl,
      imageUrl: !!imageUrl.trim(),
      previewUrl: !!previewUrl
    });
    
    // Check if we have either uploaded image or URL
    let finalImageUrl = imageUrl.trim();
    
    // If a file is selected but not uploaded yet, upload it first
    if (selectedFile && !uploadedImageUrl) {
      toast.error('Please click the "Upload Image" button first before editing');
      return;
    }
    
    // If there's a preview URL but no uploaded URL, user needs to upload
    if (previewUrl && !uploadedImageUrl && !imageUrl.trim()) {
      toast.error('Please click the "Upload Image" button to upload your selected file');
      return;
    }
    
    // Use uploaded URL if available, otherwise use manual URL input
    if (uploadedImageUrl) {
      finalImageUrl = uploadedImageUrl;
    }
    
    if (!finalImageUrl) {
      toast.error('Please upload an image or enter an image URL');
      return;
    }
    
    // Check if user has enough credits
    if (credits !== null && credits <= 0) {
      toast.error('You have no credits left. Please upgrade your plan to continue.');
      setError('Insufficient credits. Please upgrade your plan to continue generating images.');
      return;
    }
    
    // Log current credits before making the request
    console.log('Current credits before request:', credits);
    
    setLoading(true);
    setError(null);
    setResultImage(null);
    
    try {
      console.log('Sending image edit request with:', {
        prompt: prompt.trim(),
        image_url: finalImageUrl
      });
      
      // Use the frontend API route instead of directly calling the backend
      const token = getAuthToken();
      const response = await fetch('/api/image-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image_url: finalImageUrl
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit image');
      }
      
      // Set response data
      response.data = data;
      
      console.log('Image edit response:', response.data);
      
      // Update credits information if available in response
      if (response.data.credits) {
        const newCredits = response.data.credits.remaining;
        console.log('New credits from response:', newCredits);
        // Ensure we only set a number, not an object
        setCredits(typeof newCredits === 'number' ? newCredits : 0);
        if (newCredits <= 3) {
          setShowCreditWarning(true);
        } else {
          setShowCreditWarning(false);
        }
        
        // Update user data in cookie with new credit information
        const userData = getUserData();
        if (userData) {
          // Make sure we update the credits correctly - handle both object and number formats
          if (typeof userData.credits === 'object') {
            userData.credits.balance = newCredits;
          } else {
            // If credits is a number, convert it to object format
            userData.credits = {
              balance: newCredits,
              totalUsed: userData.credits || 0,
              imagesGenerated: userData.imagesGenerated || 0
            };
          }
          
          setUserData(userData);
          
          // Also update localStorage directly to ensure it's updated
          localStorage.setItem('user_data', JSON.stringify(userData));
          console.log('Updated user data in cookie and localStorage with new credits:', userData);
          
          // Dispatch a storage event to notify other components
          const storageEvent = new Event('storage');
          window.dispatchEvent(storageEvent);
        }
      }
      
      // Direct check for the specific format shown in user's input
      if (response.data && response.data.data && response.data.data.resultJson) {
        console.log('Checking for specific format in resultJson:', response.data.data.resultJson);
        
        // Handle the specific format shown in user's input
        try {
          const resultJsonStr = response.data.data.resultJson;
          // Check if it matches the format in user's input
          if (typeof resultJsonStr === 'string' && resultJsonStr.includes('resultUrls')) {
            // Extract URL from the format: '{"resultUrls":[" `https://tempfile.aiquickdraw.com/...` "]}'            
            const urlMatch = resultJsonStr.match(/`(https?:\/\/[^`]+)`/);
            if (urlMatch && urlMatch[1]) {
              console.log('Found URL in specific format:', urlMatch[1]);
              // Store this for later use if needed
              response.data.extractedUrl = urlMatch[1].trim();
            }
          }
        } catch (err) {
          console.error('Error checking specific format:', err);
        }
      }
      
      if (response.data && response.data.status === 'success') {
        // Parse resultJson to get resultUrls if available
        let resultImageUrl = null;
        
        console.log('Full response data:', response.data);
        
        // First check if resultUrls is directly available in the response
        if (response.data.data && response.data.data.resultUrls && response.data.data.resultUrls.length > 0) {
          resultImageUrl = response.data.data.resultUrls[0];
          console.log('Found result image URL directly in resultUrls:', resultImageUrl);
        }
        // If not, try to parse from resultJson
        else if (response.data.data && response.data.data.resultJson) {
          try {
            // Check if resultJson is already an object or needs parsing
            let resultJsonStr = typeof response.data.data.resultJson === 'string' 
              ? response.data.data.resultJson.replace(/`/g, '').trim() 
              : JSON.stringify(response.data.data.resultJson);
              
            // Handle the case where resultUrls might contain backticks
            resultJsonStr = resultJsonStr.replace(/"\s*`(https?:\/\/[^`]+)`\s*"/g, '"$1"');
            
            const resultJson = JSON.parse(resultJsonStr);
              
            console.log('Parsed resultJson:', resultJson);
            
            if (resultJson.resultUrls && resultJson.resultUrls.length > 0) {
              // Clean up the URL (remove any backticks or extra spaces)
              let url = resultJson.resultUrls[0];
              // Remove backticks if they exist
              url = url.replace(/`/g, '').trim();
              resultImageUrl = url;
              console.log('Found result image URL from resultUrls:', resultImageUrl);
            }
          } catch (err) {
            console.error('Error parsing resultJson:', err);
            
            // Try to extract URL using regex if JSON parsing fails
            if (typeof response.data.data.resultJson === 'string') {
              const urlRegex = /(https?:\/\/[^\s`"']+\.(jpg|jpeg|png|gif|webp))/i;
              const match = response.data.data.resultJson.match(urlRegex);
              if (match && match[0]) {
                resultImageUrl = match[0].trim();
                console.log('Extracted URL using regex:', resultImageUrl);
              }
            }
          }
        }
        
        // Fallback to other possible URL formats if resultJson parsing failed
        if (!resultImageUrl) {
          // Check if data.data.resultJson contains a string with resultUrls
          if (response.data.data && typeof response.data.data.resultJson === 'string') {
            // Try to extract resultUrls directly from the string
            const resultUrlsMatch = response.data.data.resultJson.match(/"resultUrls"\s*:\s*\[\s*"\s*`?(https?:\/\/[^`"\s]+)`?\s*"\s*\]/i);
            if (resultUrlsMatch && resultUrlsMatch[1]) {
              resultImageUrl = resultUrlsMatch[1].trim();
              console.log('Extracted URL directly from resultJson string:', resultImageUrl);
            }
          }
          
          // If still no URL, try other properties
          if (!resultImageUrl) {
            resultImageUrl = response.data.data.image_url || 
                            response.data.data.url ||
                            (typeof response.data.data === 'string' ? response.data.data : null);
                            
            if (resultImageUrl) {
              console.log('Found result image URL from fallback:', resultImageUrl);
            }
          }
        }
        
        // Final regex fallback for any URL in the response
        if (!resultImageUrl && typeof response.data.data === 'object') {
          const responseStr = JSON.stringify(response.data.data);
          
          // First try to find URLs with backticks
          const backtickUrlRegex = /`(https?:\/\/[^`]+)`/g;
          const backtickMatches = responseStr.matchAll(backtickUrlRegex);
          const backtickMatchArray = Array.from(backtickMatches);
          
          if (backtickMatchArray.length > 0) {
            resultImageUrl = backtickMatchArray[0][1].trim();
            console.log('Extracted URL with backticks from response:', resultImageUrl);
          } else {
            // Try standard URL regex as fallback - more comprehensive pattern
            const urlRegex = /(https?:\/\/[^\s`"'\]\}]+\.(jpg|jpeg|png|gif|webp|svg))/i;
            const match = responseStr.match(urlRegex);
            if (match && match[0]) {
              resultImageUrl = match[0].trim();
              console.log('Extracted URL from full response using regex:', resultImageUrl);
            } else {
              // Try even more general URL pattern
              const generalUrlRegex = /(https?:\/\/[^\s`"'\]\}]+)/i;
              const generalMatch = responseStr.match(generalUrlRegex);
              if (generalMatch && generalMatch[0]) {
                const potentialUrl = generalMatch[0].trim();
                // Check if it looks like an image URL or contains image-related keywords
                if (potentialUrl.includes('image') || potentialUrl.includes('photo') || 
                    potentialUrl.includes('pic') || potentialUrl.includes('temp') ||
                    potentialUrl.includes('result') || potentialUrl.includes('generated')) {
                  resultImageUrl = potentialUrl;
                  console.log('Extracted general URL from response:', resultImageUrl);
                }
              }
            }
          }
        }
                        
        // Use extractedUrl if available (from the specific format check)
        if (response.data.extractedUrl) {
          resultImageUrl = response.data.extractedUrl;
          console.log('Using URL from specific format extraction:', resultImageUrl);
        }
        
        if (resultImageUrl) {
          setResultImage(resultImageUrl);
          
          // Image is automatically saved to database by backend
          // Dispatch custom event to notify ImageHistory component to refresh
          const imageGeneratedEvent = new CustomEvent('imageGenerated');
          window.dispatchEvent(imageGeneratedEvent);
          
          toast.success('Image edited successfully!');
        } else {
          console.error('No image URL in response:', response.data);
          throw new Error('No image URL in response');
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error editing image:', err);
      console.error('Error details:', err.response?.data);
      
      // Extract the most useful error message
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.message ||
                          err.message || 
                          'Failed to edit image';
                          
      setError(errorMessage);
      toast.error(`Failed to edit image: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black">AI Image Editor</h2>
            <p className="text-gray-600 text-sm mt-1">Transform your images with AI-powered editing</p>
          </div>
        </div>
        
        {credits !== null && (
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
            <CreditCard className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{credits} {credits === 1 ? 'credit' : 'credits'} remaining</span>
          </div>
        )}
      </div>
      
      {showCreditWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Low Credits Warning</h3>
              <p className="text-sm text-yellow-700 mb-2">
                You're running low on credits. Upgrade your plan to continue generating images without interruption.
              </p>
              <Link href="/pricing">
                <button className="bg-gray-900 hover:bg-gray-800 text-white text-sm px-3 py-1 rounded transition-colors">
                  Upgrade Plan
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Upload Image or Enter URL
          </label>
          
          {/* File Upload Section */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={handleUploadAreaClick}
          >
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <span className="mt-2 block text-sm font-medium text-gray-900 hover:text-gray-700">
                  {selectedFile ? selectedFile.name : 'Click to choose an image file'}
                </span>
                <p className="mt-1 text-xs text-gray-500">
                  PNG, JPG, WebP up to 10MB
                </p>
              </div>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={loading || uploading}
              />
            </div>
              
              {selectedFile && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={uploading || loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="-ml-1 mr-2 h-4 w-4" />
                        Upload Image
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          
          {/* Image Preview */}
          {(previewUrl || uploadedImageUrl) && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {uploadedImageUrl ? 'Uploaded Image:' : 'Preview:'}
              </p>
              <img
                src={uploadedImageUrl || previewUrl}
                alt={uploadedImageUrl ? 'Uploaded' : 'Preview'}
                className="max-w-xs max-h-48 object-contain border border-gray-200 rounded"
              />
              {uploadedImageUrl && (
                <p className="text-xs text-green-600 mt-1">✓ Ready for editing</p>
              )}
            </div>
          )}
          
          {/* OR Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>
          
          {/* URL Input */}
          <div className="mt-4">
            <input
              type="url"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                if (e.target.value.trim()) {
                  setSelectedFile(null);
                  setUploadedImageUrl('');
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl('');
                  }
                }
              }}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || uploading}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Edit Prompt
          </label>
          <input
            type="text"
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe how you want to transform your image..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-1">Example: "Make it futuristic", "Add sunset lighting", "Convert to cartoon style"</p>
        </div>
        
        <button
          type="submit"
          disabled={loading || uploading}
          className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${(loading || uploading) ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <>
              <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              Processing...
            </>
          ) : uploading ? (
            <>
              <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              Uploading...
            </>
          ) : (
            <>
              <ImageIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Edit Image
            </>
          )}
        </button>
      </form>
      
      {error && (
        <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/60 rounded-xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-red-900 text-lg mb-1">Error</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {resultImage && (
        <div className="mt-8 bg-white rounded-xl border border-gray-200/60 p-6 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            Your Transformed Image
          </h3>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <img 
              src={resultImage} 
              alt="Edited result" 
              className="w-full h-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/images/image-error.png';
              }}
            />
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a 
              href={resultImage} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Open Full Size
            </a>
            <button
              onClick={() => {
                const downloadImage = async () => {
                  try {
                    const response = await fetch(resultImage);
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = `edited-image-${Date.now()}.png`;
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
                downloadImage();
              }}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-sm font-semibold rounded-xl shadow-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Image
            </button>
          </div>
        </div>
      )}
      
      
      
      {/* Image History Section */}
      <div className="mt-12">
        <ImageHistory />
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-coffee rounded-lg flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          How it works
        </h3>
        <div className="grid gap-4">
          {[
            { step: 1, title: "Upload or Enter URL", desc: "Upload an image file from your device or enter an image URL" },
            { step: 2, title: "Describe Your Vision", desc: "Write a prompt describing how you want to edit the image" },
            { step: 3, title: "AI Processing", desc: "Click \"Edit Image\" and wait for the AI to process your request" },
            { step: 4, title: "Download & Enjoy", desc: "View and download your edited image" },
            { step: 5, title: "History Saved", desc: "All your edited images are saved in the history below" }
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-coffee rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                {item.step}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;