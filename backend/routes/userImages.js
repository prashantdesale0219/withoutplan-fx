const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

/**
 * @desc    Get user's generated images
 * @route   GET /api/user/images
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('generatedImages');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Sort images by creation date (newest first)
    const sortedImages = user.generatedImages.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    res.status(200).json({
      success: true,
      data: {
        images: sortedImages,
        total: sortedImages.length
      }
    });
  } catch (error) {
    console.error('Error fetching user images:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching images'
    });
  }
});

/**
 * @desc    Delete a specific generated image
 * @route   DELETE /api/user/images/:imageId
 * @access  Private
 */
router.delete('/:imageId', protect, async (req, res) => {
  try {
    const { imageId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Find and remove the image
    const imageIndex = user.generatedImages.findIndex(img => img.id === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    user.generatedImages.splice(imageIndex, 1);
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting image'
    });
  }
});

module.exports = router;