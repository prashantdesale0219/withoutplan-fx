# FashionX Authentication API

A secure authentication system built with Node.js, Express, and MongoDB. This backend provides comprehensive authentication and user management functionality.

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Secure password hashing with bcrypt
  - Email verification with OTP
  - Password reset functionality
  - Profile management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **File Upload**: Multer (for profile images)
- **Validation**: Joi & Express Validator
- **Security**: Helmet, bcryptjs, rate limiting
- **Email**: Nodemailer

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FashionX/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration:
   - MongoDB connection string
   - JWT secret
   - Email service credentials
   - Other service configurations

4. **Create upload directory**
   ```bash
   mkdir -p uploads/misc
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration (sends OTP to email)
- `POST /api/auth/login` - User login with email and password
- `POST /api/auth/request-otp` - Request OTP for login
- `POST /api/auth/resend-otp` - Resend OTP for verification
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/refresh-token` - Refresh JWT token
- `DELETE /api/auth/delete-account` - Delete user account

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/fashionx

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourapp.com

# File Upload (for profile images)
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_AUTH_MAX_REQUESTS=50

# CORS
CLIENT_URL=http://localhost:3000
```

## Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── modelController.js   # Model management
│   ├── clothController.js   # Cloth management
│   ├── tryonController.js   # Try-on functionality
│   ├── assetController.js   # Asset management
│   └── adminController.js   # Admin functionality
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── errorHandler.js     # Error handling
│   ├── upload.js           # File upload handling
│   └── validation.js       # Request validation
├── models/
│   ├── User.js             # User schema
│   ├── Asset.js            # Asset schema
│   └── TryOnTask.js        # Try-on task schema
├── routes/
│   ├── auth.js             # Auth routes
│   ├── models.js           # Model routes
│   ├── clothes.js          # Cloth routes
│   ├── tryon.js            # Try-on routes
│   ├── assets.js           # Asset routes
│   └── admin.js            # Admin routes
├── services/
│   └── fitroomService.js   # FitRoom API integration
├── uploads/                # File storage
│   ├── models/
│   ├── clothes/
│   └── results/
├── .env                    # Environment variables
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies
└── server.js              # Entry point
```

## Security Features

- **Authentication**: JWT-based with secure cookie storage
- **Authorization**: Role-based access control
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive request validation
- **File Security**: File type and size validation
- **Error Handling**: Secure error responses
- **CORS**: Configurable cross-origin resource sharing

## Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Production Deployment

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Configure production database
   - Set secure JWT secret
   - Configure FitRoom API credentials

2. **Security Considerations**
   - Use HTTPS in production
   - Set secure CORS origins
   - Configure rate limiting
   - Set up proper logging
   - Use environment-specific secrets

3. **Performance**
   - Enable compression
   - Set up caching
   - Configure load balancing
   - Monitor resource usage

## API Documentation

For detailed API documentation, import the Postman collection or refer to the inline JSDoc comments in the controller files.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.