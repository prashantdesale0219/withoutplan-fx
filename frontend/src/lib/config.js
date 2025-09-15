/**
 * Global configuration for the application
 */

// API URL - Use environment variable or default to localhost in development
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Image URL - Used for image paths
export const IMAGE_URL = `${API_URL}`;

// App configuration
export const APP_CONFIG = {
  name: 'FashionX',
  description: 'AI-powered fashion design platform',
  version: '1.0.0',
};

// Feature flags
export const FEATURES = {
  imageGeneration: true,
  tryOn: true,
  modelGeneration: true,
};