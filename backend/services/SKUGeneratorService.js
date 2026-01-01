const db = require('../config/database');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

/**
 * SKU Generator Service
 * Handles automatic SKU generation for products based on category prefix and sequential numbering
 * SKU Format: [PREFIX][00001-99999]
 * Example: ELEC00001, FASH00123, GEN00001
 */
class SKUGeneratorService {
  /**
   * Error definitions for SKU generation
   */
  static ERRORS = {
    LIMIT_REACHED: {
      code: 'SKU_LIMIT_REACHED',
      message: 'เลขลำดับสำหรับหมวดหมู่นี้ถึงขีดจำกัดแล้ว (99999)',
      suggestion: 'กรุณาสร้างหมวดหมู่ใหม่หรือใช้ Prefix อื่น'
    },
    DUPLICATE_SKU: {
      code: 'DUPLICATE_SKU',
      message: 'SKU นี้มีอยู่ในระบบแล้ว',
      suggestion: 'ระบบจะสร้าง SKU ใหม่โดยอัตโนมัติ'
    },
    INVALID_FORMAT: {
      code: 'INVALID_SKU_FORMAT',
      message: 'รูปแบบ SKU ไม่ถูกต้อง',
      suggestion: 'SKU ต้องเป็น [PREFIX][00001-99999]'
    },
    CATEGORY_NOT_FOUND: {
      code: 'CATEGORY_NOT_FOUND',
      message: 'ไม่พบหมวดหมู่ที่เลือก',
      suggestion: 'กรุณาเลือกหมวดหมู่ที่มีอยู่ในระบบ'
    }
  };

  /**
   * Constants for SKU generation
   */
  static CONSTANTS = {
    DEFAULT_PREFIX: 'GEN',
    MIN_PREFIX_LENGTH: 2,
    MAX_PREFIX_LENGTH: 4,
    SEQUENTIAL_NUMBER_LENGTH: 5,
    MAX_SEQUENTIAL_NUMBER: 99999,
    MIN_SEQUENTIAL_NUMBER: 1,
    SKU_PATTERN: /^[A-Z]{2,4}\d{5}$/
  };

  /**
   * Generate SKU for a product based on category
   * @param {number|null} categoryId - Category ID or null for default
   * @returns {Promise<string>} Generated SKU
   */
  async generateSKU(categoryId) {
    // Get category prefix or default "GEN"
    const prefix = await this.getCategoryPrefix(categoryId);
    
    // Get next sequential number for this prefix
    const sequentialNumber = await this.getNextSequentialNumber(prefix);
    
    // Format SKU as [PREFIX][00001-99999]
    const sku = `${prefix}${sequentialNumber}`;
    
    // Verify uniqueness
    await this.ensureUniqueness(sku);
    
    return sku;
  }

  /**
   * Get category prefix or default "GEN"
   * @param {number|null} categoryId - Category ID
   * @returns {Promise<string>} Prefix (2-4 uppercase letters)
   */
  async getCategoryPrefix(categoryId) {
    // If no category ID provided, use default prefix
    if (!categoryId) {
      return SKUGeneratorService.CONSTANTS.DEFAULT_PREFIX;
    }

    try {
      // Query category by ID
      const category = await ProductCategory.findById(categoryId);
      
      // If category not found or has no prefix, use default
      if (!category || !category.prefix) {
        return SKUGeneratorService.CONSTANTS.DEFAULT_PREFIX;
      }

      // Return the category prefix
      return category.prefix;
    } catch (error) {
      // On error, return default prefix to allow product creation
      console.error('Error fetching category prefix:', error);
      return SKUGeneratorService.CONSTANTS.DEFAULT_PREFIX;
    }
  }

