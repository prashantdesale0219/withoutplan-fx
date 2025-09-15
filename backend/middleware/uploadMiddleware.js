const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorHandler');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = ['uploads', 'uploads/models', 'uploads/garments', 'uploads/scenes'];
  
  dirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

// Create upload directories on startup
createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads';
    
    // Determine upload directory based on route
    if (req.originalUrl.includes('/models')) {
      uploadPath = 'uploads/models';
    } else if (req.originalUrl.includes('/garments')) {
      uploadPath = 'uploads/garments';
    } else if (req.originalUrl.includes('/scenes')) {
      uploadPath = 'uploads/scenes';
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter to only allow image uploads
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only .jpeg, .jpg, .png and .webp files are allowed', 400), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware for handling single file uploads
exports.uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadSingle = upload.single(fieldName);
    
    uploadSingle(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File size too large. Maximum size is 10MB', 400));
        }
        return next(new AppError(`Upload error: ${err.message}`, 400));
      } else if (err) {
        return next(err);
      }
      
      // If no file was uploaded
      if (!req.file) {
        return next(new AppError(`Please upload a ${fieldName} image`, 400));
      }
      
      next();
    });
  };
};

// Middleware for handling optional single file uploads
exports.uploadSingleOptional = (fieldName) => {
  return (req, res, next) => {
    const uploadSingle = upload.single(fieldName);
    
    uploadSingle(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File size too large. Maximum size is 10MB', 400));
        }
        return next(new AppError(`Upload error: ${err.message}`, 400));
      } else if (err) {
        return next(err);
      }
      
      // Continue even if no file was uploaded
      next();
    });
  };
};

// Helper function to get file URL
exports.getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/${filePath}`;
};

// Helper function to delete file
exports.deleteFile = (filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  
  return false;
};