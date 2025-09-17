import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    const requestData = await request.json();
    console.log('Frontend API received image-edit request:', requestData);
    
    // Validate input data
    if (!requestData.prompt || !requestData.image_url) {
      console.error('Invalid input: prompt or image_url is missing');
      return NextResponse.json({ 
        status: 'fail',
        error: 'Invalid input: prompt and image_url are required' 
      }, { status: 422 });
    }
    
    // Validate image URL format
    try {
      new URL(requestData.image_url);
    } catch (e) {
      console.error('Invalid image URL format:', requestData.image_url);
      return NextResponse.json({ 
        status: 'fail',
        error: 'Invalid image URL format' 
      }, { status: 422 });
    }

    // Forward the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    console.log(`Forwarding to backend: ${backendUrl}/api/image-edit`);
    
    const response = await axios.post(
      `${backendUrl}/api/image-edit`,
      requestData,
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json'
        },
        timeout: 90000 // 90 seconds timeout for image processing
      }
    );

    console.log('Backend response:', response.data);
    
    // Log credits information if available
    if (response.data && response.data.credits) {
      console.log('Credits from backend:', response.data.credits);
    }
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in image-edit API route:', error);
    console.error('Error details:', error.response?.data || 'No response data');
    
    // Extract the most useful error message
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.details?.message ||
                        error.message || 
                        'Failed to process image';
                        
    const statusCode = error.response?.status || 500;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.response?.data || null 
      },
      { status: statusCode }
    );
  }
}