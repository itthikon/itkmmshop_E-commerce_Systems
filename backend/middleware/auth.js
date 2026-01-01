const jwt = require('jsonwebtoken');

/**
 * Authentication middleware - verifies JWT token
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบ'
        }
      });
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่'
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token ไม่ถูกต้อง'
      }
    });
  }
};

/**
 * Authorization middleware - checks user role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบ'
        }
      });
    }

    // Handle both authorize('admin', 'staff') and authorize(['admin', 'staff'])
    const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้'
        }
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware - verifies JWT token if present
 * Allows both authenticated and guest users
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // If token is invalid, continue as guest user
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
