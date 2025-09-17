const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5000';

async function testLoginAPI() {
  console.log('Testing Login API with non-existent user...');
  
  try {
    // Test 1: Non-existent email
    console.log('\n=== Test 1: Non-existent email ===');
    const nonExistentEmail = 'nonexistent@test.com';
    const testPassword = 'password123';
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: nonExistentEmail,
        password: testPassword
      });
      
      console.log('❌ ERROR: Login succeeded when it should have failed!');
      console.log('Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ CORRECT: Login failed as expected');
        console.log('Status:', error.response.status);
        console.log('Message:', error.response.data.message);
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
    // Test 2: Existing email but wrong password
    console.log('\n=== Test 2: Existing email with wrong password ===');
    const existingEmail = 'prashantdesale2611@gmail.com';
    const wrongPassword = 'wrongpassword123';
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: existingEmail,
        password: wrongPassword
      });
      
      console.log('❌ ERROR: Login succeeded with wrong password!');
      console.log('Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ CORRECT: Login failed with wrong password');
        console.log('Status:', error.response.status);
        console.log('Message:', error.response.data.message);
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
    // Test 3: Empty credentials
    console.log('\n=== Test 3: Empty credentials ===');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: '',
        password: ''
      });
      
      console.log('❌ ERROR: Login succeeded with empty credentials!');
      console.log('Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ CORRECT: Login failed with empty credentials');
        console.log('Status:', error.response.status);
        console.log('Message:', error.response.data.message);
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
    // Test 4: Missing fields
    console.log('\n=== Test 4: Missing password field ===');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: 'test@example.com'
        // password field missing
      });
      
      console.log('❌ ERROR: Login succeeded with missing password!');
      console.log('Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ CORRECT: Login failed with missing password');
        console.log('Status:', error.response.status);
        console.log('Message:', error.response.data.message);
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/auth/verify`, {
      timeout: 5000
    });
    console.log('Server is running');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running. Please start the backend server first.');
      console.log('Run: npm run dev in the backend directory');
      return false;
    } else {
      console.log('Server is running (got response, even if 401)');
      return true;
    }
  }
}

async function main() {
  console.log('FashionX Login API Test');
  console.log('======================');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  await testLoginAPI();
  
  console.log('\n=== Test Summary ===');
  console.log('If all tests show ✅ CORRECT, then the authentication is working properly.');
  console.log('If any test shows ❌ ERROR, then there is a security issue.');
}

main().catch(console.error);