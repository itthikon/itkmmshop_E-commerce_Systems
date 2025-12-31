const db = require('../config/database');

/**
 * Payment Model
 * Handles payment processing, slip uploads, and verification
 */
class Payment {
  /**
   * Create payment record
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Created payment
   */
  static async create(paymentData) {
    const {
      order_id,
      payment_method = 'bank_transfer',
      amount,
      slip_image_path = null,
      notes = null
    } = paymentData;

    const query = `
      INSERT INTO payments (
        order_id, payment_method, amount, slip_image_path, 
        status, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.pool.execute(query, [
      order_id,
      payment_method,
      amount,
      slip_image_path,
      'pending',
      notes
    ]);

    return await this.findById(result.insertId);
  }

  /**
   * Find payment by ID
   * @param {number} id - Payment ID
   * @returns {Promise<Object|null>} Payment record
   */
  static async findById(id) {
    const [payments] = await db.pool.query(
      'SELECT * FROM payments WHERE id = ?',
      [id]
    );

    if (payments.length > 0) {
      const payment = payments[0];
      // Convert MySQL BOOLEAN (0/1) to JavaScript boolean and add alias
      payment.verified = Boolean(payment.slipok_verified);
      return payment;
    }

    return null;
  }

  /**
   * Find payment by order ID
   * @param {number} orderId - Order ID
   * @returns {Promise<Object|null>} Payment record
   */
  static async findByOrderId(orderId) {
    const [payments] = await db.pool.query(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
      [orderId]
    );

    if (payments.length > 0) {
      const payment = payments[0];
      // Convert MySQL BOOLEAN (0/1) to JavaScript boolean and add alias
      payment.verified = Boolean(payment.slipok_verified);
      return payment;
    }

    return null;
  }

  /**
   * Update payment slip image
   * @param {number} id - Payment ID
   * @param {string} slipImagePath - Path to slip image
   * @returns {Promise<Object>} Updated payment
   */
  static async updateSlipImage(id, slipImagePath) {
    await db.pool.execute(
      'UPDATE payments SET slip_image_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [slipImagePath, id]
    );

    return await this.findById(id);
  }

  /**
   * Update payment verification status
   * @param {number} id - Payment ID
   * @param {Object} verificationData - Verification data from SlipOK
   * @returns {Promise<Object>} Updated payment
   */
  static async updateVerification(id, verificationData) {
    const {
      verified,
      slipok_response,
      verified_amount = null,
      transfer_date = null
    } = verificationData;

    const status = verified ? 'verified' : 'failed';
    const verifiedAt = verified ? new Date() : null;

    await db.pool.execute(
      `UPDATE payments SET 
        slipok_verified = ?, 
        slipok_response = ?, 
        verified_amount = ?,
        verified_at = ?,
        transfer_date = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        verified,
        JSON.stringify(slipok_response),
        verified_amount,
        verifiedAt,
        transfer_date,
        status,
        id
      ]
    );

    return await this.findById(id);
  }

  /**
   * Generate receipt number
   * Format: RCP-YYYYMMDD-XXXXX
   */
  static async generateReceiptNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get count of receipts today
    const [result] = await db.pool.query(
      `SELECT COUNT(*) as count FROM payments 
       WHERE DATE(receipt_generated_at) = CURDATE() 
       AND receipt_number IS NOT NULL`
    );
    
    const sequence = (result[0].count + 1).toString().padStart(5, '0');
    return `RCP-${dateStr}-${sequence}`;
  }

  /**
   * Mark payment as confirmed and generate receipt
   * @param {number} id - Payment ID
   * @returns {Promise<Object>} Updated payment
   */
  static async confirmPayment(id) {
    const connection = await db.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get payment
      const [payments] = await connection.query(
        'SELECT * FROM payments WHERE id = ?',
        [id]
      );

      if (payments.length === 0) {
        throw new Error('Payment not found');
      }

      const payment = payments[0];

      // Generate receipt number
      const receiptNumber = await this.generateReceiptNumber();

      // Update payment
      await connection.execute(
        `UPDATE payments SET 
          status = 'verified',
          payment_date = CURRENT_TIMESTAMP,
          receipt_number = ?,
          receipt_generated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [receiptNumber, id]
      );

      // Update order payment status
      await connection.execute(
        'UPDATE orders SET payment_status = ? WHERE id = ?',
        ['paid', payment.order_id]
      );

      // Update order status to paid if still pending
      await connection.execute(
        'UPDATE orders SET status = ? WHERE id = ? AND status = ?',
        ['paid', payment.order_id, 'pending']
      );

      await connection.commit();
      
      const updatedPayment = await this.findById(id);
      
      // Generate receipt PDF asynchronously (don't wait for it)
      // Import here to avoid circular dependency
      const Order = require('./Order');
      const ReceiptService = require('../services/ReceiptService');
      
      Order.findById(payment.order_id).then(order => {
        if (order) {
          return ReceiptService.generateReceipt(order, updatedPayment);
        }
      }).catch(error => {
        console.error('Receipt generation error:', error);
      });
      
      return updatedPayment;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all payments with filtering
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Payments
   */
  static async findAll(options = {}) {
    const {
      order_id = null,
      status = null,
      payment_method = null,
      verified = null,
      page = 1,
      limit = 20
    } = options;

    let query = 'SELECT * FROM payments WHERE 1=1';
    const params = [];

    if (order_id) {
      query += ' AND order_id = ?';
      params.push(order_id);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (payment_method) {
      query += ' AND payment_method = ?';
      params.push(payment_method);
    }

    if (verified !== null) {
      query += ' AND slipok_verified = ?';
      params.push(verified);
    }

    query += ' ORDER BY created_at DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [payments] = await db.pool.execute(query, params);
    
    // Convert MySQL BOOLEAN (0/1) to JavaScript boolean and add alias
    return payments.map(payment => {
      payment.verified = Boolean(payment.slipok_verified);
      return payment;
    });
  }

  /**
   * Delete payment (admin only)
   * @param {number} id - Payment ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const [result] = await db.pool.execute(
      'DELETE FROM payments WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }
}

module.exports = Payment;
