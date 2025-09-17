const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function checkData() {
  try {
    // Check users
    const users = await User.find({});
    console.log('Total users:', users.length);
    
    if (users.length > 0) {
      console.log('Users found:');
      users.forEach(user => {
        console.log(`- ID: ${user._id}, Email: ${user.email}`);
      });
    }
    
    // Check for any duplicate emails or invalid users
    const duplicateEmails = await User.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (duplicateEmails.length > 0) {
      console.log('\nDuplicate emails found:');
      duplicateEmails.forEach(dup => {
        console.log(`- Email: ${dup._id}, Count: ${dup.count}`);
      });
    } else {
      console.log('\nNo duplicate emails found.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();