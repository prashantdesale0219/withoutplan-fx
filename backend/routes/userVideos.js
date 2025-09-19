const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/user/videos
// @desc    Get user's generated videos
// @access  Private
router.get('/videos', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return videos in reverse chronological order (newest first)
    const videos = user.generatedVideos || [];
    
    return res.status(200).json({
      success: true,
      data: {
        videos: videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      }
    });
  } catch (error) {
    console.error('Error fetching user videos:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching videos',
      error: error.message
    });
  }
});

// @route   DELETE /api/user/videos/:id
// @desc    Delete a user's generated video by ID
// @access  Private
router.delete('/videos/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has generatedVideos array
    if (!user.generatedVideos || !Array.isArray(user.generatedVideos)) {
      return res.status(404).json({
        success: false,
        message: 'No videos found for this user'
      });
    }
    
    // Find the video by ID
    const videoIndex = user.generatedVideos.findIndex(
      video => video.id === req.params.id || video._id.toString() === req.params.id
    );
    
    if (videoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    // Remove the video from the array
    user.generatedVideos.splice(videoIndex, 1);
    
    // Save the updated user
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user video:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting video',
      error: error.message
    });
  }
});

module.exports = router;