const Payment = require('../models/Payment');
const User = require('../models/User');
const paymentService = require('../services/paymentService');

/**
 * Process a payment refund
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.processRefund = async (req, res) => {
  try {
    const { userId, transactionId } = req.body;
    
    if (!userId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and transaction ID are required'
      });
    }

    // Find the payment
    const payment = await Payment.findById(transactionId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    if (payment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Transaction does not belong to this user'
      });
    }
    
    if (payment.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been refunded'
      });
    }

    // Process refund with payment gateway
    const refundResult = await paymentService.processRefund(payment.paymentId);
    
    if (!refundResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process refund with payment gateway',
        error: refundResult.error
      });
    }

    // Update payment status
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.refundId = refundResult.refundId;
    await payment.save();

    // If payment was for credits, adjust user's credits
    if (payment.type === 'credits') {
      const user = await User.findById(userId);
      if (user) {
        // Only reduce credits if user has enough
        const creditsToRemove = payment.credits || 0;
        const availableCredits = user.totalCredits - user.usedCredits;
        
        if (availableCredits >= creditsToRemove) {
          user.totalCredits -= creditsToRemove;
          await user.save();
        }
      }
    }
    
    // If payment was for plan upgrade, downgrade to free plan
    if (payment.type === 'plan') {
      const user = await User.findById(userId);
      if (user) {
        user.plan = 'Free';
        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        transactionId: payment._id,
        refundId: payment.refundId,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing the refund',
      error: error.message
    });
  }
};

/**
 * Get user transaction history
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const transactions = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .select('_id amount plan credits type status createdAt refundedAt');
    
    return res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching transactions',
      error: error.message
    });
  }
};

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