const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { selectPlan, getCurrentPlan, getPlans } = require('../controllers/planController');

// Public routes
router.get('/', getPlans);

// Protected routes
router.post('/select', protect, selectPlan);
router.get('/current', protect, getCurrentPlan);

module.exports = router;