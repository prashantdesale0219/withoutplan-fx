const axios = require('axios');
require('dotenv').config();

/**
 * @desc    Edit image using n8n webhook
 * @route   POST /api/image-edit
 * @access  Public
 */
exports.editImage = async (req, res) => {
  const { prompt, image_url } = req.body;

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
    // Get the webhook URL from environment variables
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    
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

    // Send request to n8n webhook
    console.log(`Sending request to n8n webhook: ${n8nWebhookUrl}`);
    console.log('Request payload:', { prompt, image_url });
    
    const response = await axios.post(n8nWebhookUrl, {
      prompt,
      image_url
    }, {
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
    } else {
      console.warn('No resultUrls found in the response');
    }
    
    // Return the formatted response
    return res.json({
      status: 'success',
      data: formattedData
    });

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