const axios = require('axios');
const User = require('../models/User');
require('dotenv').config();

/**
 * @desc    Generate video from text
 * @route   POST /api/video-edit/text-to-video
 * @access  Private
 */
exports.textToVideo = async (req, res) => {
  const { prompt } = req.body;
  
  // Check if user has enough credits
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      status: 'fail',
      error: 'User not found'
    });
  }
  
  // Check if user has selected a plan
  if (!user.plan) {
    return res.status(403).json({
      status: 'fail',
      error: 'Please select a plan to generate videos',
      redirectTo: '/pricing'
    });
  }
  
  // Check if user has enough credits
  if (user.credits.balance <= 0) {
    return res.status(403).json({
      status: 'fail',
      error: 'You have run out of credits. Please upgrade your plan.',
      redirectTo: '/pricing'
    });
  }

  // Validate input
  if (!prompt) {
    return res.status(400).json({ 
      status: 'fail',
      error: 'prompt is required' 
    });
  }

  try {
    // Get the webhook URL
    const n8nWebhookUrl = process.env.WEBHOOK_TEXT_TO_VIDEO;
    
    if (!n8nWebhookUrl) {
      return res.status(500).json({ 
        status: 'fail',
        error: 'Text to video webhook URL is not configured' 
      });
    }
    
    // Validate webhook URL format
    try {
      new URL(n8nWebhookUrl);
    } catch (e) {
      console.error('Invalid text to video webhook URL format:', n8nWebhookUrl);
      return res.status(500).json({ 
        status: 'fail',
        error: 'Invalid text to video webhook URL format' 
      });
    }

    // Prepare webhook payload
    const webhookPayload = {
      prompt,
      webhookType: 'text-to-video',
      userId: req.user.id,
      userEmail: user.email
    };
    
    // Send request to n8n webhook
    console.log(`Sending request to text-to-video webhook: ${n8nWebhookUrl}`);
    console.log('Request payload:', webhookPayload);
    
    const response = await axios.post(n8nWebhookUrl, webhookPayload, {
      timeout: 180000, // wait up to 180 seconds for n8n response (videos take longer)
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('N8N webhook response status:', response.status);
    console.log('N8N webhook response headers:', response.headers);
    
    // Handle response data safely
    let responseData;
    try {
      if (typeof response.data === 'string') {
        // Check if response starts with "Internal S" (likely "Internal Server Error")
        if (response.data.startsWith('Internal S')) {
          console.error('Received Internal Server Error from webhook');
          responseData = { 
            error: 'Internal Server Error from webhook',
            message: response.data
          };
        } else {
          // Try to parse as JSON, but handle any parsing errors
          try {
            responseData = JSON.parse(response.data);
          } catch (jsonError) {
            console.error('Failed to parse response as JSON:', jsonError);
            responseData = { 
              error: 'Invalid JSON response',
              rawResponse: response.data.substring(0, 200) // Include part of the raw response for debugging
            };
          }
        }
      } else {
        responseData = response.data;
      }
      console.log('N8N webhook response data:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.error('Error handling webhook response:', parseError);
      responseData = { 
        error: 'Invalid response format',
        message: parseError.message
      };
    }
    
    // Replace response.data with our safely parsed data
    response.data = responseData;
    
    // Check if response data is valid
    if (!response.data) {
      console.error('Empty response from N8N webhook');
      return res.status(502).json({
        status: 'fail',
        error: 'Empty response from N8N webhook'
      });
    }
    
    // Format the response for frontend
    let formattedData = response.data;
    
    // If resultJson is a string, try to parse it
    if (formattedData.resultJson && typeof formattedData.resultJson === 'string') {
      try {
        const cleanJson = formattedData.resultJson.replace(/`/g, '');
        formattedData.resultJson = JSON.parse(cleanJson);
      } catch (e) {
        console.error('Error parsing resultJson:', e);
      }
    }
    
    // Extract video URL from response
    let videoUrl = null;
    
    if (formattedData.resultJson && formattedData.resultJson.videoUrl) {
      videoUrl = formattedData.resultJson.videoUrl.replace(/`/g, '').trim();
    } else if (formattedData.videoUrl) {
      videoUrl = formattedData.videoUrl.replace(/`/g, '').trim();
    } else if (formattedData.data && formattedData.data.videoUrl) {
      videoUrl = formattedData.data.videoUrl.replace(/`/g, '').trim();
    }
    
    if (!videoUrl) {
      console.warn('No video URL found in the response');
    } else {
      console.log('Extracted video URL:', videoUrl);
    }
    
    // Prepare the response data
    responseData = {
      status: 'success',
      data: formattedData
    };
    
    // If we extracted videoUrl separately, include it directly in the response
    if (videoUrl) {
      responseData.data.videoUrl = videoUrl;
    }
    
    // Deduct credit and update user stats
    user.credits.balance -= 1;
    user.credits.totalUsed += 1;
    
    // Save generated video to user's history if we have a valid URL
    if (videoUrl && videoUrl !== 'No result URL found') {
      // Check if generatedVideos array exists, if not create it
      if (!user.generatedVideos) {
        user.generatedVideos = [];
      }
      
      const videoData = {
        id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        videoUrl: videoUrl,
        prompt: prompt,
        type: 'text-to-video',
        taskId: formattedData.taskId || null,
        createdAt: new Date()
      };
      
      // Add to user's generated videos array
      user.generatedVideos.push(videoData);
      
      // Keep only last 50 videos to prevent database bloat
      if (user.generatedVideos.length > 50) {
        user.generatedVideos = user.generatedVideos.slice(-50);
      }
    }
     
    await user.save();
    
    console.log('Updated user credits:', {
      balance: user.credits.balance,
      totalUsed: user.credits.totalUsed
    });
    
    // Add credit info to response
    responseData.credits = {
      remaining: user.credits.balance
    };
    
    // Return the formatted response
    return res.json(responseData);

  } catch (err) {
    console.error('Error communicating with n8n webhook:', err.message);
    console.error('Full error details:', err.response?.data || 'No response data');
    
    // Check if it's a timeout error
    if (err.code === 'ECONNABORTED') {
      console.error('N8N webhook request timed out');
      return res.status(504).json({
        status: 'fail',
        error: 'N8N webhook request timed out. The video processing is taking too long.'
      });
    }
    
    // Check if it's a connection error
    if (err.code === 'ECONNREFUSED') {
      console.error('N8N webhook connection refused');
      return res.status(502).json({
        status: 'fail',
        error: 'N8N webhook connection refused. The service might be down.'
      });
    }
    
    // Handle 404 errors specifically for n8n webhook
    if (err.response?.status === 404) {
      console.error('N8N webhook not found (404):', err.response?.data);
      return res.status(502).json({
        status: 'fail',
        error: 'Video processing service is currently unavailable. Please try again later or contact support.',
        hint: 'The n8n workflow may need to be activated. Please ensure the workflow is running.'
      });
    }
    
    // Provide more detailed error message
    const errorMessage = err.response?.data?.error || 
                         err.response?.statusText || 
                         err.message || 
                         'Failed to process video';
    
    const statusCode = err.response?.status || 500;
    
    return res.status(statusCode).json({ 
      status: 'fail',
      error: errorMessage,
      details: err.response?.data || null 
    });
  }
};

/**
 * @desc    Generate video from image
 * @route   POST /api/video-edit/image-to-video
 * @access  Private
 */
exports.imageToVideo = async (req, res) => {
  const { prompt, image_url } = req.body;
  
  // Check if user has enough credits
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      status: 'fail',
      error: 'User not found'
    });
  }
  
  // Check if user has selected a plan
  if (!user.plan) {
    return res.status(403).json({
      status: 'fail',
      error: 'Please select a plan to generate videos',
      redirectTo: '/pricing'
    });
  }
  
  // Check if user has enough credits
  if (user.credits.balance <= 0) {
    return res.status(403).json({
      status: 'fail',
      error: 'You have run out of credits. Please upgrade your plan.',
      redirectTo: '/pricing'
    });
  }

  // Validate input
  if (!prompt || !image_url) {
    return res.status(400).json({ 
      status: 'fail',
      error: 'prompt and image_url are required' 
    });
  }
  
  // Validate image URL format
  try {
    new URL(image_url);
  } catch (e) {
    console.error('Invalid image URL format:', image_url);
    return res.status(422).json({ 
      status: 'fail',
      error: 'Invalid image URL format' 
    });
  }

  try {
    // Get the webhook URL
    const n8nWebhookUrl = process.env.WEBHOOK_IMAGE_TO_VIDEO;
    
    if (!n8nWebhookUrl) {
      return res.status(500).json({ 
        status: 'fail',
        error: 'Image to video webhook URL is not configured' 
      });
    }
    
    // Validate webhook URL format
    try {
      new URL(n8nWebhookUrl);
    } catch (e) {
      console.error('Invalid image to video webhook URL format:', n8nWebhookUrl);
      return res.status(500).json({ 
        status: 'fail',
        error: 'Invalid image to video webhook URL format' 
      });
    }

    // Prepare webhook payload
    const webhookPayload = {
      prompt,
      image_url,
      webhookType: 'image-to-video',
      userId: req.user.id,
      userEmail: user.email
    };
    
    // Send request to n8n webhook
    console.log(`Sending request to image-to-video webhook: ${n8nWebhookUrl}`);
    console.log('Request payload:', webhookPayload);
    
    const response = await axios.post(n8nWebhookUrl, webhookPayload, {
      timeout: 180000, // wait up to 180 seconds for n8n response (videos take longer)
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('N8N webhook response status:', response.status);
    console.log('N8N webhook response headers:', response.headers);
    
    // Handle response data safely
    let responseData;
    try {
      if (typeof response.data === 'string') {
        // Check if response starts with "Internal S" (likely "Internal Server Error")
        if (response.data.startsWith('Internal S')) {
          console.error('Received Internal Server Error from webhook');
          responseData = { 
            error: 'Internal Server Error from webhook',
            message: response.data
          };
        } else {
          // Try to parse as JSON, but handle any parsing errors
          try {
            responseData = JSON.parse(response.data);
          } catch (jsonError) {
            console.error('Failed to parse response as JSON:', jsonError);
            responseData = { 
              error: 'Invalid JSON response',
              rawResponse: response.data.substring(0, 200) // Include part of the raw response for debugging
            };
          }
        }
      } else {
        responseData = response.data;
      }
      console.log('N8N webhook response data:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.error('Error handling webhook response:', parseError);
      responseData = { 
        error: 'Invalid response format',
        message: parseError.message
      };
    }
    
    // Replace response.data with our safely parsed data
    response.data = responseData;
    
    // Check if response data is valid
    if (!response.data) {
      console.error('Empty response from N8N webhook');
      return res.status(502).json({
        status: 'fail',
        error: 'Empty response from N8N webhook'
      });
    }
    
    // Format the response for frontend
    let formattedData = response.data;
    
    // If resultJson is a string, try to parse it
    if (formattedData.resultJson && typeof formattedData.resultJson === 'string') {
      try {
        const cleanJson = formattedData.resultJson.replace(/`/g, '');
        formattedData.resultJson = JSON.parse(cleanJson);
      } catch (e) {
        console.error('Error parsing resultJson:', e);
      }
    }
    
    // Extract video URL from response
    let videoUrl = null;
    
    if (formattedData.resultJson && formattedData.resultJson.videoUrl) {
      videoUrl = formattedData.resultJson.videoUrl.replace(/`/g, '').trim();
    } else if (formattedData.videoUrl) {
      videoUrl = formattedData.videoUrl.replace(/`/g, '').trim();
    } else if (formattedData.data && formattedData.data.videoUrl) {
      videoUrl = formattedData.data.videoUrl.replace(/`/g, '').trim();
    }
    
    if (!videoUrl) {
      console.warn('No video URL found in the response');
    } else {
      console.log('Extracted video URL:', videoUrl);
    }
    
    // Prepare the response data
    responseData = {
      status: 'success',
      data: formattedData
    };
    
    // If we extracted videoUrl separately, include it directly in the response
    if (videoUrl) {
      responseData.data.videoUrl = videoUrl;
    }
    
    // Deduct credit and update user stats
    user.credits.balance -= 1;
    user.credits.totalUsed += 1;
    
    // Save generated video to user's history if we have a valid URL
    if (videoUrl && videoUrl !== 'No result URL found') {
      // Check if generatedVideos array exists, if not create it
      if (!user.generatedVideos) {
        user.generatedVideos = [];
      }
      
      const videoData = {
        id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalUrl: image_url,
        videoUrl: videoUrl,
        prompt: prompt,
        type: 'image-to-video',
        taskId: formattedData.taskId || null,
        createdAt: new Date()
      };
      
      // Add to user's generated videos array
      user.generatedVideos.push(videoData);
      
      // Keep only last 50 videos to prevent database bloat
      if (user.generatedVideos.length > 50) {
        user.generatedVideos = user.generatedVideos.slice(-50);
      }
    }
     
    await user.save();
    
    console.log('Updated user credits:', {
      balance: user.credits.balance,
      totalUsed: user.credits.totalUsed
    });
    
    // Add credit info to response
    responseData.credits = {
      remaining: user.credits.balance
    };
    
    // Return the formatted response
    return res.json(responseData);

  } catch (err) {
    console.error('Error communicating with n8n webhook:', err.message);
    console.error('Full error details:', err.response?.data || 'No response data');
    
    // Check if it's a timeout error
    if (err.code === 'ECONNABORTED') {
      console.error('N8N webhook request timed out');
      return res.status(504).json({
        status: 'fail',
        error: 'N8N webhook request timed out. The video processing is taking too long.'
      });
    }
    
    // Check if it's a connection error
    if (err.code === 'ECONNREFUSED') {
      console.error('N8N webhook connection refused');
      return res.status(502).json({
        status: 'fail',
        error: 'N8N webhook connection refused. The service might be down.'
      });
    }
    
    // Handle 404 errors specifically for n8n webhook
    if (err.response?.status === 404) {
      console.error('N8N webhook not found (404):', err.response?.data);
      return res.status(502).json({
        status: 'fail',
        error: 'Video processing service is currently unavailable. Please try again later or contact support.',
        hint: 'The n8n workflow may need to be activated. Please ensure the workflow is running.'
      });
    }
    
    // Provide more detailed error message
    const errorMessage = err.response?.data?.error || 
                         err.response?.statusText || 
                         err.message || 
                         'Failed to process video';
    
    const statusCode = err.response?.status || 500;
    
    return res.status(statusCode).json({ 
      status: 'fail',
      error: errorMessage,
      details: err.response?.data || null 
    });
  }
};

/**
 * @desc    Generate video from audio
 * @route   POST /api/video-edit/audio-to-video
 * @access  Private
 */
exports.audioToVideo = async (req, res) => {
  const { prompt, image_url, audio_url } = req.body;
  
  // Check if user has enough credits
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      status: 'fail',
      error: 'User not found'
    });
  }
  
  // Check if user has selected a plan
  if (!user.plan) {
    return res.status(403).json({
      status: 'fail',
      error: 'Please select a plan to generate videos',
      redirectTo: '/pricing'
    });
  }
  
  // Check if user has enough credits
  if (user.credits.balance <= 0) {
    return res.status(403).json({
      status: 'fail',
      error: 'You have run out of credits. Please upgrade your plan.',
      redirectTo: '/pricing'
    });
  }

  // Validate input
  if (!prompt || !image_url || !audio_url) {
    return res.status(400).json({ 
      status: 'fail',
      error: 'prompt, image_url, and audio_url are required' 
    });
  }
  
  // Validate image URL format
  try {
    new URL(image_url);
  } catch (e) {
    console.error('Invalid image URL format:', image_url);
    return res.status(422).json({ 
      status: 'fail',
      error: 'Invalid image URL format' 
    });
  }
  
  // Validate audio URL format
  try {
    new URL(audio_url);
  } catch (e) {
    console.error('Invalid audio URL format:', audio_url);
    return res.status(422).json({ 
      status: 'fail',
      error: 'Invalid audio URL format' 
    });
  }

  try {
    // Get the webhook URL
    const n8nWebhookUrl = process.env.WEBHOOK_SPEECH_TO_VIDEO;
    
    if (!n8nWebhookUrl) {
      return res.status(500).json({ 
        status: 'fail',
        error: 'Speech to video webhook URL is not configured' 
      });
    }
    
    // Validate webhook URL format
    try {
      new URL(n8nWebhookUrl);
    } catch (e) {
      console.error('Invalid speech to video webhook URL format:', n8nWebhookUrl);
      return res.status(500).json({ 
        status: 'fail',
        error: 'Invalid speech to video webhook URL format' 
      });
    }

    // Prepare webhook payload
    const webhookPayload = {
      prompt,
      image_url,
      audio_url,
      webhookType: 'audio-to-video',
      userId: req.user.id,
      userEmail: user.email
    };
    
    // Send request to n8n webhook
    console.log(`Sending request to speech-to-video webhook: ${n8nWebhookUrl}`);
    console.log('Request payload:', webhookPayload);
    
    const response = await axios.post(n8nWebhookUrl, webhookPayload, {
      timeout: 180000, // wait up to 180 seconds for n8n response (videos take longer)
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('N8N webhook response status:', response.status);
    console.log('N8N webhook response headers:', response.headers);
    
    // Handle response data safely
    let responseData;
    try {
      if (typeof response.data === 'string') {
        // Check if response starts with "Internal S" (likely "Internal Server Error")
        if (response.data.startsWith('Internal S')) {
          console.error('Received Internal Server Error from webhook');
          responseData = { 
            error: 'Internal Server Error from webhook',
            message: response.data
          };
        } else {
          // Try to parse as JSON, but handle any parsing errors
          try {
            responseData = JSON.parse(response.data);
          } catch (jsonError) {
            console.error('Failed to parse response as JSON:', jsonError);
            responseData = { 
              error: 'Invalid JSON response',
              rawResponse: response.data.substring(0, 200) // Include part of the raw response for debugging
            };
          }
        }
      } else {
        responseData = response.data;
      }
      console.log('N8N webhook response data:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.error('Error handling webhook response:', parseError);
      responseData = { 
        error: 'Invalid response format',
        message: parseError.message
      };
    }
    
    // Replace response.data with our safely parsed data
    response.data = responseData;
    
    // Check if response data is valid
    if (!response.data) {
      console.error('Empty response from N8N webhook');
      return res.status(502).json({
        status: 'fail',
        error: 'Empty response from N8N webhook'
      });
    }
    
    // Format the response for frontend
    let formattedData = response.data;
    
    // If resultJson is a string, try to parse it
    if (formattedData.resultJson && typeof formattedData.resultJson === 'string') {
      try {
        const cleanJson = formattedData.resultJson.replace(/`/g, '');
        formattedData.resultJson = JSON.parse(cleanJson);
      } catch (e) {
        console.error('Error parsing resultJson:', e);
      }
    }
    
    // Extract video URL from response
    let videoUrl = null;
    
    if (formattedData.resultJson && formattedData.resultJson.videoUrl) {
      videoUrl = formattedData.resultJson.videoUrl.replace(/`/g, '').trim();
    } else if (formattedData.videoUrl) {
      videoUrl = formattedData.videoUrl.replace(/`/g, '').trim();
    } else if (formattedData.data && formattedData.data.videoUrl) {
      videoUrl = formattedData.data.videoUrl.replace(/`/g, '').trim();
    }
    
    if (!videoUrl) {
      console.warn('No video URL found in the response');
    } else {
      console.log('Extracted video URL:', videoUrl);
    }
    
    // Prepare the response data
    responseData = {
      status: 'success',
      data: formattedData
    };
    
    // If we extracted videoUrl separately, include it directly in the response
    if (videoUrl) {
      responseData.data.videoUrl = videoUrl;
    }
    
    // Deduct credit and update user stats
    user.credits.balance -= 1;
    user.credits.totalUsed += 1;
    
    // Save generated video to user's history if we have a valid URL
    if (videoUrl && videoUrl !== 'No result URL found') {
      // Check if generatedVideos array exists, if not create it
      if (!user.generatedVideos) {
        user.generatedVideos = [];
      }
      
      const videoData = {
        id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalUrl: image_url,
        audioUrl: audio_url,
        videoUrl: videoUrl,
        prompt: prompt,
        type: 'audio-to-video',
        taskId: formattedData.taskId || null,
        createdAt: new Date()
      };
      
      // Add to user's generated videos array
      user.generatedVideos.push(videoData);
      
      // Keep only last 50 videos to prevent database bloat
      if (user.generatedVideos.length > 50) {
        user.generatedVideos = user.generatedVideos.slice(-50);
      }
    }
     
    await user.save();
    
    console.log('Updated user credits:', {
      balance: user.credits.balance,
      totalUsed: user.credits.totalUsed
    });
    
    // Add credit info to response
    responseData.credits = {
      remaining: user.credits.balance
    };
    
    // Return the formatted response
    return res.json(responseData);

  } catch (err) {
    console.error('Error communicating with n8n webhook:', err.message);
    console.error('Full error details:', err.response?.data || 'No response data');
    
    // Check if it's a timeout error
    if (err.code === 'ECONNABORTED') {
      console.error('N8N webhook request timed out');
      return res.status(504).json({
        status: 'fail',
        error: 'N8N webhook request timed out. The video processing is taking too long.'
      });
    }
    
    // Check if it's a connection error
    if (err.code === 'ECONNREFUSED') {
      console.error('N8N webhook connection refused');
      return res.status(502).json({
        status: 'fail',
        error: 'N8N webhook connection refused. The service might be down.'
      });
    }
    
    // Handle 404 errors specifically for n8n webhook
    if (err.response?.status === 404) {
      console.error('N8N webhook not found (404):', err.response?.data);
      return res.status(502).json({
        status: 'fail',
        error: 'Video processing service is currently unavailable. Please try again later or contact support.',
        hint: 'The n8n workflow may need to be activated. Please ensure the workflow is running.'
      });
    }
    
    // Provide more detailed error message
    const errorMessage = err.response?.data?.error || 
                         err.response?.statusText || 
                         err.message || 
                         'Failed to process video';
    
    const statusCode = err.response?.status || 500;
    
    return res.status(statusCode).json({ 
      status: 'fail',
      error: errorMessage,
      details: err.response?.data || null 
    });
  }
};