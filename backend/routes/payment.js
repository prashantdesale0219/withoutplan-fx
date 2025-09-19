const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Create Razorpay order
router.post('/create-order', protect, paymentController.createOrder);

// Save payment details
router.post('/save', protect, paymentController.savePayment);

module.exports = router;