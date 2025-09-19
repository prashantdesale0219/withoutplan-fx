const paymentService = require('../services/paymentService');
const User = require('../models/User');

/**
 * Create a Razorpay order
 * @route POST /api/payment/create-order
 */
exports.createOrder = async (req, res) => {
  try {
    const { planName, amount } = req.body;
    
    if (!planName || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Please provide planName and amount'
      });
    }
    
    const order = await paymentService.createOrder({
      amount,
      planName
    });
    
    res.status(200).json({
      success: true,
      data: {
        order,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
};

/**
 * Save payment details
 * @route POST /api/payment/save
 */
exports.savePayment = async (req, res) => {
  try {
    const { userId, planName, amount, paymentId, orderId, signature, status } = req.body;
    
    // Verify required fields
    if (!userId || !planName || !amount || !paymentId || !orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment information'
      });
    }
    
    // Verify payment signature if provided
    if (signature) {
      const isValid = paymentService.verifyPaymentSignature({
        orderId,
        paymentId,
        signature
      });
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment signature'
        });
      }
    }
    
    // Save payment details
    const payment = await paymentService.savePayment({
      userId,
      planName,
      amount,
      paymentId,
      orderId,
      status: status || 'captured'
    });
    
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error saving payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save payment details'
    });
  }
};