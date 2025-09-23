const axios = require('axios');
const User = require('../models/User');
require('dotenv').config();

/**
 * @desc    Edit image using n8n webhook
 * @route   POST /api/image-edit
 * @access  Private
 */
exports.editImage = async (req, res) => {
  const { prompt, image_url, cardId, category, item } = req.body;
  
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
      error: 'Please select a plan to generate images',
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
    // Get the appropriate webhook URL based on cardId or category
    let n8nWebhookUrl;
    let webhookKey = '';
    
    if (cardId) {
      // Fix cardId format if it contains hyphens (e.g., product-type-jeans)
      let formattedCardId = cardId;
      
      // Check if cardId is in format like "product-type-jeans"
      const cardParts = cardId.split('-');
      if (cardParts.length >= 3) {
        // Reconstruct to proper format for env variable lookup
        const categoryPart = `${cardParts[0]}_${cardParts[1]}`;
        const itemPart = cardParts.slice(2).join('_');
        formattedCardId = `${categoryPart}_${itemPart}`;
        console.log(`Reformatted cardId from ${cardId} to ${formattedCardId}`);
      }
      
      // Map cardId to corresponding webhook environment variable
      webhookKey = `${formattedCardId.toUpperCase()}_N8N_WEBHOOK`;
      n8nWebhookUrl = process.env[webhookKey];
      
      if (!n8nWebhookUrl) {
        console.log(`Webhook URL not found for card: ${cardId} (key: ${webhookKey}), using default webhook`);
        n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
      } else {
        console.log(`Using specific webhook for card ${cardId}: ${webhookKey}`);
      }
    } else if (category && item) {
      // Handle category-based webhook selection
      // First clean up category and item
      const cleanCategory = category.replace(/[^a-z0-9-]/gi, '').toLowerCase();
      const cleanItem = item.replace(/[^a-z0-9-]/gi, '').toLowerCase();
      
      // Convert hyphens to underscores for env variable lookup
      const categoryKey = cleanCategory.replace(/-/g, '_');
      const itemKey = cleanItem.replace(/-/g, '_');
      
      console.log(`Looking for webhook with category: ${categoryKey}, item: ${itemKey}`);
      
      // Try specific category-item webhook first - format: CATEGORY_ITEM
      webhookKey = `${categoryKey}_${itemKey}_N8N_WEBHOOK`.toUpperCase();
      n8nWebhookUrl = process.env[webhookKey];
      console.log(`Trying webhook key: ${webhookKey}`);
      
      // If not found, try with CATEGORY_PRESETS_ITEM format (for target-channel)
      if (!n8nWebhookUrl && categoryKey === 'target_channel') {
        webhookKey = `${categoryKey}_PRESETS_${itemKey}_N8N_WEBHOOK`.toUpperCase();
        n8nWebhookUrl = process.env[webhookKey];
        console.log(`Trying alternative webhook key: ${webhookKey}`);
        
        // If still not found, try with just PRESETS
        if (!n8nWebhookUrl) {
          webhookKey = `TARGET_CHANNEL_PRESETS_${itemKey}_N8N_WEBHOOK`.toUpperCase();
          n8nWebhookUrl = process.env[webhookKey];
          console.log(`Trying with TARGET_CHANNEL_PRESETS_ prefix: ${webhookKey}`);
        }
      }
      
      // If not found, try with special formats for other categories
      if (!n8nWebhookUrl) {
        if (categoryKey === 'scene_loc') {
          // First try the standard format
          webhookKey = 'SCENE_LOCATION_AMBIENCE_N8N_WEBHOOK';
          n8nWebhookUrl = process.env[webhookKey];
          console.log(`Trying special format webhook key: ${webhookKey}`);
          
          // Try with specific scene location if available
          if (!n8nWebhookUrl && itemKey) {
            // For taj-inspired-palatial and similar items
            const formattedItem = itemKey.replace(/_/g, '-');
            webhookKey = `SCENE_LOCATION_AMBIENCE_${itemKey.toUpperCase()}_N8N_WEBHOOK`;
            n8nWebhookUrl = process.env[webhookKey];
            console.log(`Trying specific scene location webhook key: ${webhookKey}`);
            
            // If still not found, try with words separated by underscores
            if (!n8nWebhookUrl) {
              // Split by underscore and capitalize each word
              const words = itemKey.split('_');
              const capitalizedWords = words.map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join('_');
              
              webhookKey = `SCENE_LOCATION_AMBIENCE_${capitalizedWords.toUpperCase()}_N8N_WEBHOOK`;
              n8nWebhookUrl = process.env[webhookKey];
              console.log(`Trying with capitalized words: ${webhookKey}`);
            }
          }
        } else if (categoryKey === 'shot_style') {
          webhookKey = 'SHOT_STYLE_USE_CASE_N8N_WEBHOOK';
          n8nWebhookUrl = process.env[webhookKey];
          console.log(`Trying special format webhook key: ${webhookKey}`);
          
          // Try with specific shot style if available
          if (!n8nWebhookUrl && itemKey) {
            webhookKey = `SHOT_STYLE_USE_CASE_${itemKey.toUpperCase()}_N8N_WEBHOOK`;
            n8nWebhookUrl = process.env[webhookKey];
            console.log(`Trying specific shot style webhook key: ${webhookKey}`);
          }
        } else if (categoryKey === 'mood_genre') {
          webhookKey = 'MOOD_GENRE_FINISHES_N8N_WEBHOOK';
          n8nWebhookUrl = process.env[webhookKey];
          console.log(`Trying special format webhook key: ${webhookKey}`);
          
          // Try with specific mood genre if available
          if (!n8nWebhookUrl && itemKey) {
            webhookKey = `MOOD_GENRE_FINISHES_${itemKey.toUpperCase()}_N8N_WEBHOOK`;
            n8nWebhookUrl = process.env[webhookKey];
            console.log(`Trying specific mood genre webhook key: ${webhookKey}`);
          }
        }
      }
      
      // If still not found, try category-level webhook
      if (!n8nWebhookUrl) {
        webhookKey = `${categoryKey}_N8N_WEBHOOK`.toUpperCase();
        n8nWebhookUrl = process.env[webhookKey];
        console.log(`Trying category-level webhook key: ${webhookKey}`);
      }
      
      // For mood-genre, try with FINISHES suffix if not found
      if (!n8nWebhookUrl && categoryKey === 'mood_genre') {
        webhookKey = `${categoryKey}_FINISHES_N8N_WEBHOOK`.toUpperCase();
        n8nWebhookUrl = process.env[webhookKey];
        console.log(`Trying with FINISHES suffix: ${webhookKey}`);
      }
      
      // If still not found, use default
      if (!n8nWebhookUrl) {
        console.log(`Webhook URL not found for category: ${category}, item: ${item}, using default webhook`);
        n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
        webhookKey = 'DEFAULT_N8N_WEBHOOK';
      } else {
        console.log(`Using specific webhook for category ${category}, item ${item}: ${webhookKey}`);
      }
    } else {
      // Use default webhook if no cardId or category provided
      n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
      webhookKey = 'DEFAULT_N8N_WEBHOOK';
    }
    
    if (!n8nWebhookUrl) {
      return res.status(500).json({ 
        status: 'fail',
        error: 'N8N webhook URL is not configured' 
      });
    }
    
    // Validate webhook URL format
    try {
      new URL(n8nWebhookUrl);
    } catch (e) {
      console.error('Invalid N8N webhook URL format:', n8nWebhookUrl);
      return res.status(500).json({ 
        status: 'fail',
        error: 'Invalid N8N webhook URL format' 
      });
    }

    // Prepare webhook payload
    // Clean image_url from backticks if present
    const cleanedImageUrl = typeof image_url === 'string' ? image_url.replace(/`/g, '').trim() : image_url;
    
    // Log the final webhook being used
    console.log(`Using webhook URL: ${n8nWebhookUrl} (${webhookKey})`);
    
    const webhookPayload = {
      prompt,
      image_url: cleanedImageUrl,
      cardId: cardId || null,
      category: category || null,
      item: item || null,
      webhookType: cardId ? 'card' : (category && item ? 'category' : 'custom'),
      userId: req.user.id,
      userEmail: user.email,
      recordInfo: {
        id: `img_${Date.now()}`,
        type: 'image',
        source: 'fashionx',
        userId: req.user.id,
        userName: user.name,
        userEmail: user.email,
        category: category || null,
        item: item || null,
        source: cardId || `${category}-${item}`
      }
    };
    
    // Send request to n8n webhook
    // Clean webhook URL from backticks if present
    const cleanedWebhookUrl = typeof n8nWebhookUrl === 'string' ? n8nWebhookUrl.replace(/`/g, '').trim() : n8nWebhookUrl;
    
    console.log(`Sending request to n8n webhook: ${cleanedWebhookUrl}`);
    console.log('Request payload:', webhookPayload);
    
    // Add recordInfo to payload to fix 422 error
    webhookPayload.recordInfo = {
      id: `img_${Date.now()}`,
      type: 'image',
      source: webhookPayload.cardId || `${webhookPayload.category}-${webhookPayload.item}`
    };
    
    const response = await axios.post(cleanedWebhookUrl, webhookPayload, {
      timeout: 120000, // wait up to 120 seconds for n8n response
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('N8N webhook response status:', response.status);
    console.log('N8N webhook response headers:', response.headers);

    // Log the response data for debugging
    console.log('N8N webhook response data:', JSON.stringify(response.data, null, 2));
    
    // Check if response data is valid
    if (!response.data) {
      console.error('Empty response from N8N webhook');
      return res.status(502).json({
        status: 'fail',
        error: 'Empty response from N8N webhook'
      });
    }
    
    // Format the response for frontend
    // Make sure resultJson is properly formatted
    let formattedData = response.data;
    
    // If resultJson is a string, try to parse it
    if (formattedData.resultJson && typeof formattedData.resultJson === 'string') {
      try {
        // Remove any backticks that might be in the string
        const cleanJson = formattedData.resultJson.replace(/`/g, '');
        formattedData.resultJson = JSON.parse(cleanJson);
      } catch (e) {
        console.error('Error parsing resultJson:', e);
        // Keep it as string if parsing fails
      }
    }
    
    // Check if we have resultUrls in the response
    if (formattedData.resultJson && formattedData.resultJson.resultUrls && 
        Array.isArray(formattedData.resultJson.resultUrls) && 
        formattedData.resultJson.resultUrls.length > 0) {
      
      // Clean up URLs (remove backticks, trim spaces)
      formattedData.resultJson.resultUrls = formattedData.resultJson.resultUrls.map(url => 
        url.replace(/`/g, '').trim()
      );
      
      console.log('Extracted result URLs:', formattedData.resultJson.resultUrls);
    } else if (formattedData.data && formattedData.data.resultJson) {
      // Handle the case where resultJson is a string in the data object
      try {
        // Check if resultJson is a string and contains resultUrls
        if (typeof formattedData.data.resultJson === 'string') {
          // Remove any backticks that might be in the string
          const cleanJson = formattedData.data.resultJson.replace(/`/g, '');
          const parsedJson = JSON.parse(cleanJson);
          
          if (parsedJson.resultUrls && Array.isArray(parsedJson.resultUrls) && parsedJson.resultUrls.length > 0) {
            // Clean up URLs (remove backticks, trim spaces)
            const cleanUrls = parsedJson.resultUrls.map(url => url.replace(/`/g, '').trim());
            formattedData.resultUrls = cleanUrls;
            console.log('Extracted result URLs from data.resultJson:', cleanUrls);
          }
        }
      } catch (e) {
        console.error('Error parsing resultJson from data object:', e);
      }
    } else {
      console.warn('No resultUrls found in the response');
    }
    
    // Prepare the response data
    const responseData = {
      status: 'success',
      data: formattedData
    };
    
    // If we extracted resultUrls separately, include them directly in the response
    if (formattedData.resultUrls && formattedData.resultUrls.length > 0) {
      responseData.data.resultUrls = formattedData.resultUrls;
    }
    
    // Deduct credit and update user stats
    // Only deduct 1 credit per image generation
    user.credits.balance -= 1;
    user.credits.totalUsed += 1;
    user.credits.imagesGenerated += 1;
    
    // Save generated image to user's database
    const resultUrl = formattedData.resultUrls && formattedData.resultUrls.length > 0 
      ? formattedData.resultUrls[0] 
      : (formattedData.resultJson && formattedData.resultJson.resultUrls && formattedData.resultJson.resultUrls.length > 0 
        ? formattedData.resultJson.resultUrls[0] 
        : null);
    
    // Only save to database if we have a valid result URL
    if (resultUrl && resultUrl !== 'No result URL found') {
      const imageData = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalUrl: image_url,
        resultUrl: resultUrl,
        prompt: prompt,
        taskId: formattedData.taskId || null,
        createdAt: new Date()
      };
      
      // Add to user's generated images array
      user.generatedImages.push(imageData);
      
      // Keep only last 50 images to prevent database bloat
      if (user.generatedImages.length > 50) {
        user.generatedImages = user.generatedImages.slice(-50);
      }
    }
     
     await user.save();
    
    console.log('Updated user credits:', {
      balance: user.credits.balance,
      totalUsed: user.credits.totalUsed,
      imagesGenerated: user.credits.imagesGenerated
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
        error: 'N8N webhook request timed out. The image processing is taking too long.'
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
        error: 'Image processing service is currently unavailable. Please try again later or contact support.',
        hint: 'The n8n workflow may need to be activated. Please ensure the workflow is running.'
      });
    }
    
    // Provide more detailed error message
    const errorMessage = err.response?.data?.error || 
                         err.response?.statusText || 
                         err.message || 
                         'Failed to process image';
    
    const statusCode = err.response?.status || 500;
    
    return res.status(statusCode).json({ 
      status: 'fail',
      error: errorMessage,
      details: err.response?.data || null 
    });
  }
};