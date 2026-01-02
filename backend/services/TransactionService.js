const Transaction = require('../models/Transaction');
const TransactionCategory = require('../models/TransactionCategory');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

/**
 * TransactionService
 * Business logic for managing accounting transactions
 */
class TransactionService {
  /**
   * Create transaction from order payment
   * Automatically creates income transaction when order payment is confirmed
   * @param {number} orderId - Order ID
   * @param {number} paymentId - Payment ID
   * @returns {Promise<Object>} Created transaction
   */
  static async createFromOrder(orderId, paymentId) {
    // Get order details
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Get payment details
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Get "ขายสินค้า" (Sales) category
    const categories = await TransactionCategory.findAll('income', true);
    const salesCategory = categories.find(cat => cat.name === 'ขายสินค้า');
    
    if (!salesCategory) {
      throw new Error('Sales category not found. Please run migrations.');
    }

    // Create income transaction
    const transactionData = {
      transaction_type: 'income',
      category_id: salesCategory.id,
      amount: order.total_amount,
      transaction_date: payment.payment_date || new Date().toISOString().split('T')[0],
      description: `รายได้จากการขาย - คำสั่งซื้อ ${order.order_number}`,
      reference_type: 'order',
      reference_id: orderId,
      created_by: 1 // System user
    };

    return await Transaction.create(transactionData);
  }

  /**
   * Create manual transaction
   * For admin to manually add income or expense
   * @param {Object} transactionData - Transaction data
   * @param {number} userId - User ID creating the transaction
   * @returns {Promise<Object>} Created transaction
   */
  static async createManual(transactionData, userId) {
    const {
      transaction_type,
      category_id,
      amount,
      transaction_date,
      description,
      attachment_path = null
    } = transactionData;

    // Validate required fields
    if (!transaction_type || !category_id || !amount || !transaction_date) {
      throw new Error('Missing required fields');
    }

    // Validate transaction type
    if (!['income', 'expense'].includes(transaction_type)) {
      throw new Error('Invalid transaction type');
    }

    // Validate amount
    if (parseFloat(amount) <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    // Verify category exists and is active
    const category = await TransactionCategory.findById(category_id);
    if (!category) {
      throw new Error('Category not found');
    }

    if (!category.is_active) {
      throw new Error('Cannot use inactive category');
    }

    // Verify category type matches transaction type
    if (category.type !== transaction_type) {
      throw new Error(`Category type (${category.type}) does not match transaction type (${transaction_type})`);
    }

    // Create transaction
    const data = {
      transaction_type,
      category_id,
      amount,
      transaction_date,
      description: description || null,
      reference_type: 'manual',
      reference_id: null,
      attachment_path: attachment_path || null,
      created_by: userId
    };

    return await Transaction.create(data);
  }

  /**
   * Create reversal transaction
   * Creates a negative transaction to reverse a previous transaction (e.g., for cancelled orders)
   * @param {number} originalTransactionId - Original transaction ID to reverse
   * @param {number} userId - User ID creating the reversal
   * @returns {Promise<Object>} Created reversal transaction
   */
  static async createReversal(originalTransactionId, userId) {
    // Get original transaction
    const originalTransaction = await Transaction.findById(originalTransactionId);
    if (!originalTransaction) {
      throw new Error('Original transaction not found');
    }

    // Create reversal transaction with negative amount
    const reversalData = {
      transaction_type: originalTransaction.transaction_type,
      category_id: originalTransaction.category_id,
      amount: -Math.abs(parseFloat(originalTransaction.amount)), // Ensure negative
      transaction_date: new Date().toISOString().split('T')[0],
      description: `ยกเลิก - ${originalTransaction.description}`,
      reference_type: originalTransaction.reference_type,
      reference_id: originalTransaction.reference_id,
      created_by: userId
    };

    // Note: We need to bypass the amount validation in Transaction.create
    // So we'll directly insert instead
    const db = require('../config/database');
    const query = `
      INSERT INTO transactions (
        transaction_type, category_id, amount, transaction_date,
        description, reference_type, reference_id, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      reversalData.transaction_type,
      reversalData.category_id,
      parseFloat(reversalData.amount).toFixed(2),
      reversalData.transaction_date,
      reversalData.description,
      reversalData.reference_type,
      reversalData.reference_id,
      reversalData.created_by
    ];

    const [result] = await db.pool.execute(query, values);
    return await Transaction.findById(result.insertId);
  }

  /**
   * Get transactions with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Transactions and pagination
   */
  static async getTransactions(filters = {}) {
    return await Transaction.findAll(filters);
  }

  /**
   * Update transaction
   * @param {number} id - Transaction ID
   * @param {Object} updateData - Data to update
   * @param {number} userId - User ID performing the update
   * @returns {Promise<Object>} Updated transaction
   */
  static async updateTransaction(id, updateData, userId) {
    // Validate amount if provided
    if (updateData.amount !== undefined && parseFloat(updateData.amount) <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    // Validate category if provided
    if (updateData.category_id) {
      const category = await TransactionCategory.findById(updateData.category_id);
      if (!category) {
        throw new Error('Category not found');
      }

      if (!category.is_active) {
        throw new Error('Cannot use inactive category');
      }

      // If transaction_type is also being updated, verify they match
      if (updateData.transaction_type && category.type !== updateData.transaction_type) {
        throw new Error(`Category type (${category.type}) does not match transaction type (${updateData.transaction_type})`);
      }
    }

    return await Transaction.update(id, updateData);
  }

  /**
   * Delete transaction
   * @param {number} id - Transaction ID
   * @param {number} userId - User ID performing the deletion
   * @returns {Promise<boolean>} Success status
   */
  static async deleteTransaction(id, userId) {
    return await Transaction.softDelete(id);
  }

  /**
   * Upload attachment for transaction
   * @param {number} transactionId - Transaction ID
   * @param {string} filePath - Path to uploaded file
   * @returns {Promise<Object>} Updated transaction
   */
  static async uploadAttachment(transactionId, filePath) {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return await Transaction.update(transactionId, { attachment_path: filePath });
  }
}

module.exports = TransactionService;
