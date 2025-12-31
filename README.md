# itkmmshop E-commerce System

ระบบสั่งซื้อสินค้าออนไลน์แบบครบวงจรสำหรับร้านค้าออนไลน์ itkmmshop พร้อมระบบจัดการภาษี VAT แบบละเอียด และการชำระเงินผ่าน SlipOK API

## Features

- ✅ Guest checkout (ซื้อสินค้าโดยไม่ต้องสมัครสมาชิก)
- ✅ User registration and authentication
- ✅ Product catalog with search and filtering
- ✅ Shopping cart with VAT breakdown
- ✅ Voucher/discount system
- ✅ Order tracking
- ✅ Payment via bank transfer with SlipOK verification
- ✅ Automatic receipt generation with VAT details
- ✅ Admin panel for product and order management
- ✅ Staff interface for cross-platform order creation
- ✅ Financial tracking and tax reporting
- ✅ Customer analytics

## Tech Stack

### Backend
- Node.js + Express.js
- MySQL 8.0+
- JWT Authentication
- bcrypt for password hashing
- SlipOK API integration

### Frontend
- React 18+
- React Router
- Axios
- Context API for state management

## Project Structure

```
itkmmshop/
├── backend/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── tests/           # Test files
│   ├── .env             # Environment variables
│   ├── server.js        # Entry point
│   └── package.json
│
├── frontend/
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # Context providers
│   │   ├── config/      # Configuration
│   │   ├── utils/       # Utility functions
│   │   ├── App.js       # Main app component
│   │   └── index.js     # Entry point
│   ├── .env             # Environment variables
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- MySQL 8.0+
- SlipOK API key (for payment verification)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Create MySQL database:
```sql
CREATE DATABASE itkmmshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env if needed
```

4. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Environment Variables

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=itkmmshop
DB_CONNECTION_LIMIT=10

# JWT
JWT_SECRET=your_jwt_secret_minimum_32_characters
JWT_EXPIRES_IN=7d

# SlipOK API
SLIPOK_API_KEY=your_api_key
SLIPOK_API_URL=https://api.slipok.com/api/v1

# VAT
DEFAULT_VAT_RATE=7.00

# Logging
LOG_LEVEL=info

# Security (optional - defaults provided)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
PAYMENT_RATE_LIMIT_MAX=10

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_TIMEOUT=30000
REACT_APP_ENV=development
```

## API Documentation

### Health Check
```
GET /health
```

### API Base
```
GET /api
```

### Monitoring (Admin Only)
```
GET /api/monitoring/health        # System health and statistics
GET /api/monitoring/performance   # Performance metrics
```

### Authentication
```
POST /api/auth/register           # Register new user
POST /api/auth/login              # Login user
POST /api/auth/logout             # Logout user
GET  /api/auth/profile            # Get user profile
```

### Products
```
GET    /api/products              # Get all products (cached)
GET    /api/products/:id          # Get product by ID (cached)
POST   /api/products              # Create product (Admin)
PUT    /api/products/:id          # Update product (Admin)
DELETE /api/products/:id          # Delete product (Admin)
```

### Categories
```
GET    /api/categories            # Get all categories (cached)
GET    /api/categories/:id        # Get category by ID (cached)
POST   /api/categories            # Create category (Admin)
PUT    /api/categories/:id        # Update category (Admin)
DELETE /api/categories/:id        # Delete category (Admin)
```

More endpoints documented in individual route files.

## Development

### Running Tests

Backend:
```bash
cd backend
npm test
```

Frontend:
```bash
cd frontend
npm test
```

### Code Style

- Use ES6+ features
- Follow consistent naming conventions
- Add comments for complex logic
- Write tests for critical functionality

## Security Features

- ✅ JWT-based authentication
- ✅ bcrypt password hashing
- ✅ Input validation and sanitization
- ✅ HTTPS enforcement (production)
- ✅ Rate limiting (API, Auth, Payment)
- ✅ CORS configuration
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Security headers (Helmet.js)
- ✅ Request logging and monitoring
- ✅ NoSQL injection prevention

## Performance Features

- ✅ Database connection pooling
- ✅ API response caching
- ✅ Query optimization utilities
- ✅ Gzip compression
- ✅ Image optimization
- ✅ Slow query detection
- ✅ Performance monitoring endpoints
- ✅ Automatic cache cleanup

## Documentation

### Security & Performance
- [Security Guide](backend/SECURITY.md) - Comprehensive security documentation
- [Performance Guide](backend/PERFORMANCE_OPTIMIZATION.md) - Performance optimization details
- [Quick Start Guide](backend/QUICK_START_SECURITY_PERFORMANCE.md) - Quick reference for developers
- [Implementation Summary](backend/TASK_15_IMPLEMENTATION_SUMMARY.md) - Task 15 implementation details

### Feature Implementation
- [Product CRUD](backend/PRODUCT_CRUD_IMPLEMENTATION.md)
- [Cart & Voucher](backend/CART_VOUCHER_IMPLEMENTATION.md)
- [Inventory Management](backend/INVENTORY_MANAGEMENT_IMPLEMENTATION.md)
- [Admin & Staff](frontend/ADMIN_STAFF_IMPLEMENTATION.md)

## VAT Calculation

The system calculates VAT (7%) per unit for all products:
- Price excluding VAT (base price)
- VAT amount per unit = base price × 7%
- Price including VAT = base price + VAT amount

All orders, receipts, and reports show detailed VAT breakdown.

## License

Private - All rights reserved

## Support

For issues or questions, please contact the development team.
