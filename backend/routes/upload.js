const express = require('express');
const router = express.Router();
const path = require('path');
const { uploadConfigs } = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   POST /api/upload/image
 * @desc    Upload image for editing
 * @access  Private
 */
router.post('/image', protect, uploadConfigs.singleImage, asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No image file uploaded'
    });
  }

  // Generate the full URL for the uploaded file using environment variable
  const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  const imageUrl = `${baseUrl}/uploads/${path.relative('./uploads', req.file.path).replace(/\\/g, '/')}`;

  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: imageUrl,
      path: req.file.path
    }
  });
}));

module.exports = router;