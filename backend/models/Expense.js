const db = require('../config/database');

/**
 * Expense Model
 * Handles business expense tracking with VAT breakdown
 */
class Expense {
  /**
   * Create new expense record
   * @param {Object} expenseData - Expense information
   * @returns {Promise<Object>} Created expense
   */
  static async create(expenseData) {
    const {
      description,
      category = null,
      amount_excluding_vat,
      vat_rate = 7.00,
      input_vat_amount = null,
      total_amount,
      expense_date,
      receipt_file_path = null,
      vendor_name = null,
      vendor_tax_id = null,
      notes = null,
      created_by = null
    } = expenseData;

    // Calculate input VAT if not provided
    const calculatedInputVat = input_vat_amount !== null 
      ? input_vat_amount 
      : (parseFloat(amount_excluding_vat) * parseFloat(vat_rate) / 100);

    const query = `
      INSERT INTO expenses (
        description, category, amount_excluding_vat, vat_rate,
        input_vat_amount, total_amount, expense_date,
        receipt_file_path, vendor_name, vendor_tax_id,
        notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.pool.execute(query, [
      description,
      category,
      parseFloat(amount_excluding_vat).toFixed(2),
      parseFloat(vat_rate).toFixed(2),
      parseFloat(calculatedInputVat).toFixed(2),
      parseFloat(total_amount).toFixed(2),
      expense_date,
      receipt_file_path,
      vendor_name,
      vendor_tax_id,
      notes,
      created_by
    ]);

    return await this.findById(result.insertId);
  }

  /**
   * Find expense by ID
   * @param {number} id - Expense ID
   * @returns {Promise<Object|null>} Expense record
   */
  static async findById(id) {
    const [expenses] = await db.pool.query(
      'SELECT * FROM expenses WHERE id = ?',
      [id]
    );

    return expenses.length > 0 ? expenses[0] : null;
  }

  /**
   * Get all expenses with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Expenses and pagination info
   */
  static async findAll(options = {}) {
    const {
      category = null,
      start_date = null,
      end_date = null,
      search = '',
      sort_by = 'expense_date',
      sort_order = 'DESC',
      page = 1,
      limit = 20
    } = options;

    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    // Filters
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (start_date) {
      query += ' AND expense_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND expense_date <= ?';
      params.push(end_date);
    }

    if (search) {
      query += ' AND (description LIKE ? OR vendor_name LIKE ? OR notes LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Sorting
    const allowedSortFields = ['expense_date', 'total_amount', 'category', 'created_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'expense_date';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortDirection}`;

    // Pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [expenses] = await db.pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM expenses WHERE 1=1';
    const countParams = [];

    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    if (start_date) {
      countQuery += ' AND expense_date >= ?';
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += ' AND expense_date <= ?';
      countParams.push(end_date);
    }

    if (search) {
      countQuery += ' AND (description LIKE ? OR vendor_name LIKE ? OR notes LIKE ?)';
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const [countResult] = await db.pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    return {
      expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update expense
   * @param {number} id - Expense ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Updated expense
   */
  static async update(id, updateData) {
    const allowedFields = [
      'description', 'category', 'amount_excluding_vat', 'vat_rate',
      'input_vat_amount', 'total_amount', 'expense_date',
      'receipt_file_path', 'vendor_name', 'vendor_tax_id', 'notes'
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

    const query = `UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`;
    await db.pool.execute(query, values);

    return await this.findById(id);
  }

  /**
   * Delete expense
   * @param {number} id - Expense ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const [result] = await db.pool.execute(
      'DELETE FROM expenses WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  /**
   * Get expense summary by date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Object>} Summary statistics
   */
  static async getSummary(startDate, endDate) {
    const query = `
      SELECT 
        COUNT(*) as total_count,
        SUM(amount_excluding_vat) as total_excluding_vat,
        SUM(input_vat_amount) as total_input_vat,
        SUM(total_amount) as total_amount,
        category,
        COUNT(*) as category_count
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ?
      GROUP BY category
    `;

    const [categoryBreakdown] = await db.pool.execute(query, [startDate, endDate]);

    // Get overall totals
    const totalQuery = `
      SELECT 
        COUNT(*) as total_count,
        SUM(amount_excluding_vat) as total_excluding_vat,
        SUM(input_vat_amount) as total_input_vat,
        SUM(total_amount) as total_amount
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ?
    `;

    const [totals] = await db.pool.execute(totalQuery, [startDate, endDate]);

    return {
      totals: totals[0],
      categoryBreakdown
    };
  }
}

module.exports = Expense;
