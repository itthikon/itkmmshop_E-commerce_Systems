const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const SKUGeneratorService = require('../services/SKUGeneratorService');
const FileNamingService = require('../services/FileNamingService');
const Joi = require('joi');

/**
 * Product Controller
 * Handles product management operations with automatic VAT calculation
 */

/**
 * Generate SKU preview for product
 * @route POST /api/products/generate-sku
 * @access Private (Admin only)
 */
exports.generateSKU = async (req, res) => {
  try {
    const { category_id } = req.body;

    // Validate category_id if provided
    if (category_id !== null && category_id !== undefined) {
      if (typeof category_id !== 'number' || category_id <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'category_id ต้องเป็นตัวเลขที่มากกว่า 0'
          }
        });
      }
    }

    // Generate SKU using SKU Generator Service
    const sku = await SKUGeneratorService.generateSKU(category_id || null);
    
    // Get prefix and sequential number from generated SKU
    const prefix = sku.match(/^[A-Z]{2,4}/)[0];
    const sequentialNumber = sku.match(/\d{5}$/)[0];

    // Get category name if category_id provided
    let categoryName = null;
    if (category_id) {
      const category = await ProductCategory.findById(category_id);
      categoryName = category ? category.name : null;
    }

    res.json({
      success: true,
      data: {
        sku,
        prefix,
        sequential_number: sequentialNumber,
        category_id: category_id || null,
        category_name: categoryName
      }
    });
  } catch (err) {
    console.error('Generate SKU error:', err);

    // Handle specific SKU generation errors
    if (err.code === 'SKU_LIMIT_REACHED') {
      return res.status(400).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          suggestion: err.suggestion
        }
      });
    }

    if (err.code === 'DUPLICATE_SKU') {
      return res.status(409).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          suggestion: err.suggestion
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการสร้าง SKU'
      }
    });
  }
};

/**
 * Validation schema for product creation
 */
const createProductSchema = Joi.object({
  sku: Joi.string().max(50).optional(), // SKU is now optional, will be auto-generated
  name: Joi.string().required().max(255),
  description: Joi.string().allow('', null),
  category_id: Joi.number().integer().positive().allow(null),
  price_excluding_vat: Joi.number().positive().required(),
  vat_rate: Joi.number().min(0).max(100).default(7.00),
  cost_price_excluding_vat: Joi.number().positive().allow(null),
  cost_vat_amount: Joi.number().min(0).allow(null),
  stock_quantity: Joi.number().integer().min(0).default(0),
  low_stock_threshold: Joi.number().integer().min(0).default(10),
  image_path: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'inactive', 'out_of_stock').default('active'),
  defects: Joi.string().allow('', null)
});

/**
 * Validation schema for product update
 */
const updateProductSchema = Joi.object({
  sku: Joi.string().max(50),
  name: Joi.string().max(255),
  description: Joi.string().allow('', null),
  category_id: Joi.number().integer().positive().allow(null),
  price_excluding_vat: Joi.number().positive(),
  vat_rate: Joi.number().min(0).max(100),
  cost_price_excluding_vat: Joi.number().positive().allow(null),
  cost_vat_amount: Joi.number().min(0).allow(null),
  stock_quantity: Joi.number().integer().min(0),
  low_stock_threshold: Joi.number().integer().min(0),
  image_path: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'inactive', 'out_of_stock'),
  defects: Joi.string().allow('', null)
}).min(1);

/**
 * Create a new product
 * @route POST /api/products
 * @access Private (Admin only)
 */
exports.createProduct = async (req, res) => {
  try {
    // Validate input
    const { error, value } = createProductSchema.validate(req.body);
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

    // Auto-generate SKU if not provided
    if (!value.sku) {
      try {
        value.sku = await SKUGeneratorService.generateSKU(value.category_id || null);
      } catch (skuError) {
        console.error('SKU generation error:', skuError);
        
        // Handle specific SKU generation errors
        if (skuError.code === 'SKU_LIMIT_REACHED') {
          return res.status(400).json({
            success: false,
            error: {
              code: skuError.code,
              message: skuError.message,
              suggestion: skuError.suggestion
            }
          });
        }

        return res.status(500).json({
          success: false,
          error: {
            code: 'SKU_GENERATION_ERROR',
            message: 'เกิดข้อผิดพลาดในการสร้าง SKU อัตโนมัติ'
          }
        });
      }
    }

    // Validate generated SKU format
    if (!SKUGeneratorService.validateSKUFormat(value.sku)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SKU_FORMAT',
          message: 'รูปแบบ SKU ไม่ถูกต้อง',
          suggestion: 'SKU ต้องเป็น [PREFIX][00001-99999]'
        }
      });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findBySku(value.sku);
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_SKU',
          message: 'SKU นี้มีอยู่ในระบบแล้ว'
        }
      });
    }

    // Create product
    const product = await Product.create(value);

    res.status(201).json({
      success: true,
      data: product,
      message: 'สร้างสินค้าสำเร็จ'
    });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการสร้างสินค้า'
      }
    });
  }
};

/**
 * Get all products with filtering and pagination
 * @route GET /api/products
 * @access Public
 */
exports.getProducts = async (req, res) => {
  try {
    const options = {
      search: req.query.search || '',
      category_id: req.query.category_id ? parseInt(req.query.category_id) : null,
      status: req.query.status || null,
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'DESC',
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20
    };

    const result = await Product.findAll(options);

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination
    });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า'
      }
    });
  }
};

/**
 * Get product by ID
 * @route GET /api/products/:id
 * @access Public
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'ไม่พบสินค้า'
        }
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า'
      }
    });
  }
};

/**
 * Update product
 * @route PUT /api/products/:id
 * @access Private (Admin only)
 */
