const db = require('../config/database');

/**
 * Stock History Model
 * Tracks all stock movements for inventory management
 */
class StockHistory {
  /**
   * Create a stock history entry
   * @param {Object} historyData - Stock history information
   * @returns {Promise<Object>} Created history entry
   */
  static async create(historyData) {
    const {
      product_id,
      quantity_change,
      quantity_before,
      quantity_after,
      change_type,
      reference_id,
      reference_type,
      notes,
      created_by
    } = historyData;

    const query = `
      INSERT INTO stock_history (
        product_id, quantity_change, quantity_before, quantity_after,
        change_type, reference_id, reference_type, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      product_id,
      quantity_change,
      quantity_before,
      quantity_after,
      change_type,
      reference_id || null,
      reference_type || null,
      notes || null,
      created_by || null
    ];

    const [result] = await db.pool.execute(query, values);
    return this.findById(result.insertId);
  }

  /**
   * Find stock history entry by ID
   * @param {number} id - History entry ID
   * @returns {Promise<Object|null>} History entry or null
   */
  static async findById(id) {
    const query = `
      SELECT 
        sh.*,
        p.name as product_name,
        p.sku as product_sku,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name
      FROM stock_history sh
      LEFT JOIN products p ON sh.product_id = p.id
      LEFT JOIN users u ON sh.created_by = u.id
      WHERE sh.id = ?
    `;
    
    const [rows] = await db.pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get stock history for a product
   * @param {number} productId - Product ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Stock history entries
   */
  static async findByProduct(productId, options = {}) {
    const {
      change_type = null,
      limit = 50,
      offset = 0
    } = options;

    let query = `
      SELECT 
        sh.*,
        p.name as product_name,
        p.sku as product_sku,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name
      FROM stock_history sh
      LEFT JOIN products p ON sh.product_id = p.id
      LEFT JOIN users u ON sh.created_by = u.id
      WHERE sh.product_id = ?
    `;
    
    const params = [productId];

    if (change_type) {
      query += ` AND sh.change_type = ?`;
      params.push(change_type);
    }

    query += ` ORDER BY sh.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [rows] = await db.pool.query(query, params);
    return rows;
  }

  /**
   * Get all stock history with filtering
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Stock history entries
   */
  static async findAll(options = {}) {
    const {
      change_type = null,
      start_date = null,
      end_date = null,
      limit = 100,
      offset = 0
    } = options;

    let query = `
      SELECT 
        sh.*,
        p.name as product_name,
        p.sku as product_sku,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name
      FROM stock_history sh
      LEFT JOIN products p ON sh.product_id = p.id
      LEFT JOIN users u ON sh.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];

    if (change_type) {
      query += ` AND sh.change_type = ?`;
      params.push(change_type);
    }

    if (start_date) {
      query += ` AND sh.created_at >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND sh.created_at <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY sh.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [rows] = await db.pool.query(query, params);
    return rows;
  }
}

module.exports = StockHistory;
