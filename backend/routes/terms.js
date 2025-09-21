const express = require('express');
const router = express.Router();
const { acceptTerms, getTermsStatus } = require('../controllers/termsController');
const { protect } = require('../middleware/auth');

// Protected routes - require authentication
router.use(protect);

// Terms & Conditions routes
router.post('/accept', acceptTerms);
router.get('/status', getTermsStatus);

module.exports = router;