const db = require('../config/database');

class Voucher {
  /**
   * Get all vouchers
   */
  static async getAll(filters = {}) {
    let query = 'SELECT * FROM vouchers WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.active_only) {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      query += ' AND status = "active" AND start_date <= ? AND end_date >= ?';
      params.push(now, now);
    }

    query += ' ORDER BY created_at DESC';

    const [vouchers] = await db.query(query, params);
    return vouchers;
  }

  /**
   * Get voucher by ID
   */
  static async getById(id) {
    const [vouchers] = await db.query('SELECT * FROM vouchers WHERE id = ?', [id]);
    return vouchers.length > 0 ? vouchers[0] : null;
  }

  /**
   * Get voucher by code
   */
  static async getByCode(code) {
    const [vouchers] = await db.query('SELECT * FROM vouchers WHERE code = ?', [code]);
    return vouchers.length > 0 ? vouchers[0] : null;
  }

  /**
   * Create new voucher
   */
  static async create(voucherData) {
    const {
      code,
      name,
      description,
      discount_type,
      discount_value,
      minimum_order_amount,
      max_discount_amount,
      usage_limit,
      usage_limit_per_customer,
      start_date,
      end_date,
      status
    } = voucherData;

    const [result] = await db.query(`
      INSERT INTO vouchers (
        code, name, description, discount_type, discount_value,
        minimum_order_amount, max_discount_amount, usage_limit,
        usage_limit_per_customer, start_date, end_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code,
      name,
      description || null,
      discount_type,
      discount_value,
      minimum_order_amount || 0,
      max_discount_amount || null,
      usage_limit || null,
      usage_limit_per_customer || 1,
      start_date,
      end_date,
      status || 'active'
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Update voucher
   */
  static async update(id, voucherData) {
    const fields = [];
    const values = [];

    const allowedFields = [
      'name', 'description', 'discount_type', 'discount_value',
      'minimum_order_amount', 'max_discount_amount', 'usage_limit',
      'usage_limit_per_customer', 'start_date', 'end_date', 'status'
    ];

    allowedFields.forEach(field => {
      if (voucherData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(voucherData[field]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    await db.query(
      `UPDATE vouchers SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.getById(id);
  }

  /**
   * Delete voucher
   */
  static async delete(id) {
    await db.query('DELETE FROM vouchers WHERE id = ?', [id]);
  }

  /**
   * Validate voucher for use
   */
  static async validate(code, orderAmount, userId = null) {
    const voucher = await this.getByCode(code);

    if (!voucher) {
      return {
        valid: false,
        error: 'Invalid voucher code'
      };
    }

    if (voucher.status !== 'active') {
      return {
        valid: false,
        error: 'Voucher is not active'
      };
    }

    // Check dates
    const now = new Date();
    const startDate = new Date(voucher.start_date);
    const endDate = new Date(voucher.end_date);

    if (now < startDate) {
      return {
        valid: false,
        error: 'Voucher not yet active'
      };
    }

    if (now > endDate) {
      return {
        valid: false,
        error: 'Voucher has expired'
      };
    }

    // Check usage limits
    if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
      return {
        valid: false,
        error: 'Voucher usage limit reached'
      };
    }

    // Check per-customer usage limit
    if (userId && voucher.usage_limit_per_customer) {
      const [usageRecords] = await db.query(
        'SELECT COUNT(*) as count FROM voucher_usage WHERE voucher_id = ? AND user_id = ?',
        [voucher.id, userId]
      );

      if (usageRecords[0].count >= voucher.usage_limit_per_customer) {
        return {
          valid: false,
          error: 'You have reached the usage limit for this voucher'
        };
      }
    }

    // Check minimum order amount
    if (orderAmount < voucher.minimum_order_amount) {
      return {
        valid: false,
        error: `Minimum order amount of ${voucher.minimum_order_amount} required`
      };
    }

    return {
      valid: true,
      voucher: voucher
    };
  }

  /**
   * Calculate discount amount
   */
  static calculateDiscount(voucher, subtotalExcludingVat) {
    let discountAmount = 0;

    if (voucher.discount_type === 'percentage') {
      discountAmount = subtotalExcludingVat * (voucher.discount_value / 100);
      if (voucher.max_discount_amount && discountAmount > voucher.max_discount_amount) {
        discountAmount = voucher.max_discount_amount;
      }
    } else {
      discountAmount = voucher.discount_value;
    }

    return Math.min(discountAmount, subtotalExcludingVat);
  }

  /**
   * Record voucher usage
   */
  static async recordUsage(voucherId, userId = null, orderId = null) {
    await db.query(
      'INSERT INTO voucher_usage (voucher_id, user_id, order_id) VALUES (?, ?, ?)',
      [voucherId, userId, orderId]
    );

    // Increment usage count
    await db.query(
      'UPDATE vouchers SET usage_count = usage_count + 1 WHERE id = ?',
      [voucherId]
    );
  }

  /**
   * Get voucher usage history
   */
  static async getUsageHistory(voucherId) {
    const [records] = await db.query(`
      SELECT 
        vu.*,
        u.email as user_email,
        u.first_name,
        u.last_name,
        o.order_number
      FROM voucher_usage vu
      LEFT JOIN users u ON vu.user_id = u.id
      LEFT JOIN orders o ON vu.order_id = o.id
      WHERE vu.voucher_id = ?
      ORDER BY vu.used_at DESC
    `, [voucherId]);

    return records;
  }
}

module.exports = Voucher;
