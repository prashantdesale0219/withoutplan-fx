const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const { admin } = require('../middleware/checkRole');

// Protect all admin routes with authentication and role check
router.use(authMiddleware.protect);
router.use(admin);

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/credits', adminController.updateUserCredits);

// Analytics routes
router.get('/analytics', adminController.getAnalytics);

// Process refund
router.post('/users/:userId/refund', paymentController.processRefund);

// Get user transactions
router.get('/users/:userId/transactions', paymentController.getUserTransactions);

// Update user plan
router.patch('/users/:id/plan', adminController.updateUserPlan);

// Admin security log
router.post('/security/log', adminController.logSecurityAction);

module.exports = router;