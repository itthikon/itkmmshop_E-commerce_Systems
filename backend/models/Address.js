const db = require('../config/database');

class Address {
  /**
   * Create a new address for a user
   */
  static async create(userId, addressData) {
    const {
      recipient_name,
      phone,
      address_line1,
      address_line2,
      subdistrict,
      district,
      province,
      postal_code,
      address_type = 'shipping',
      is_default = false
    } = addressData;

    // If this is set as default, unset other default addresses
    if (is_default) {
      await this.unsetDefaultAddresses(userId);
    }

    const query = `
      INSERT INTO addresses (
        user_id, address_type, recipient_name, phone, address_line1, 
        address_line2, subdistrict, district, province, postal_code, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      userId,
      address_type,
      recipient_name,
      phone,
      address_line1,
      address_line2 || null,
      subdistrict,
      district,
      province,
      postal_code,
      is_default
    ]);

    return result.insertId;
  }

  /**
   * Get all addresses for a user
   */
  static async findByUserId(userId) {
    const query = `
      SELECT * FROM addresses 
      WHERE user_id = ? 
      ORDER BY is_default DESC, created_at DESC
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows;
  }

  /**
   * Get a specific address
   */
  static async findById(id, userId) {
    const query = 'SELECT * FROM addresses WHERE id = ? AND user_id = ?';
    const [rows] = await db.execute(query, [id, userId]);
    return rows[0];
  }

  /**
   * Update an address
   */
  static async update(id, userId, addressData) {
    const {
      recipient_name,
      phone,
      address_line1,
      address_line2,
      subdistrict,
      district,
      province,
      postal_code,
      address_type,
      is_default
    } = addressData;

    // If this is set as default, unset other default addresses
    if (is_default) {
      await this.unsetDefaultAddresses(userId);
    }

    const query = `
      UPDATE addresses 
      SET recipient_name = ?, phone = ?, address_line1 = ?, address_line2 = ?, 
          subdistrict = ?, district = ?, province = ?, postal_code = ?, 
          address_type = ?, is_default = ?
      WHERE id = ? AND user_id = ?
    `;

    const [result] = await db.execute(query, [
      recipient_name,
      phone,
      address_line1,
      address_line2 || null,
      subdistrict,
      district,
      province,
      postal_code,
      address_type,
      is_default,
      id,
      userId
    ]);

    return result.affectedRows > 0;
  }

  /**
   * Delete an address
   */
  static async delete(id, userId) {
    const query = 'DELETE FROM addresses WHERE id = ? AND user_id = ?';
    const [result] = await db.execute(query, [id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * Unset all default addresses for a user
   */
  static async unsetDefaultAddresses(userId) {
    const query = 'UPDATE addresses SET is_default = false WHERE user_id = ?';
    await db.execute(query, [userId]);
  }

  /**
   * Get default address for a user
   */
  static async getDefaultAddress(userId) {
    const query = 'SELECT * FROM addresses WHERE user_id = ? AND is_default = true';
    const [rows] = await db.execute(query, [userId]);
    return rows[0];
  }
}

module.exports = Address;
