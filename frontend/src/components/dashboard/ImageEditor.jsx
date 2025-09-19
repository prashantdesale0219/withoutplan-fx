'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Upload, Image as ImageIcon, Loader, Download, ExternalLink, CreditCard, AlertTriangle, ArrowLeft, MapPin, Palette, Sparkles } from 'lucide-react';
import ImageHistory from './ImageHistory';
import api from '@/lib/api';
import Link from 'next/link';
import { getUserData, setUserData, getAuthToken } from '@/lib/cookieUtils';
import { getCardById } from '@/data/photoshootCards';

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
  const [credits, setCredits] = useState(null);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  
  useEffect(() => {
    // Load selected card ONLY from URL params (not localStorage for custom editor)
    const cardId = searchParams.get('card');
    const category = searchParams.get('category');
    const item = searchParams.get('item');
    const type = searchParams.get('type');
    
    if (cardId) {
      const card = getCardById(cardId);
      if (card) {
        setSelectedCard(card);
        // For card-based editing, set a minimal prompt (will be handled by workflow)
        setPrompt('Transform this image');
      }
    } else if (type === 'category' && category && item) {
       // Handle category-based selection
       const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
       const itemName = item.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
       
       // Generate specific prompt based on category and item
       let specificPrompt = '';
       
       if (category.includes('product-type')) {
         specificPrompt = `Transform this image to showcase ${itemName} in a professional product photography style`;
       } else if (category.includes('scene') || category.includes('location')) {
         specificPrompt = `Transform this image with ${itemName} setting and ambience`;
       } else if (category.includes('shot-style')) {
         specificPrompt = `Transform this image using ${itemName} photography style`;
       } else if (category.includes('mood') || category.includes('genre')) {
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
    if (credits !== null && credits <= 0) {
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
          resultImageUrl = data.data.resultUrls[0];
        }
        // If not, try to parse from resultJson
        else if (data.data && data.data.resultJson) {
          try {
            let resultJsonStr = typeof data.data.resultJson === 'string' 
              ? data.data.resultJson.replace(/`/g, '').trim() 
              : JSON.stringify(data.data.resultJson);
              
            resultJsonStr = resultJsonStr.replace(/"\s*`(https?:\/\/[^`]+)`\s*"/g, '"$1"');
            
            const resultJson = JSON.parse(resultJsonStr);
            
            if (resultJson.resultUrls && resultJson.resultUrls.length > 0) {
              let url = resultJson.resultUrls[0];
              url = url.replace(/`/g, '').trim();
              resultImageUrl = url;
            }
          } catch (err) {
            console.error('Error parsing resultJson:', err);
            
            if (typeof data.data.resultJson === 'string') {
              const urlRegex = /(https?:\/\/[^\s`"']+\.(jpg|jpeg|png|gif|webp))/i;
              const match = data.data.resultJson.match(urlRegex);
              if (match && match[0]) {
                resultImageUrl = match[0].trim();
              }
            }
          }
        }
        
        if (resultImageUrl) {
          setResultImage(resultImageUrl);
          toast.success('Image edited successfully!');
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
    <div className="max-w-6xl mx-auto p-6">
        {/* Selected Card Header */}
        {selectedCard && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/dashboard/apps')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Apps</span>
              </button>
            </div>
            
            <div className={`bg-gradient-to-r ${selectedCard.gradient} rounded-2xl p-6 text-white mb-6`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                  {selectedCard.icon}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{selectedCard.title}</h1>
                  <p className="text-white/90 mb-3">{selectedCard.description}</p>
                  {selectedCard.category && (
                    <div className="flex items-center gap-4 text-sm text-white/80">
                      <div className="flex items-center gap-1">
                        <Palette className="w-4 h-4" />
                        <span>{selectedCard.category}</span>
                      </div>
                    </div>
                  )}
                  {selectedCard.location && selectedCard.style && (
                    <div className="flex items-center gap-4 text-sm text-white/80">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedCard.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Palette className="w-4 h-4" />
                        <span>{selectedCard.style}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Back button for custom editor */}
          {!selectedCard && (
            <div className="mb-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </button>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">
                  {selectedCard ? `Upload Image for ${selectedCard.title}` : 'Custom AI Image Editor'}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {selectedCard 
                    ? `Upload your image and we'll transform it with ${selectedCard.title} ${selectedCard.category ? `(${selectedCard.category})` : ''} style.`
                    : 'Upload your image and describe how you want to transform it with custom prompts'
                  }
                </p>
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
              
              {/* Upload Area */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={handleUploadAreaClick}
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedFile ? selectedFile.name : 'Upload Image or Drag & Drop'}
                  </h3>
                  <p className="text-gray-500 text-sm">
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
                  className="w-full mb-4 bg-gray-900 hover:bg-gray-800 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                disabled={loading || uploading}
              />
            </div>
            
            {/* Prompt Input - Only show for custom editing (when no card is selected) */}
            {!selectedCard && (
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Transformation Prompt
                </label>
                <input
                  type="text"
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe how you want to transform your image..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  disabled={loading}
                />
                <p className="text-sm text-gray-500 mt-1">Example: "Make it futuristic", "Add sunset lighting", "Convert to cartoon style"</p>
              </div>
            )}
            
            {/* Card Info - Show when card is selected */}
            {selectedCard && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedCard.gradient} flex items-center justify-center text-white text-sm`}>
                    {selectedCard.icon}
                  </div>
                  <div>
                  <h3 className="font-semibold text-gray-900">{selectedCard.title}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedCard.category || (selectedCard.style && selectedCard.location ? `${selectedCard.style} • ${selectedCard.location}` : 'AI-powered transformation')}
                  </p>
                </div>
                </div>
                <div className="bg-white rounded-md p-3 border border-gray-200">
                  <p className="text-sm text-gray-700">
                    <strong>✨ Pre-configured Workflow:</strong> This photoshoot style has a specialized AI workflow with pre-set prompts and styling. Just upload your image and the magic will happen automatically!
                  </p>
                  <div className="mt-2 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block">
                    🎯 No custom prompt needed - Workflow handles everything
                  </div>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading || uploading || (!uploadedImageUrl && !imageUrl.trim())}
              className={`w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 ${(loading || uploading || (!uploadedImageUrl && !imageUrl.trim())) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin w-5 h-5" />
                  Generating...
                </>
              ) : uploading ? (
                <>
                  <Loader className="animate-spin w-5 h-5" />
                  Uploading...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {selectedCard ? `Transform with ${selectedCard.title}` : 'Generate Image'}
                </>
              )}
            </button>
            <p className="text-center text-gray-500 text-sm mt-2">
              This will use 1 credit
            </p>
          </form>
          
          {/* Preview Area */}
          {(previewUrl || uploadedImageUrl || resultImage) && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {resultImage ? 'Generated Result' : 'Preview'}
              </h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 min-h-[400px] flex items-center justify-center">
                <img
                  src={resultImage || uploadedImageUrl || previewUrl}
                  alt={resultImage ? 'Generated result' : 'Preview'}
                  className="max-w-full max-h-[500px] object-contain rounded-lg shadow-sm"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/images/image-error.png';
                  }}
                />
              </div>
              
              {resultImage && (
                <div className="mt-4 flex gap-3">
                  <a 
                    href={resultImage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300"
                  >
                    <ExternalLink className="w-4 h-4" />
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
                          link.download = `generated-image-${Date.now()}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          
                          URL.revokeObjectURL(blobUrl);
                          toast.success('Image download started');
                        } catch (err) {
                          console.error('Error downloading image:', err);
                          toast.error('Failed to download image');
                        }
                      };
                      downloadImage();
                    }}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">Error</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Image History Section */}
        <div className="mt-12">
          <ImageHistory />
        </div>
    </div>
  );
};

export default ImageEditor;