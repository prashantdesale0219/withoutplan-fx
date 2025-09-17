const axios = require('axios');

// Test registration endpoint
async function testRegistration() {
  try {
    console.log('Testing registration endpoint...');
    
    const response = await axios.post('http://localhost:8080/api/auth/signup', {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('Registration successful:', response.data);
  } catch (error) {
    console.error('Registration failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    if (error.response?.status === 500) {
      console.error('\n500 Internal Server Error - Check server logs for details');
    }
  }
}

testRegistration();