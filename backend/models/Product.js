const db = require('../config/database');
const vatCalculator = require('../services/VATCalculatorService');

/**
 * Product Model
 * Handles product data operations with automatic VAT calculation
 */
class Product {
  /**
   * Create a new product
   * @param {Object} productData - Product information
   * @returns {Promise<Object>} Created product with ID
   */
  static async create(productData) {
    const {
      sku,
      name,
      description,
      category_id,
      price_excluding_vat,
      vat_rate,
      cost_price_excluding_vat,
      cost_vat_amount,
      stock_quantity,
      low_stock_threshold,
      image_path,
      status,
      defects
    } = productData;

    // Use default VAT rate if not provided
    const effectiveVatRate = vat_rate !== undefined ? vat_rate : vatCalculator.getDefaultRate();

    const query = `
      INSERT INTO products (
        sku, name, description, category_id, 
        price_excluding_vat, vat_rate,
        cost_price_excluding_vat, cost_vat_amount,
        stock_quantity, low_stock_threshold,
        image_path, status, defects
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      sku,
      name,
      description || null,
      category_id || null,
      price_excluding_vat,
      effectiveVatRate,
      cost_price_excluding_vat || null,
      cost_vat_amount || null,
      stock_quantity || 0,
      low_stock_threshold || 10,
      image_path || null,
      status || 'active',
      defects || null
    ];

    const [result] = await db.pool.execute(query, values);
    return this.findById(result.insertId);
  }

  /**
   * Find product by ID
   * @param {number} id - Product ID
   * @returns {Promise<Object|null>} Product data or null
   */
  static async findById(id) {
    const query = `
      SELECT 
        p.*,
        pc.name as category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.id = ?
    `;
    
    const [rows] = await db.pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find product by SKU
   * @param {string} sku - Product SKU
   * @returns {Promise<Object|null>} Product data or null
   */
  static async findBySku(sku) {
    const query = `
      SELECT 
        p.*,
        pc.name as category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.sku = ?
    `;
    
    const [rows] = await db.pool.execute(query, [sku]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find multiple products by IDs
   * @param {Array<number>} ids - Array of product IDs
   * @returns {Promise<Array>} Array of products
   */
  static async findByIds(ids) {
    if (!ids || ids.length === 0) {
      return [];
    }

    const placeholders = ids.map(() => '?').join(',');
    const query = `
      SELECT 
        p.*,
        pc.name as category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.id IN (${placeholders})
    `;
    
    const [rows] = await db.pool.execute(query, ids);
    return rows;
  }

  /**
   * Get all products with filtering, sorting, and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Products and pagination info
   */
  static async findAll(options = {}) {
    const {
      search = '',
      category_id = null,
      status = null,
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = 1,
      limit = 20
    } = options;

    let query = `
      SELECT 
        p.*,
        pc.name as category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE 1=1
    `;
    
    const params = [];

    // Search filter
    if (search) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Category filter
    if (category_id) {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    // Status filter
    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    // Sorting
    const allowedSortFields = ['name', 'price_excluding_vat', 'price_including_vat', 'stock_quantity', 'created_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY p.${sortField} ${sortDirection}`;

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE 1=1
    `;
    
    const countParams = [];
    if (search) {
      countQuery += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)`;
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }
    if (category_id) {
      countQuery += ` AND p.category_id = ?`;
      countParams.push(category_id);
    }
    if (status) {
      countQuery += ` AND p.status = ?`;
      countParams.push(status);
    }

    const [countResult] = await db.pool.query(countQuery, countParams);
    const total = countResult[0].total;

    return {
      products: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update product
   * @param {number} id - Product ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated product
   */
  static async update(id, updateData) {
    const allowedFields = [
      'sku', 'name', 'description', 'category_id',
      'price_excluding_vat', 'vat_rate',
      'cost_price_excluding_vat', 'cost_vat_amount',
      'stock_quantity', 'low_stock_threshold',
      'image_path', 'status', 'defects'
    ];

    const updates = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
    
    await db.pool.execute(query, values);
    return this.findById(id);
  }

  /**
   * Delete product (soft delete by setting status to inactive)
   * @param {number} id - Product ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const query = `UPDATE products SET status = 'inactive' WHERE id = ?`;
    const [result] = await db.pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Hard delete product (permanent deletion)
   * @param {number} id - Product ID
   * @returns {Promise<boolean>} Success status
   */
  static async hardDelete(id) {
    const query = `DELETE FROM products WHERE id = ?`;
    const [result] = await db.pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Update stock quantity
   * @param {number} id - Product ID
   * @param {number} quantity - Quantity to add (negative to subtract)
   * @param {Object} options - Additional options (change_type, reference_id, reference_type, notes, created_by)
   * @returns {Promise<Object>} Updated product
   */
  static async updateStock(id, quantity, options = {}) {
    const connection = await db.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get current product
      const [products] = await connection.execute(
        'SELECT stock_quantity FROM products WHERE id = ?',
        [id]
      );

      if (products.length === 0) {
        throw new Error('Product not found');
      }

      const quantityBefore = products[0].stock_quantity;
      const quantityAfter = quantityBefore + quantity;

      // Update stock
      const query = `
        UPDATE products 
        SET stock_quantity = ?,
            status = CASE 
              WHEN ? <= 0 THEN 'out_of_stock'
              ELSE 'active'
            END
        WHERE id = ?
      `;
      
      await connection.execute(query, [quantityAfter, quantityAfter, id]);

      // Create stock history entry
      const historyData = {
        product_id: id,
        quantity_change: quantity,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        change_type: options.change_type || 'adjustment',
        reference_id: options.reference_id || null,
        reference_type: options.reference_type || null,
        notes: options.notes || null,
        created_by: options.created_by || null
      };

      const historyQuery = `
        INSERT INTO stock_history (
          product_id, quantity_change, quantity_before, quantity_after,
          change_type, reference_id, reference_type, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(historyQuery, [
        historyData.product_id,
        historyData.quantity_change,
        historyData.quantity_before,
        historyData.quantity_after,
        historyData.change_type,
        historyData.reference_id,
        historyData.reference_type,
        historyData.notes,
        historyData.created_by
      ]);

      await connection.commit();
      
      return this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get low stock products
   * @returns {Promise<Array>} Products with low stock
   */
  static async getLowStockProducts() {
    const query = `
      SELECT 
        p.*,
        pc.name as category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.stock_quantity <= p.low_stock_threshold
        AND p.status = 'active'
      ORDER BY p.stock_quantity ASC
    `;
    
    const [rows] = await db.pool.execute(query);
    return rows;
  }
}

module.exports = Product;
