const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { protect } = require('../middleware/auth');
const { editImage } = require('../controllers/imageEditController');

/**
 * @route   POST /api/image-edit
 * @desc    Edit image using n8n webhook
 * @access  Private
 */
router.post('/', protect, asyncHandler(editImage));

module.exports = router;