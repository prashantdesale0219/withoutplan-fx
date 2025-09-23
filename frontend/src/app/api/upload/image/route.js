import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    // Get the form data
    const formData = await request.formData();
    
    // Forward the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    console.log(`Forwarding upload to backend: ${backendUrl}/api/upload/image`);
    
    const response = await fetch(`${backendUrl}/api/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
      body: formData
    });

    const data = await response.json();
    console.log('Backend upload response:', data);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Upload failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in upload API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}