  /**
   * Get next sequential number for prefix
   * @param {string} prefix - Category prefix
   * @returns {Promise<string>} 5-digit sequential number
   */
  async getNextSequentialNumber(prefix) {
    // Query max sequential number for this prefix
    const maxNumber = await this.getMaxSequentialNumber(prefix);
    
    // Increment by 1
    const nextNumber = maxNumber + 1;
    
    // Check if limit reached
    if (nextNumber > SKUGeneratorService.CONSTANTS.MAX_SEQUENTIAL_NUMBER) {
      const error = new Error(SKUGeneratorService.ERRORS.LIMIT_REACHED.message);
      error.code = SKUGeneratorService.ERRORS.LIMIT_REACHED.code;
      error.suggestion = SKUGeneratorService.ERRORS.LIMIT_REACHED.suggestion;
      throw error;
    }
    
    // Pad with leading zeros to 5 digits
    return nextNumber.toString().padStart(SKUGeneratorService.CONSTANTS.SEQUENTIAL_NUMBER_LENGTH, '0');
  }

  /**
   * Get max sequential number for a prefix
   * @param {string} prefix - Category prefix
   * @returns {Promise<number>} Maximum sequential number (0 if none exist)
   * 
   * @example
   * For prefix "ELEC", this extracts "00123" from "ELEC00123"
   * - SUBSTRING(sku, 5) extracts from position 5 onwards (after "ELEC")
   * - CAST(...AS UNSIGNED) converts string "00123" to number 123
   * - MAX() finds the highest number among all products with this prefix
   */
  async getMaxSequentialNumber(prefix) {
    // Helper method for getNextSequentialNumber
    // Query explanation:
    // 1. SUBSTRING(sku, prefixLength) - Extract sequential number part from SKU
    // 2. CAST(...AS UNSIGNED) - Convert string to number (removes leading zeros)
    // 3. MAX() - Find highest sequential number for this prefix
    // 4. WHERE sku LIKE 'PREFIX%' - Filter only SKUs with this prefix
    const query = `
      SELECT MAX(CAST(SUBSTRING(sku, ?) AS UNSIGNED)) as max_number
      FROM products
      WHERE sku LIKE ?
    `;
    
    const prefixLength = prefix.length + 1; // +1 for 1-based indexing in SQL SUBSTRING
    const pattern = `${prefix}%`; // Match all SKUs starting with this prefix
    
    const [rows] = await db.pool.execute(query, [prefixLength, pattern]);
    return rows[0].max_number || 0; // Return 0 if no products exist with this prefix
  }

  /**
   * Validate SKU format
   * @param {string} sku - SKU to validate
   * @returns {boolean} True if valid, false otherwise
   */
  validateSKUFormat(sku) {
    // Check if SKU is a string
    if (typeof sku !== 'string') {
      return false;
    }

    // Validate pattern: 2-4 uppercase letters followed by exactly 5 digits
    return SKUGeneratorService.CONSTANTS.SKU_PATTERN.test(sku);
  }

  /**
   * Check if SKU already exists
   * @param {string} sku - SKU to check
   * @returns {Promise<boolean>} True if unique, false if exists
   */
  async checkSKUUniqueness(sku) {
    try {
      // Query products table for existing SKU
      const existingProduct = await Product.findBySku(sku);
      
      // Return true if no product found (SKU is unique)
      // Return false if product exists (SKU is not unique)
      return !existingProduct;
    } catch (error) {
      console.error('Error checking SKU uniqueness:', error);
      // On error, assume not unique to be safe
      return false;
    }
  }

  /**
   * Ensure SKU is unique, throw error if duplicate
   * @param {string} sku - SKU to verify
   * @returns {Promise<void>}
   * @throws {Error} If SKU already exists
   */
  async ensureUniqueness(sku) {
    const isUnique = await this.checkSKUUniqueness(sku);
    if (!isUnique) {
      const error = new Error(SKUGeneratorService.ERRORS.DUPLICATE_SKU.message);
      error.code = SKUGeneratorService.ERRORS.DUPLICATE_SKU.code;
      error.suggestion = SKUGeneratorService.ERRORS.DUPLICATE_SKU.suggestion;
      throw error;
    }
  }
}

module.exports = new SKUGeneratorService();

