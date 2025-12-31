const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');

/**
 * Validation schemas
 */
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'รูปแบบอีเมลไม่ถูกต้อง',
    'any.required': 'กรุณากรอกอีเมล'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
    'any.required': 'กรุณากรอกรหัสผ่าน'
  }),
  first_name: Joi.string().required().messages({
    'any.required': 'กรุณากรอกชื่อ'
  }),
  last_name: Joi.string().required().messages({
    'any.required': 'กรุณากรอกนามสกุล'
  }),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  birth_date: Joi.date().optional(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
    'string.pattern.base': 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'รูปแบบอีเมลไม่ถูกต้อง',
    'any.required': 'กรุณากรอกอีเมล'
  }),
  password: Joi.string().required().messages({
    'any.required': 'กรุณากรอกรหัสผ่าน'
  })
});

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

/**
 * Register new user
 */
const register = async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ข้อมูลไม่ถูกต้อง',
          details: error.details[0].message
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(value.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'อีเมลนี้ถูกใช้งานแล้ว'
        }
      });
    }

    // Create user
    const userId = await User.create(value);
    const user = await User.getProfile(userId);

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก'
      }
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ข้อมูลไม่ถูกต้อง',
          details: error.details[0].message
        }
      });
    }

    // Find user
    const user = await User.findByEmail(value.email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        }
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(value.password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        }
      });
    }

    // Get user profile
    const userProfile = await User.getProfile(user.id);

    // Generate token
    const token = generateToken(userProfile);

    res.json({
      success: true,
      data: {
        user: userProfile,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      }
    });
  }
};

/**
 * Logout user (client-side token removal)
 */
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'ออกจากระบบสำเร็จ'
  });
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.getProfile(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'ไม่พบข้อมูลผู้ใช้'
        }
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์'
      }
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile
};
