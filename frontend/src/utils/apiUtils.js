import { getToken } from './cookieUtils';

// Base API URL for frontend API routes
const API_BASE_URL = '/api';

// Generic fetch function with authentication
async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Handle non-2xx responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  
  return response.json();
}

// API functions for models
export const modelApi = {
  getModels: async () => {
    return fetchWithAuth(`${API_BASE_URL}/models`);
  },
  generateModel: async (data) => {
    return fetchWithAuth(`${API_BASE_URL}/models/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },
  uploadModel: async (formData) => {
    return fetchWithAuth(`${API_BASE_URL}/models/upload`, {
      method: 'POST',
      body: formData
    });
  },
  deleteModel: async (modelId) => {
    return fetchWithAuth(`${API_BASE_URL}/models/${modelId}`, {
      method: 'DELETE'
    });
  }
};

// API functions for garments
export const garmentApi = {
  getGarments: async (category) => {
    const url = category 
      ? `${API_BASE_URL}/garments?category=${encodeURIComponent(category)}` 
      : `${API_BASE_URL}/garments`;
    return fetchWithAuth(url);
  },
  uploadGarment: async (formData) => {
    return fetchWithAuth(`${API_BASE_URL}/garments/upload`, {
      method: 'POST',
      body: formData
    });
  },
  deleteGarment: async (garmentId) => {
    return fetchWithAuth(`${API_BASE_URL}/garments/${garmentId}`, {
      method: 'DELETE'
    });
  }
};

// API functions for scenes
export const sceneApi = {
  getScenes: async () => {
    return fetchWithAuth(`${API_BASE_URL}/scenes`);
  },
  generateScene: async (data) => {
    return fetchWithAuth(`${API_BASE_URL}/scenes/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },
  uploadScene: async (formData) => {
    return fetchWithAuth(`${API_BASE_URL}/scenes/upload`, {
      method: 'POST',
      body: formData
    });
  },
  deleteScene: async (sceneId) => {
    return fetchWithAuth(`${API_BASE_URL}/scenes/${sceneId}`, {
      method: 'DELETE'
    });
  }
};

// API functions for try-on
export const tryonApi = {
  getTryOns: async () => {
    return fetchWithAuth(`${API_BASE_URL}/tryon`);
  },
  createTryOn: async (data) => {
    return fetchWithAuth(`${API_BASE_URL}/tryon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },
  checkStatus: async (jobId) => {
    return fetchWithAuth(`${API_BASE_URL}/tryon/status?jobId=${jobId}`);
  },
  getResults: async (jobId) => {
    return fetchWithAuth(`${API_BASE_URL}/tryon/results?jobId=${jobId}`);
  }
};

// API functions for user
export const userApi = {
  getProfile: async () => {
    return fetchWithAuth(`${API_BASE_URL}/user/profile`);
  },
  updateProfile: async (data) => {
    return fetchWithAuth(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },
  getCredits: async () => {
    return fetchWithAuth(`${API_BASE_URL}/user/credits`);
  }
};
