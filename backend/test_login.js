const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function testLogin() {
  try {
    // Test with non-existent email
    const nonExistentEmail = 'nonexistent@test.com';
    console.log(`Testing login with non-existent email: ${nonExistentEmail}`);
    
    const user = await User.findOne({ email: nonExistentEmail.toLowerCase() }).select('+passwordHash');
    
    if (!user) {
      console.log('✅ CORRECT: User not found in database');
      console.log('Login should be rejected with "Invalid email or password"');
    } else {
      console.log('❌ ERROR: User found when it should not exist!');
      console.log('User details:', {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });
    }
    
    // Test with existing email but wrong password
    const existingEmail = 'prashantdesale2611@gmail.com';
    console.log(`\nTesting with existing email: ${existingEmail}`);
    
    const existingUser = await User.findOne({ email: existingEmail.toLowerCase() }).select('+passwordHash');
    
    if (existingUser) {
      console.log('✅ User found in database');
      console.log('User details:', {
        id: existingUser._id,
        email: existingUser.email,
        isActive: existingUser.isActive,
        isEmailVerified: existingUser.isEmailVerified
      });
      
      // Test password comparison with wrong password
      const wrongPassword = 'wrongpassword123';
      const isPasswordValid = await existingUser.comparePassword(wrongPassword);
      console.log(`Password check with wrong password: ${isPasswordValid ? '❌ PASSED (ERROR!)' : '✅ FAILED (CORRECT)'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin();