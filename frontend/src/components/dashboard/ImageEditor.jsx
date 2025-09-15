'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Upload, Image as ImageIcon, Loader, Download, ExternalLink, CreditCard, AlertTriangle } from 'lucide-react';
import ImageHistory from './ImageHistory';
import api from '@/lib/api';
import Link from 'next/link';
import { getUserData, setUserData } from '@/lib/cookieUtils';

const ImageEditor = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [credits, setCredits] = useState(null);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  
  useEffect(() => {
    // Get user data and check credits
    const userData = getUserData();
    if (userData && userData.credits !== undefined) {
      // Set credits from user data
      setCredits(userData.credits.balance);
      if (userData.credits.balance <= 3) {
        setShowCreditWarning(true);
      }
    }
    
    // Add event listener for storage events to update credits in real-time
    const handleStorageChange = () => {
      const updatedUserData = getUserData();
      if (updatedUserData && updatedUserData.credits !== undefined) {
        console.log('Storage changed, updating credits:', updatedUserData.credits.balance);
        setCredits(updatedUserData.credits.balance);
        if (updatedUserData.credits.balance <= 3) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
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
        image_url: imageUrl.trim()
      });
      
      // Use the frontend API route instead of directly calling the backend
      const response = await fetch('/api/image-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image_url: imageUrl.trim()
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
        setCredits(newCredits);
        if (newCredits <= 3) {
          setShowCreditWarning(true);
        } else {
          setShowCreditWarning(false);
        }
        
        // Update user data in cookie with new credit information
        const userData = getUserData();
        if (userData) {
          // Make sure we update the credits correctly
          userData.credits.balance = newCredits;
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
            // Try standard URL regex as fallback
            const urlRegex = /(https?:\/\/[^\s`"']+\.(jpg|jpeg|png|gif|webp))/i;
            const match = responseStr.match(urlRegex);
            if (match && match[0]) {
              resultImageUrl = match[0].trim();
              console.log('Extracted URL from full response using regex:', resultImageUrl);
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
          
          // Save to history in localStorage with user-specific key
          const timestamp = new Date().toISOString();
          const historyItem = {
            id: `img_${Date.now()}`,
            originalUrl: imageUrl.trim(),
            resultUrl: resultImageUrl,
            prompt: prompt.trim(),
            timestamp: timestamp,
            taskId: response.data.data.taskId || null
          };
          
          // Get user ID from user data
          const userData = getUserData();
          const userId = userData?._id || 'guest';
          const historyKey = `imageEditHistory_${userId}`;
          
          console.log('Saving image to history for user:', userId);
          
          // Get existing history or initialize empty array
          const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
          
          // Add new item to the beginning of the array
          const updatedHistory = [historyItem, ...existingHistory].slice(0, 50); // Keep only last 50 items
          
          // Save back to localStorage with user-specific key
          localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
          
          // Dispatch storage event to notify other components
          const storageEvent = new Event('storage');
          window.dispatchEvent(storageEvent);
          
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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">AI Image Editor</h2>
        
        {credits !== null && (
          <div className="flex items-center gap-2 bg-[#f9f7f5] px-3 py-1 rounded-full">
            <CreditCard className="w-4 h-4 text-[var(--coffee)]" />
            <span className="text-sm font-medium">{credits} {credits === 1 ? 'credit' : 'credits'} remaining</span>
          </div>
        )}
      </div>
      
      {showCreditWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Low Credits Warning</h3>
              <p className="text-sm text-yellow-700 mb-2">
                You're running low on credits. Upgrade your plan to continue generating images without interruption.
              </p>
              <Link href="/pricing">
                <button className="bg-[var(--coffee)] text-white text-sm px-3 py-1 rounded hover:bg-[#3a1e12] transition-colors">
                  Upgrade Plan
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            type="text"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
        
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
            Edit Prompt
          </label>
          <input
            type="text"
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Make it futuristic"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <>
              <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              Processing...
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
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {resultImage && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edited Image</h3>
          <div className="border border-gray-200 rounded-md overflow-hidden">
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
          <div className="mt-4 flex space-x-3">
            <a 
              href={resultImage} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
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
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">How it works</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>Enter the URL of the image you want to edit</li>
          <li>Write a prompt describing how you want to edit the image</li>
          <li>Click "Edit Image" and wait for the AI to process your request</li>
          <li>View and download your edited image</li>
          <li>All your edited images are saved in the history below</li>
        </ol>
      </div>
      
      {/* Image History Section */}
      <div className="mt-12">
        <ImageHistory />
      </div>
    </div>
  );
};

export default ImageEditor;