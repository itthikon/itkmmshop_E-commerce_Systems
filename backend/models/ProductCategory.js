const db = require('../config/database');

/**
 * Product Category Model
 * Handles product category data operations
 */
class ProductCategory {
  /**
   * Create a new category
   * @param {Object} categoryData - Category information
   * @returns {Promise<Object>} Created category with ID
   */
  static async create(categoryData) {
    const { name, description, parent_id, status } = categoryData;

    const query = `
      INSERT INTO product_categories (name, description, parent_id, status)
      VALUES (?, ?, ?, ?)
    `;

    const values = [
      name,
      description || null,
      parent_id || null,
      status || 'active'
    ];

    const [result] = await db.pool.execute(query, values);
    return this.findById(result.insertId);
  }

  /**
   * Find category by ID
   * @param {number} id - Category ID
   * @returns {Promise<Object|null>} Category data or null
   */
  static async findById(id) {
    const query = `
      SELECT 
        c.*,
        p.name as parent_name
      FROM product_categories c
      LEFT JOIN product_categories p ON c.parent_id = p.id
      WHERE c.id = ?
    `;
    
    const [rows] = await db.pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get all categories
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Categories
   */
  static async findAll(options = {}) {
    const { status = null, parent_id = null } = options;

    let query = `
      SELECT 
        c.*,
        p.name as parent_name,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
      FROM product_categories c
      LEFT JOIN product_categories p ON c.parent_id = p.id
      WHERE 1=1
    `;
    
    const params = [];

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (parent_id !== null) {
      if (parent_id === 0) {
        query += ` AND c.parent_id IS NULL`;
      } else {
        query += ` AND c.parent_id = ?`;
        params.push(parent_id);
      }
    }

    query += ` ORDER BY c.name ASC`;

    const [rows] = await db.pool.execute(query, params);
    return rows;
  }

  /**
   * Update category
   * @param {number} id - Category ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated category
   */
  static async update(id, updateData) {
    const allowedFields = ['name', 'description', 'parent_id', 'status'];

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
    const query = `UPDATE product_categories SET ${updates.join(', ')} WHERE id = ?`;
    
    await db.pool.execute(query, values);
    return this.findById(id);
  }

  /**
   * Delete category
   * @param {number} id - Category ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    // Check if category has products
    const [products] = await db.pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );

    if (products[0].count > 0) {
      throw new Error('Cannot delete category with existing products');
    }

    const query = `DELETE FROM product_categories WHERE id = ?`;
    const [result] = await db.pool.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = ProductCategory;
