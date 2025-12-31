const Joi = require('joi');
const User = require('../models/User');
const Address = require('../models/Address');
const db = require('../config/database');

/**
 * Validation schemas
 */
const updateProfileSchema = Joi.object({
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

const addressSchema = Joi.object({
  recipient_name: Joi.string().required().messages({
    'any.required': 'กรุณากรอกชื่อผู้รับ'
  }),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก',
    'any.required': 'กรุณากรอกเบอร์โทรศัพท์'
  }),
  address_line1: Joi.string().required().messages({
    'any.required': 'กรุณากรอกที่อยู่'
  }),
  address_line2: Joi.string().allow('', null).optional(),
  subdistrict: Joi.string().required().messages({
    'any.required': 'กรุณากรอกตำบล/แขวง'
  }),
  district: Joi.string().required().messages({
    'any.required': 'กรุณากรอกอำเภอ/เขต'
  }),
  province: Joi.string().required().messages({
    'any.required': 'กรุณากรอกจังหวัด'
  }),
  postal_code: Joi.string().pattern(/^[0-9]{5}$/).required().messages({
    'string.pattern.base': 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก',
    'any.required': 'กรุณากรอกรหัสไปรษณีย์'
  }),
  address_type: Joi.string().valid('shipping', 'billing').default('shipping'),
  is_default: Joi.boolean().default(false)
});

/**
 * Get user profile with addresses
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

    const addresses = await Address.findByUserId(req.user.id);

    res.json({
      success: true,
      data: {
        ...user,
        addresses
      }
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

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    // Validate input
    const { error, value } = updateProfileSchema.validate(req.body);
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

    // Update user
    const updated = await User.update(req.user.id, value);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'ไม่พบข้อมูลผู้ใช้'
        }
      });
    }

    // Get updated profile
    const user = await User.getProfile(req.user.id);

    res.json({
      success: true,
      data: user,
      message: 'อัปเดตโปรไฟล์สำเร็จ'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์'
      }
    });
  }
};

/**
 * Get user addresses
 */
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findByUserId(req.user.id);
    
    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลที่อยู่'
      }
    });
  }
};

/**
 * Create new address
 */
const createAddress = async (req, res) => {
  try {
    // Validate input
    const { error, value } = addressSchema.validate(req.body);
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

    // Create address
    const addressId = await Address.create(req.user.id, value);
    const address = await Address.findById(addressId, req.user.id);

    res.status(201).json({
      success: true,
      data: address,
      message: 'เพิ่มที่อยู่สำเร็จ'
    });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการเพิ่มที่อยู่'
      }
    });
  }
};

/**
 * Update address
 */
const updateAddress = async (req, res) => {
  try {
    const addressId = parseInt(req.params.id);

    // Validate input
    const { error, value } = addressSchema.validate(req.body);
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

    // Check if address exists and belongs to user
    const existingAddress = await Address.findById(addressId, req.user.id);
    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'ไม่พบที่อยู่'
        }
      });
    }

    // Update address
    const updated = await Address.update(addressId, req.user.id, value);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'ไม่พบที่อยู่'
        }
      });
    }

    // Get updated address
    const address = await Address.findById(addressId, req.user.id);

    res.json({
      success: true,
      data: address,
      message: 'อัปเดตที่อยู่สำเร็จ'
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการอัปเดตที่อยู่'
      }
    });
  }
};

/**
 * Delete address
 */
const deleteAddress = async (req, res) => {
  try {
    const addressId = parseInt(req.params.id);

    // Check if address exists and belongs to user
    const existingAddress = await Address.findById(addressId, req.user.id);
    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'ไม่พบที่อยู่'
        }
      });
    }

    // Delete address
    const deleted = await Address.delete(addressId, req.user.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'ไม่พบที่อยู่'
        }
      });
    }

    res.json({
      success: true,
      message: 'ลบที่อยู่สำเร็จ'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการลบที่อยู่'
      }
    });
  }
};

/**
 * Get order history for user
 */
const getOrderHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get orders with pagination
    const [orders] = await db.execute(
      `SELECT 
        o.id, o.order_number, o.total_amount, o.status, 
        o.payment_status, o.created_at, o.updated_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    // Get total count
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
      [req.user.id]
    );
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงประวัติการสั่งซื้อ'
      }
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getOrderHistory
};
