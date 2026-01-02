const ProductCategory = require('../models/ProductCategory');

/**
 * Product Category Controller
 * Handles product category management
 */

/**
 * Get all categories
 * GET /api/categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.findAll();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้'
      }
    });
  }
};

/**
 * Get category by ID
 * GET /api/categories/:id
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await ProductCategory.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบหมวดหมู่ที่ระบุ'
        }
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้'
      }
    });
  }
};

/**
 * Create new category
 * POST /api/categories
 */
const createCategory = async (req, res) => {
  try {
    const { name, description, prefix, status } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'กรุณากรอกชื่อหมวดหมู่'
        }
      });
    }
    
    // Validate prefix if provided
    if (prefix) {
      if (!/^[A-Z]{2,4}$/.test(prefix)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PREFIX',
            message: 'Prefix ต้องเป็นตัวอักษรภาษาอังกฤษ 2-4 ตัว (A-Z)',
            suggestion: 'ตัวอย่าง: ELEC, FASH, FOOD'
          }
        });
      }
      
      // Check for duplicate prefix
      const existingCategory = await ProductCategory.findByPrefix(prefix);
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_PREFIX',
            message: `Prefix "${prefix}" ถูกใช้งานแล้วโดยหมวดหมู่ "${existingCategory.name}"`,
            suggestion: 'กรุณาเลือก Prefix อื่น'
          }
        });
      }
    }
    
    const categoryData = {
      name,
      description: description || null,
      prefix: prefix || null,
      status: status || 'active'
    };
    
    const category = await ProductCategory.create(categoryData);
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'ไม่สามารถสร้างหมวดหมู่ได้'
      }
    });
  }
};

/**
 * Update category
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, prefix, status } = req.body;
    
    // Check if category exists
    const existingCategory = await ProductCategory.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบหมวดหมู่ที่ระบุ'
        }
      });
    }
    
    // Validate prefix if provided and changed
    if (prefix && prefix !== existingCategory.prefix) {
      if (!/^[A-Z]{2,4}$/.test(prefix)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PREFIX',
            message: 'Prefix ต้องเป็นตัวอักษรภาษาอังกฤษ 2-4 ตัว (A-Z)',
            suggestion: 'ตัวอย่าง: ELEC, FASH, FOOD'
          }
        });
      }
      
      // Check for duplicate prefix
      const duplicateCategory = await ProductCategory.findByPrefix(prefix);
      if (duplicateCategory && duplicateCategory.category_id !== parseInt(id)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_PREFIX',
            message: `Prefix "${prefix}" ถูกใช้งานแล้วโดยหมวดหมู่ "${duplicateCategory.name}"`,
            suggestion: 'กรุณาเลือก Prefix อื่น'
          }
        });
      }
    }
    
    const updateData = {
      name: name || existingCategory.name,
      description: description !== undefined ? description : existingCategory.description,
      prefix: prefix !== undefined ? prefix : existingCategory.prefix,
      status: status || existingCategory.status
    };
    
    const updated = await ProductCategory.update(id, updateData);
    
    // Check if prefix was changed
    const response = {
      success: true,
      data: updated
    };
    
    if (prefix && prefix !== existingCategory.prefix) {
      response.warning = {
        message: 'การเปลี่ยน Prefix จะมีผลกับสินค้าใหม่เท่านั้น',
        suggestion: 'สินค้าที่มีอยู่จะยังคงใช้ SKU เดิม'
      };
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'ไม่สามารถอัปเดตหมวดหมู่ได้'
      }
    });
  }
};

/**
 * Delete category
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const category = await ProductCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบหมวดหมู่ที่ระบุ'
        }
      });
    }
    
    // Check if category has products
    const hasProducts = await ProductCategory.hasProducts(id);
    if (hasProducts) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_HAS_PRODUCTS',
          message: 'ไม่สามารถลบหมวดหมู่ที่มีสินค้าอยู่ได้'
        }
      });
    }
    
    await ProductCategory.delete(id);
    
    res.json({
      success: true,
      message: 'ลบหมวดหมู่สำเร็จ'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'ไม่สามารถลบหมวดหมู่ได้'
      }
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
