const db = require('../config/database');

/**
 * TransactionCategory Model
 * Handles transaction categories for income and expenses
 */
class TransactionCategory {
  /**
   * Create a new transaction category
   * @param {Object} categoryData - Category information
   * @returns {Promise<Object>} Created category with ID
   */
  static async create(categoryData) {
    const {
      name,
      type,
      description = null,
      is_system = false
    } = categoryData;

    // Validate required fields
    if (!name || !type) {
      throw new Error('Missing required fields');
    }

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      throw new Error('Invalid category type');
    }

    // Check for duplicate name within the same type
    const [existing] = await db.pool.execute(
      'SELECT id FROM transaction_categories WHERE name = ? AND type = ?',
      [name, type]
    );

    if (existing.length > 0) {
      throw new Error('Category with this name already exists for this type');
    }

    const query = `
      INSERT INTO transaction_categories (
        name, type, description, is_system, is_active
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
      name,
      type,
      description,
      is_system,
      true // Always active when created
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
      SELECT * FROM transaction_categories WHERE id = ?
    `;
    
    const [rows] = await db.pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get all categories with optional filtering
   * @param {string|null} type - Filter by type ('income' or 'expense')
   * @param {boolean} activeOnly - Return only active categories
   * @returns {Promise<Array>} Categories
   */
  static async findAll(type = null, activeOnly = true) {
    let query = `
      SELECT * FROM transaction_categories WHERE 1=1
    `;
    
    const params = [];

    // Type filter
    if (type) {
      if (!['income', 'expense'].includes(type)) {
        throw new Error('Invalid category type');
      }
      query += ` AND type = ?`;
      params.push(type);
    }

    // Active filter
    if (activeOnly) {
      query += ` AND is_active = ?`;
      params.push(true);
    }

    query += ` ORDER BY type ASC, name ASC`;

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
    const category = await this.findById(id);
    
    if (!category) {
      throw new Error('Category not found');
    }

    // Prevent updating system categories' core properties
    if (category.is_system && (updateData.name || updateData.type)) {
      throw new Error('Cannot modify name or type of system categories');
    }

    const allowedFields = ['name', 'description', 'is_active'];

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

    // Check for duplicate name if name is being updated
    if (updateData.name) {
      const [existing] = await db.pool.execute(
        'SELECT id FROM transaction_categories WHERE name = ? AND type = ? AND id != ?',
        [updateData.name, category.type, id]
      );

      if (existing.length > 0) {
        throw new Error('Category with this name already exists for this type');
      }
    }

    values.push(id);
    const query = `UPDATE transaction_categories SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await db.pool.execute(query, values);
    return this.findById(id);
  }

  /**
   * Deactivate category (soft delete)
   * @param {number} id - Category ID
   * @returns {Promise<boolean>} Success status
   */
  static async deactivate(id) {
    const category = await this.findById(id);
    
    if (!category) {
      throw new Error('Category not found');
    }

    // Prevent deactivating system categories
    if (category.is_system) {
      throw new Error('Cannot deactivate system categories');
    }

    // Check if category is in use
    const canDelete = await this.canDelete(id);
    if (!canDelete) {
      throw new Error('Cannot deactivate category that is in use');
    }

    const query = `UPDATE transaction_categories SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const [result] = await db.pool.execute(query, [false, id]);
    return result.affectedRows > 0;
  }

  /**
   * Check if category can be deleted (not in use)
   * @param {number} id - Category ID
   * @returns {Promise<boolean>} True if category can be deleted
   */
  static async canDelete(id) {
    const query = `
      SELECT COUNT(*) as count
      FROM transactions
      WHERE category_id = ? AND deleted_at IS NULL
    `;
    
    const [rows] = await db.pool.execute(query, [id]);
    return rows[0].count === 0;
  }

  /**
   * Get usage count for a category
   * @param {number} id - Category ID
   * @returns {Promise<number>} Number of transactions using this category
   */
  static async getUsageCount(id) {
    const query = `
      SELECT COUNT(*) as count
      FROM transactions
      WHERE category_id = ? AND deleted_at IS NULL
    `;
    
    const [rows] = await db.pool.execute(query, [id]);
    return rows[0].count;
  }

  /**
   * Get income categories
   * @param {boolean} activeOnly - Return only active categories
   * @returns {Promise<Array>} Income categories
   */
  static async getIncomeCategories(activeOnly = true) {
    return this.findAll('income', activeOnly);
  }

  /**
   * Get expense categories
   * @param {boolean} activeOnly - Return only active categories
   * @returns {Promise<Array>} Expense categories
   */
  static async getExpenseCategories(activeOnly = true) {
    return this.findAll('expense', activeOnly);
  }
}

module.exports = TransactionCategory;
