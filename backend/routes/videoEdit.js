const express = require('express');
const router = express.Router();
const videoEditController = require('../controllers/videoEditController');
const { protect } = require('../middleware/auth');

// @route   POST /api/video-edit/text-to-video
// @desc    Generate video from text
// @access  Private
router.post('/text-to-video', protect, videoEditController.textToVideo);

// @route   POST /api/video-edit/image-to-video
// @desc    Generate video from image
// @access  Private
router.post('/image-to-video', protect, videoEditController.imageToVideo);

// @route   POST /api/video-edit/audio-to-video
// @desc    Generate video from audio
// @access  Private
router.post('/audio-to-video', protect, videoEditController.audioToVideo);

module.exports = router;