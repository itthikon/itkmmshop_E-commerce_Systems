const TransactionCategory = require('../models/TransactionCategory');

/**
 * Category Controller
 * Handles transaction category management
 */

/**
 * Create category
 * POST /api/accounting/categories
 */
const createCategory = async (req, res) => {
  try {
    const { name, type, description } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'กรุณากรอกชื่อหมวดหมู่และประเภท'
        }
      });
    }

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ประเภทหมวดหมู่ไม่ถูกต้อง'
        }
      });
    }

    const categoryData = {
      name,
      type,
      description: description || null,
      is_system: false,
      is_active: true
    };

    const category = await TransactionCategory.create(categoryData);

    res.status(201).json({
      success: true,
      data: category,
      message: 'สร้างหมวดหมู่สำเร็จ'
    });
  } catch (error) {
    console.error('Create category error:', error);

    // Handle duplicate category name
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'มีหมวดหมู่นี้อยู่แล้ว'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่'
      }
    });
  }
};

/**
 * Get all categories
 * GET /api/accounting/categories
 */
const getCategories = async (req, res) => {
  try {
    const { type, active_only } = req.query;

    // Validate type if provided
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ประเภทหมวดหมู่ไม่ถูกต้อง'
        }
      });
    }

    const activeOnly = active_only === 'true' || active_only === '1';
    const categories = await TransactionCategory.findAll(type, activeOnly);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่'
      }
    });
  }
};

/**
 * Get category by ID
 * GET /api/accounting/categories/:id
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await TransactionCategory.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบหมวดหมู่ที่ต้องการ'
        }
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่'
      }
    });
  }
};

/**
 * Update category
 * PUT /api/accounting/categories/:id
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    // Check if category exists
    const existingCategory = await TransactionCategory.findById(id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบหมวดหมู่ที่ต้องการ'
        }
      });
    }

    // Prevent modification of system categories (except is_active)
    if (existingCategory.is_system && (name || description)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'ไม่สามารถแก้ไขหมวดหมู่ระบบได้'
        }
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    const category = await TransactionCategory.update(id, updateData);

    res.json({
      success: true,
      data: category,
      message: 'อัปเดตหมวดหมู่สำเร็จ'
    });
  } catch (error) {
    console.error('Update category error:', error);

    // Handle duplicate category name
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'มีหมวดหมู่นี้อยู่แล้ว'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการอัปเดตหมวดหมู่'
      }
    });
  }
};

/**
 * Delete/Deactivate category
 * DELETE /api/accounting/categories/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await TransactionCategory.findById(id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบหมวดหมู่ที่ต้องการ'
        }
      });
    }

    // Prevent deletion of system categories
    if (existingCategory.is_system) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'ไม่สามารถลบหมวดหมู่ระบบได้'
        }
      });
    }

    // Check if category is in use
    const canDelete = await TransactionCategory.canDelete(id);

    if (!canDelete) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CATEGORY_IN_USE',
          message: 'ไม่สามารถลบหมวดหมู่ที่มีการใช้งานอยู่'
        }
      });
    }

    // Deactivate instead of delete
    await TransactionCategory.deactivate(id);

    res.json({
      success: true,
      message: 'ปิดใช้งานหมวดหมู่สำเร็จ'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่'
      }
    });
  }
};

/**
 * Check if category can be deleted and get usage count
 * GET /api/accounting/categories/:id/can-delete
 */
const checkCanDelete = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await TransactionCategory.findById(id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบหมวดหมู่ที่ต้องการ'
        }
      });
    }

    const canDelete = await TransactionCategory.canDelete(id);
    const usageCount = await TransactionCategory.getUsageCount(id);

    res.json({
      success: true,
      canDelete,
      usageCount
    });
  } catch (error) {
    console.error('Check can delete error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการตรวจสอบหมวดหมู่'
      }
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  checkCanDelete
};
