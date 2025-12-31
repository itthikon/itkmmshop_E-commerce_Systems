const ProductCategory = require('../models/ProductCategory');
const Joi = require('joi');

/**
 * Category Controller
 * Handles product category management operations
 */

/**
 * Validation schema for category creation
 */
const createCategorySchema = Joi.object({
  name: Joi.string().required().max(100),
  description: Joi.string().allow('', null),
  parent_id: Joi.number().integer().positive().allow(null),
  status: Joi.string().valid('active', 'inactive').default('active')
});

/**
 * Validation schema for category update
 */
const updateCategorySchema = Joi.object({
  name: Joi.string().max(100),
  description: Joi.string().allow('', null),
  parent_id: Joi.number().integer().positive().allow(null),
  status: Joi.string().valid('active', 'inactive')
}).min(1);

/**
 * Create a new category
 * @route POST /api/categories
 * @access Private (Admin only)
 */
exports.createCategory = async (req, res) => {
  try {
    // Validate input
    const { error, value } = createCategorySchema.validate(req.body);
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

    // Create category
    const category = await ProductCategory.create(value);

    res.status(201).json({
      success: true,
      data: category,
      message: 'สร้างหมวดหมู่สำเร็จ'
    });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่'
      }
    });
  }
};

/**
 * Get all categories
 * @route GET /api/categories
 * @access Public
 */
exports.getCategories = async (req, res) => {
  try {
    const options = {
      status: req.query.status || null,
      parent_id: req.query.parent_id !== undefined ? parseInt(req.query.parent_id) : null
    };

    const categories = await ProductCategory.findAll(options);

    res.json({
      success: true,
      data: categories
    });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่'
      }
    });
  }
};

/**
 * Get category by ID
 * @route GET /api/categories/:id
 * @access Public
 */
exports.getCategoryById = async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'ไม่พบหมวดหมู่'
        }
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (err) {
    console.error('Get category error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่'
      }
    });
  }
};

/**
 * Update category
 * @route PUT /api/categories/:id
 * @access Private (Admin only)
 */
exports.updateCategory = async (req, res) => {
  try {
    // Validate input
    const { error, value } = updateCategorySchema.validate(req.body);
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

    // Check if category exists
    const existingCategory = await ProductCategory.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'ไม่พบหมวดหมู่'
        }
      });
    }

    // Update category
    const category = await ProductCategory.update(req.params.id, value);

    res.json({
      success: true,
      data: category,
      message: 'อัปเดตหมวดหมู่สำเร็จ'
    });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการอัปเดตหมวดหมู่'
      }
    });
  }
};

/**
 * Delete category
 * @route DELETE /api/categories/:id
 * @access Private (Admin only)
 */
exports.deleteCategory = async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'ไม่พบหมวดหมู่'
        }
      });
    }

    await ProductCategory.delete(req.params.id);

    res.json({
      success: true,
      message: 'ลบหมวดหมู่สำเร็จ'
    });
  } catch (err) {
    console.error('Delete category error:', err);
    
    if (err.message.includes('Cannot delete category with existing products')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_HAS_PRODUCTS',
          message: 'ไม่สามารถลบหมวดหมู่ที่มีสินค้าอยู่ได้'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่'
      }
    });
  }
};

module.exports = exports;
