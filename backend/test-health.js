const axios = require('axios');

// Test health endpoint
async function testHealth() {
  try {
    console.log('Testing health endpoint...');
    
    const response = await axios.get('http://localhost:8080/health');
    console.log('Health check successful:', response.data);
    console.log('Server is running properly');
    
    // Now test registration
    console.log('\nTesting registration...');
    const regResponse = await axios.post('http://localhost:8080/api/auth/signup', {
      firstName: 'Test',
      lastName: 'User', 
      email: 'test@example.com',
      password: 'password123'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Registration successful:', regResponse.data);
    
  } catch (error) {
    console.error('Error occurred:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received');
      console.error('Request:', error.request);
    }
  }
}

testHealth();