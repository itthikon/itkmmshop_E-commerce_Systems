const db = require('../config/database');

/**
 * Transaction Model
 * Handles accounting transactions (income and expenses)
 */
class Transaction {
  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction information
   * @returns {Promise<Object>} Created transaction with ID
   */
  static async create(transactionData) {
    const {
      transaction_type,
      category_id,
      amount,
      transaction_date,
      description = null,
      reference_type = 'manual',
      reference_id = null,
      attachment_path = null,
      created_by
    } = transactionData;

    // Validate required fields
    if (!transaction_type || !category_id || !amount || !transaction_date || !created_by) {
      throw new Error('Missing required fields');
    }

    // Validate transaction type
    if (!['income', 'expense'].includes(transaction_type)) {
      throw new Error('Invalid transaction type');
    }

    // Validate amount is positive
    if (parseFloat(amount) <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const query = `
      INSERT INTO transactions (
        transaction_type, category_id, amount, transaction_date,
        description, reference_type, reference_id, attachment_path, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      transaction_type,
      category_id,
      parseFloat(amount).toFixed(2),
      transaction_date,
      description,
      reference_type,
      reference_id,
      attachment_path,
      created_by
    ];

    const [result] = await db.pool.execute(query, values);
    return this.findById(result.insertId);
  }

  /**
   * Find transaction by ID
   * @param {number} id - Transaction ID
   * @returns {Promise<Object|null>} Transaction data or null
   */
  static async findById(id) {
    const query = `
      SELECT 
        t.*,
        tc.name as category_name,
        tc.type as category_type,
        u.email as created_by_email
      FROM transactions t
      LEFT JOIN transaction_categories tc ON t.category_id = tc.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ? AND t.deleted_at IS NULL
    `;
    
    const [rows] = await db.pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get all transactions with filtering, sorting, and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Transactions and pagination info
   */
  static async findAll(options = {}) {
    const {
      transaction_type = null,
      category_id = null,
      reference_type = null,
      start_date = null,
      end_date = null,
      search = '',
      sort_by = 'transaction_date',
      sort_order = 'DESC',
      page = 1,
      limit = 20
    } = options;

    let query = `
      SELECT 
        t.*,
        tc.name as category_name,
        tc.type as category_type,
        u.email as created_by_email
      FROM transactions t
      LEFT JOIN transaction_categories tc ON t.category_id = tc.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.deleted_at IS NULL
    `;
    
    const params = [];

    // Transaction type filter
    if (transaction_type) {
      query += ` AND t.transaction_type = ?`;
      params.push(transaction_type);
    }

    // Category filter
    if (category_id) {
      query += ` AND t.category_id = ?`;
      params.push(category_id);
    }

    // Reference type filter
    if (reference_type) {
      query += ` AND t.reference_type = ?`;
      params.push(reference_type);
    }

    // Date range filter
    if (start_date) {
      query += ` AND t.transaction_date >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND t.transaction_date <= ?`;
      params.push(end_date);
    }

    // Search filter
    if (search) {
      query += ` AND (t.description LIKE ? OR tc.name LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Sorting
    const allowedSortFields = ['transaction_date', 'amount', 'transaction_type', 'created_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'transaction_date';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY t.${sortField} ${sortDirection}`;

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      WHERE t.deleted_at IS NULL
    `;
    
    const countParams = [];

    if (transaction_type) {
      countQuery += ` AND t.transaction_type = ?`;
      countParams.push(transaction_type);
    }

    if (category_id) {
      countQuery += ` AND t.category_id = ?`;
      countParams.push(category_id);
    }

    if (reference_type) {
      countQuery += ` AND t.reference_type = ?`;
      countParams.push(reference_type);
    }

    if (start_date) {
      countQuery += ` AND t.transaction_date >= ?`;
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += ` AND t.transaction_date <= ?`;
      countParams.push(end_date);
    }

    if (search) {
      countQuery += ` AND (t.description LIKE ? OR EXISTS (
        SELECT 1 FROM transaction_categories tc 
        WHERE tc.id = t.category_id AND tc.name LIKE ?
      ))`;
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern);
    }

    const [countResult] = await db.pool.query(countQuery, countParams);
    const total = countResult[0].total;

    return {
      transactions: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get income transactions for a specific period
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Income transactions
   */
  static async getIncomeByPeriod(startDate, endDate) {
    const query = `
      SELECT 
        t.*,
        tc.name as category_name
      FROM transactions t
      LEFT JOIN transaction_categories tc ON t.category_id = tc.id
      WHERE t.transaction_type = 'income'
        AND t.transaction_date >= ?
        AND t.transaction_date <= ?
        AND t.deleted_at IS NULL
      ORDER BY t.transaction_date ASC
    `;
    
    const [rows] = await db.pool.execute(query, [startDate, endDate]);
    return rows;
  }

  /**
   * Get expense transactions for a specific period
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Expense transactions
   */
  static async getExpenseByPeriod(startDate, endDate) {
    const query = `
      SELECT 
        t.*,
        tc.name as category_name
      FROM transactions t
      LEFT JOIN transaction_categories tc ON t.category_id = tc.id
      WHERE t.transaction_type = 'expense'
        AND t.transaction_date >= ?
        AND t.transaction_date <= ?
        AND t.deleted_at IS NULL
      ORDER BY t.transaction_date ASC
    `;
    
    const [rows] = await db.pool.execute(query, [startDate, endDate]);
    return rows;
  }

  /**
   * Get transactions by category for a specific period
   * @param {number} categoryId - Category ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Transactions
   */
  static async getByCategory(categoryId, startDate, endDate) {
    const query = `
      SELECT 
        t.*,
        tc.name as category_name,
        tc.type as category_type
      FROM transactions t
      LEFT JOIN transaction_categories tc ON t.category_id = tc.id
      WHERE t.category_id = ?
        AND t.transaction_date >= ?
        AND t.transaction_date <= ?
        AND t.deleted_at IS NULL
      ORDER BY t.transaction_date ASC
    `;
    
    const [rows] = await db.pool.execute(query, [categoryId, startDate, endDate]);
    return rows;
  }

  /**
   * Update transaction
   * @param {number} id - Transaction ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated transaction
   */
  static async update(id, updateData) {
    // Check if transaction exists and is not auto-generated from order
    const transaction = await this.findById(id);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.reference_type === 'order') {
      throw new Error('Cannot edit auto-generated sale transactions');
    }

    const allowedFields = [
      'transaction_type', 'category_id', 'amount', 'transaction_date',
      'description', 'attachment_path'
    ];

    const updates = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        // Validate amount if being updated
        if (key === 'amount' && parseFloat(updateData[key]) <= 0) {
          throw new Error('Amount must be greater than zero');
        }
        
        updates.push(`${key} = ?`);
        values.push(key === 'amount' ? parseFloat(updateData[key]).toFixed(2) : updateData[key]);
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `UPDATE transactions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await db.pool.execute(query, values);
    return this.findById(id);
  }

  /**
   * Soft delete transaction
   * @param {number} id - Transaction ID
   * @returns {Promise<boolean>} Success status
   */
  static async softDelete(id) {
    // Check if transaction exists and is not linked to an order
    const transaction = await this.findById(id);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.reference_type === 'order' && transaction.reference_id) {
      throw new Error('Cannot delete transactions linked to confirmed orders');
    }

    const query = `UPDATE transactions SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const [result] = await db.pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Get total income for a period
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<number>} Total income
   */
  static async getTotalIncome(startDate, endDate) {
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE transaction_type = 'income'
        AND transaction_date >= ?
        AND transaction_date <= ?
        AND deleted_at IS NULL
    `;
    
    const [rows] = await db.pool.execute(query, [startDate, endDate]);
    return parseFloat(rows[0].total);
  }

  /**
   * Get total expenses for a period
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<number>} Total expenses
   */
  static async getTotalExpenses(startDate, endDate) {
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE transaction_type = 'expense'
        AND transaction_date >= ?
        AND transaction_date <= ?
        AND deleted_at IS NULL
    `;
    
    const [rows] = await db.pool.execute(query, [startDate, endDate]);
    return parseFloat(rows[0].total);
  }

  /**
   * Get net profit for a period
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<number>} Net profit (income - expenses)
   */
  static async getNetProfit(startDate, endDate) {
    const totalIncome = await this.getTotalIncome(startDate, endDate);
    const totalExpenses = await this.getTotalExpenses(startDate, endDate);
    return totalIncome - totalExpenses;
  }
}

module.exports = Transaction;