exports.updateProduct = async (req, res) => {
  try {
    // Validate input
    const { error, value } = updateProductSchema.validate(req.body);
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

    // Check if product exists
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'ไม่พบสินค้า'
        }
      });
    }

    // Prevent SKU modification - SKU is immutable
    if (value.sku && value.sku !== existingProduct.sku) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SKU_IMMUTABLE',
          message: 'ไม่สามารถเปลี่ยนแปลง SKU ได้',
          suggestion: 'SKU ถูกสร้างอัตโนมัติและไม่สามารถแก้ไขได้'
        }
      });
    }

    // Remove SKU from update data to ensure it's not changed
    delete value.sku;

    // Update product
    const product = await Product.update(req.params.id, value);

    res.json({
      success: true,
      data: product,
      message: 'อัปเดตสินค้าสำเร็จ'
    });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการอัปเดตสินค้า'
      }
    });
  }
};

/**
 * Delete product (soft delete)
 * @route DELETE /api/products/:id
 * @access Private (Admin only)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'ไม่พบสินค้า'
        }
      });
    }

    await Product.delete(req.params.id);

    res.json({
      success: true,
      message: 'ลบสินค้าสำเร็จ'
    });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการลบสินค้า'
      }
    });
  }
};

/**
 * Get low stock products
 * @route GET /api/products/alerts/low-stock
 * @access Private (Admin/Staff)
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.getLowStockProducts();

    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (err) {
    console.error('Get low stock products error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้าสต็อกต่ำ'
      }
    });
  }
};

/**
 * Update product stock
 * @route POST /api/products/:id/stock
 * @access Private (Admin/Staff)
 */
exports.updateStock = async (req, res) => {
  try {
    const { quantity, change_type, notes } = req.body;

    // Validate input
    if (quantity === undefined || typeof quantity !== 'number') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'จำนวนสินค้าไม่ถูกต้อง'
        }
      });
    }

    const validChangeTypes = ['purchase', 'sale', 'adjustment', 'return', 'damage', 'initial'];
    if (change_type && !validChangeTypes.includes(change_type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ประเภทการเปลี่ยนแปลงสต็อกไม่ถูกต้อง'
        }
      });
    }

    // Check if product exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'ไม่พบสินค้า'
        }
      });
    }

    // Update stock with history tracking
    const updatedProduct = await Product.updateStock(
      req.params.id,
      quantity,
      {
        change_type: change_type || 'adjustment',
        notes: notes || null,
        created_by: req.user.id
      }
    );

    res.json({
      success: true,
      data: updatedProduct,
      message: 'อัปเดตสต็อกสำเร็จ'
    });
  } catch (err) {
    console.error('Update stock error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการอัปเดตสต็อก'
      }
    });
  }
};

/**
 * Get stock history for a product
 * @route GET /api/products/:id/stock-history
 * @access Private (Admin/Staff)
 */
exports.getStockHistory = async (req, res) => {
  try {
    const StockHistory = require('../models/StockHistory');
    
    const options = {
      change_type: req.query.change_type || null,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const history = await StockHistory.findByProduct(req.params.id, options);

    res.json({
      success: true,
      data: history
    });
  } catch (err) {
    console.error('Get stock history error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติสต็อก'
      }
    });
  }
};

/**
 * Upload product image
 * @route POST /api/products/:id/image
 * @access Private (Admin only)
 */
exports.uploadImage = async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  let renamedFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'ไม่พบไฟล์รูปภาพ'
        }
      });
    }

    // Check if product exists and get SKU
    const product = await Product.findById(req.params.id);
    if (!product) {
      // Delete uploaded file if product not found
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'ไม่พบสินค้า'
        }
      });
    }

    // Rename file to SKU format
    const newFilename = await FileNamingService.renameToSKUFormat(
      req.file.path,
      product.sku
    );

    // Track the renamed file path for cleanup if needed
    renamedFilePath = path.join(path.dirname(req.file.path), newFilename);

    // Update product with new image path
    const imagePath = `/uploads/products/${newFilename}`;
    const updatedProduct = await Product.update(req.params.id, { 
      image_path: imagePath 
    });

    res.json({
      success: true,
      data: {
        image_path: imagePath,
        filename: newFilename,
        product: updatedProduct
      },
      message: 'อัปโหลดรูปภาพสำเร็จ'
    });
  } catch (err) {
    console.error('Upload image error:', err);
    
    // Comprehensive cleanup logic for failed uploads
    try {
      // Case 1: Original temp file still exists (rename failed)
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log(`Cleaned up temp file: ${req.file.path}`);
      }
      
      // Case 2: Renamed file exists but database update failed
      if (renamedFilePath && fs.existsSync(renamedFilePath)) {
        fs.unlinkSync(renamedFilePath);
        console.log(`Cleaned up renamed file: ${renamedFilePath}`);
      }
    } catch (cleanupErr) {
      // Log cleanup errors but don't fail the response
      console.error('Error during file cleanup:', cleanupErr);
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ'
      }
    });
  }
};

/**
 * Delete product image
 * @route DELETE /api/products/:id/image
 * @access Private (Admin only)
 */
exports.deleteImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'ไม่พบสินค้า'
        }
      });
    }

    // Delete image file if exists
    if (product.image_path) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', product.image_path);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update product to remove image path
    await Product.update(req.params.id, { image_path: null });

    res.json({
      success: true,
      message: 'ลบรูปภาพสำเร็จ'
    });
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการลบรูปภาพ'
      }
    });
  }
};

module.exports = exports;
