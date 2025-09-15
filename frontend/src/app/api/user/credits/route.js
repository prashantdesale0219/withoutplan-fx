import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    // Forward the request to the backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const response = await axios.get(`${backendUrl}/api/user/credits`, {
      headers: {
        Authorization: authHeader
      }
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json(
      { error: error.response?.data?.error || 'Failed to fetch user credits' },
      { status: error.response?.status || 500 }
    );
  }
}