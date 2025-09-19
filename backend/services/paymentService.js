const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const User = require('../models/User');

// Initialize Razorpay with credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a Razorpay order
 * @param {Object} orderData - Order data including amount and receipt
 * @returns {Promise<Object>} - Razorpay order object
 */
const createOrder = async (orderData) => {
  try {
    const options = {
      amount: orderData.amount * 100, // amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        planName: orderData.planName
      }
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Save payment details to database
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} - Saved payment object
 */
const savePayment = async (paymentData) => {
  try {
    const { userId, planName, amount, paymentId, orderId, status } = paymentData;
    
    // Create new payment record
    const payment = new Payment({
      userId,
      planName,
      amount,
      paymentId,
      orderId,
      status
    });
    
    // Save payment to database
    const savedPayment = await payment.save();
    
    // Update user's plan and credits based on the plan
    let credits = 0;
    switch(planName) {
      case 'free':
        credits = 3;
        break;
      case 'basic':
        credits = 50;
        break;
      case 'pro':
        credits = 200;
        break;
      case 'enterprise':
        credits = 1000;
        break;
      default:
        credits = 0;
    }
    
    // Update user with new plan and credits
    await User.findByIdAndUpdate(userId, {
      plan: planName,
      'credits.balance': credits,
      planActivatedAt: new Date()
    });
    
    return savedPayment;
  } catch (error) {
    console.error('Error saving payment:', error);
    throw error;
  }
};

/**
 * Verify Razorpay payment signature
 * @param {Object} verifyData - Data for verification including orderId, paymentId and signature
 * @returns {Boolean} - True if signature is valid
 */
const verifyPaymentSignature = (verifyData) => {
  try {
    const { orderId, paymentId, signature } = verifyData;
    const crypto = require('crypto');
    
    // Generate signature for verification
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    
    // Compare generated signature with received signature
    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

module.exports = {
  createOrder,
  savePayment,
  verifyPaymentSignature
};