const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/checkRole');
const { 
  selectPlan, 
  getCurrentPlan, 
  getPlans, 
  getPlanById,
  createPlan, 
  updatePlan, 
  deletePlan 
} = require('../controllers/planController');

// Public routes
router.get('/', getPlans);
router.get('/:id', getPlanById);

// Protected routes
router.post('/select', protect, selectPlan);
router.get('/current', protect, getCurrentPlan);

// Admin routes
router.post('/admin', protect, admin, createPlan);
router.put('/admin/:id', protect, admin, updatePlan);
router.delete('/admin/:id', protect, admin, deletePlan);

module.exports = router;