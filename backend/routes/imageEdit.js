const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { editImage } = require('../controllers/imageEditController');

/**
 * @route   POST /api/image-edit
 * @desc    Edit image using n8n webhook
 * @access  Public
 */
router.post('/', asyncHandler(editImage));

module.exports = router;