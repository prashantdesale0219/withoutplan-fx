'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Upload, Image as ImageIcon, Loader, Download, ExternalLink, CreditCard, AlertTriangle, ArrowLeft, MapPin, Palette, Sparkles } from 'lucide-react';
import ImageHistory from './ImageHistory';
import api from '@/lib/api';
import Link from 'next/link';
import { getUserData, setUserData, getAuthToken } from '@/lib/cookieUtils';
import { useCredits } from '../../contexts/CreditContext';
const ImageEditor = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const { credits, loading: creditsLoading, hasEnoughCredits, shouldShowWarning, deductCredits, updateCredits } = useCredits();
  
  useEffect(() => {
    // Load selected card ONLY from URL params (not localStorage for custom editor)
    const cardId = searchParams.get('card');
    const category = searchParams.get('category');
    const item = searchParams.get('item');
    const type = searchParams.get('type');
    
    if (type === 'category' && category && item) {
       // Handle category-based selection
       const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
       const itemName = item.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
       
       // Generate specific prompt based on category and item
       let specificPrompt = '';
       
       if (category.includes('product-type')) {
         specificPrompt = `Transform this image to showcase ${itemName} in a professional product photography style`;
       } else if (category.includes('scene-loc') || category.includes('scene') || category.includes('location')) {
         specificPrompt = `Transform this image with ${itemName} setting and ambience`;
       } else if (category.includes('shot-style')) {
         specificPrompt = `Transform this image using ${itemName} photography style`;
       } else if (category.includes('mood-genre') || category.includes('mood') || category.includes('genre')) {
         specificPrompt = `Transform this image with ${itemName} mood and aesthetic`;
       } else if (category.includes('target-channel')) {
         specificPrompt = `Transform this image optimized for ${itemName} platform`;
       } else {
         specificPrompt = `Transform this image with ${itemName} style`;
       }
       
       const categoryCard = {
         id: `${category}-${item}`,
         title: itemName,
         description: `Transform your image with ${itemName} style`,
         category: categoryName,
         gradient: 'from-purple-400 to-pink-500',
         icon: '✨',
         specificPrompt: specificPrompt
       };
       setSelectedCard(categoryCard);
       setPrompt(specificPrompt);
    } else {
      // If no cardId or category in URL, this is custom editor - don't load any card
      // Clear any stored card data to ensure clean custom editing
      setSelectedCard(null);
      setPrompt('');
      localStorage.removeItem('selectedPhotoshootCard');
    }

    // Check credit warning using context
    if (shouldShowWarning()) {
      setShowCreditWarning(true);
    }
  }, []);

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
    
    // Validate inputs - prompt is only required for custom editing (no card selected)
    if (!selectedCard && !prompt.trim()) {
      toast.error('Please enter a prompt for custom editing');
      return;
    }
    
    // Check if we have either uploaded image or URL
    let finalImageUrl = imageUrl.trim();
    
    // If a file is selected but not uploaded yet, upload it first
    if (selectedFile && !uploadedImageUrl) {
      toast.error('Please click the "Upload Image" button first before editing');
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
    if (!hasEnoughCredits()) {
      toast.error('You have no credits left. Please upgrade your plan to continue.');
      setError('Insufficient credits. Please upgrade your plan to continue generating images.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResultImage(null);
    
    try {
      const token = getAuthToken();
      const requestBody = {
        prompt: prompt.trim(),
        image_url: finalImageUrl
      };
      
      // Add cardId if a card is selected
      if (selectedCard) {
        requestBody.cardId = selectedCard.id;
        
        // Add category and item info for category-based cards
        if (selectedCard.id.includes('-')) {
          const [categoryPart, itemPart] = selectedCard.id.split('-', 2);
          requestBody.category = categoryPart;
          requestBody.item = itemPart;
        }
      }
      
      const response = await fetch('/api/image-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit image');
      }
      
      if (data && data.status === 'success') {
        // Parse resultJson to get resultUrls if available
        let resultImageUrl = null;
        
        // First check if resultUrls is directly available in the response
        if (data.data && data.data.resultUrls && data.data.resultUrls.length > 0) {
          resultImageUrl = data.data.resultUrls[0].replace(/`/g, '').trim();
        }
        // If not, try to parse from resultJson
        else if (data.data && data.data.resultJson) {
          try {
            let resultJsonStr = typeof data.data.resultJson === 'string' 
              ? data.data.resultJson.replace(/`/g, '').trim() 
              : JSON.stringify(data.data.resultJson);
              
            // Clean backticks from URLs in JSON string
            resultJsonStr = resultJsonStr.replace(/"\s*`(https?:\/\/[^`]+)`\s*"/g, '"$1"');
            resultJsonStr = resultJsonStr.replace(/\[\s*"\s*`(https?:\/\/[^`]+)`\s*"\s*\]/g, '["$1"]');
            resultJsonStr = resultJsonStr.replace(/\[\s*`(https?:\/\/[^`]+)`\s*\]/g, '["$1"]');
            
            
            
            const resultJson = JSON.parse(resultJsonStr);
            
            if (resultJson.resultUrls && resultJson.resultUrls.length > 0) {
              let url = resultJson.resultUrls[0];
              url = url.replace(/`/g, '').trim();
              resultImageUrl = url;
            }
          } catch (err) {
            console.error('Error parsing resultJson:', err);
            
            if (typeof data.data.resultJson === 'string') {
              // Try to extract URL with backticks
              const backtickUrlRegex = /`(https?:\/\/[^`]+)`/i;
              const backtickMatch = data.data.resultJson.match(backtickUrlRegex);
              if (backtickMatch && backtickMatch[1]) {
                resultImageUrl = backtickMatch[1].trim();
              } else {
                // Try regular URL extraction
                const urlRegex = /(https?:\/\/[^\s`"']+\.(jpg|jpeg|png|gif|webp))/i;
                const match = data.data.resultJson.match(urlRegex);
                if (match && match[0]) {
                  resultImageUrl = match[0].trim();
                }
              }
            }
          }
        }
        
        if (resultImageUrl) {
          setResultImage(resultImageUrl);
          toast.success('Image edited successfully!');
          
          // Update credits after successful generation
          if (data.credits && data.credits.remaining !== undefined) {
            updateCredits(data.credits.remaining);
          } else {
            // Fallback: deduct 1 credit if no specific credit info in response
            deductCredits(1);
          }
        } else if (data.data && data.data.imageUrl) {
          // Fallback to imageUrl if available directly in the response
          setResultImage(data.data.imageUrl);
          toast.success('Image edited successfully!');
          
          // Update credits
          if (data.credits && data.credits.remaining !== undefined) {
            updateCredits(data.credits.remaining);
          } else {
            deductCredits(1);
          }
        } else if (data.data && data.data.url) {
          // Another fallback to url field if available
          setResultImage(data.data.url);
          toast.success('Image edited successfully!');
          
          // Update credits
          if (data.credits && data.credits.remaining !== undefined) {
            updateCredits(data.credits.remaining);
          } else {
            deductCredits(1);
          }
        } else {
          throw new Error('No image URL in response');
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error editing image:', err);
      const errorMessage = err.message || 'Failed to edit image';
      setError(errorMessage);
      toast.error(`Failed to edit image: ${errorMessage}`);
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
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {selectedCard ? `${selectedCard.title} Editor` : 'AI Image Editor'}
              </h1>
            </div>
          </div>
          
          
        </div>
        
        {showCreditWarning && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 text-sm">Low Credits Warning</h3>
              <p className="text-xs text-amber-700 mt-1">
                You're running low on credits. Each image generation uses 1 credit.
                <Link href="/dashboard/billing" className="font-medium text-amber-800 hover:text-amber-900 ml-1">
                  Upgrade your plan
                </Link> to continue generating images.
              </p>
            </div>
          </div>
        )}

        {/* Selected Card Info Banner */}
        {selectedCard && (
          <div className={`mt-4 bg-gradient-to-r ${selectedCard.gradient} rounded-lg p-4 text-white`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-lg">
                {selectedCard.icon}
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-white">{selectedCard.title}</h2>
                <p className="text-white/90 text-sm">{selectedCard.description}</p>
                {selectedCard.category && (
                  <div className="flex items-center gap-1 text-xs text-white/80 mt-1">
                    <Palette className="w-3 h-3" />
                    <span>{selectedCard.category}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input/Upload */}
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedCard ? `Upload Image for ${selectedCard.title}` : 'Upload & Transform'}
            </h2>
            <p className="text-sm text-gray-600">
              {selectedCard 
                ? `Upload your image and we'll transform it with ${selectedCard.title} style.`
                : 'Upload your image and describe how you want to transform it'
              }
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-3">
                  Upload Image or Enter URL
                </label>
                
                {/* Upload Area */}
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={handleUploadAreaClick}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {selectedFile ? selectedFile.name : 'Upload Image or Drag & Drop'}
                    </h3>
                    <p className="text-gray-500 text-xs">
                      PNG, JPG, WebP (max 10MB)
                    </p>
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
                </div>
                
                {selectedFile && !uploadedImageUrl && (
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={uploading || loading}
                    className="w-full mb-4 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader className="animate-spin w-4 h-4" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Image
                      </>
                    )}
                  </button>
                )}
                
                <div className="text-center text-sm text-gray-500 mb-4">or</div>
                
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
                  placeholder="Or paste image URL here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={loading || uploading}
                />
              </div>
              
              {/* Prompt Input - Only show for custom editing */}
              {!selectedCard && (
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-800 mb-3">
                    Transformation Prompt
                  </label>
                  <textarea
                    id="prompt"
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe how you want to transform your image..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500 resize-none"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    💡 Tip: Be specific about the style, mood, or changes you want
                  </p>
                </div>
              )}

              {/* Card-specific prompt info */}
              {selectedCard && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        AI Workflow Active
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        No custom prompt needed - Our AI will automatically apply {selectedCard.title} transformation
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || uploading || (!uploadedImageUrl && !imageUrl.trim())}
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 mr-3 animate-spin" />
                      Generating...
                    </>
                  ) : uploading ? (
                    <>
                      <Loader className="w-5 h-5 mr-3 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      {selectedCard ? `Transform with ${selectedCard.title}` : 'Generate Image'}
                    </>
                  )}
                </button>
                <p className="text-center text-gray-500 text-sm mt-2">
                  This will use 1 credit
                </p>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-800 text-sm">Error</h3>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Panel - Preview/Result */}
        <div className="w-1/2 bg-gray-50 flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {resultImage ? 'Generated Result' : 'Preview'}
            </h2>
            <p className="text-sm text-gray-600">
              {resultImage ? 'Your AI-generated image' : 'Upload an image to see preview and results here'}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Generating your image...</p>
                  <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
                </div>
              </div>
            )}
            
            {!loading && !previewUrl && !uploadedImageUrl && !resultImage && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No image uploaded yet</h3>
                  <p className="text-gray-500 text-sm">
                    Upload an image or enter an image URL in the left panel to get started.
                  </p>
                </div>
              </div>
            )}
            
            {(previewUrl || uploadedImageUrl || resultImage) && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={resultImage || uploadedImageUrl || previewUrl}
                      alt={resultImage ? 'Generated result' : 'Preview'}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/images/image-error.png';
                      }}
                    />
                  </div>
                </div>
                
                {resultImage && (
                  <div className="flex flex-wrap gap-3">
                    <a 
                      href={resultImage} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Full Size
                    </a>
                    <button
                      onClick={() => {
                        const downloadImage = async () => {
                          try {
                            const response = await fetch(resultImage);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `generated-image-${Date.now()}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                            toast.success('Image download started!');
                          } catch (error) {
                            console.error('Download error:', error);
                            toast.error('Download failed. Please try the direct link.');
                          }
                        };
                        downloadImage();
                      }}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                  </div>
                )}
                
                {resultImage && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✅ Image generated successfully! You can view it above, download it, or open it in full size.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
