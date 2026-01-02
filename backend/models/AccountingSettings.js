const db = require('../config/database');

/**
 * AccountingSettings Model
 * Handles accounting system configuration settings
 */
class AccountingSettings {
  /**
   * Get a setting by key
   * @param {string} key - Setting key
   * @returns {Promise<string|null>} Setting value or null if not found
   */
  static async get(key) {
    const query = `
      SELECT setting_value FROM accounting_settings WHERE setting_key = ?
    `;
    
    const [rows] = await db.pool.execute(query, [key]);
    return rows.length > 0 ? rows[0].setting_value : null;
  }

  /**
   * Set a setting value (create or update)
   * @param {string} key - Setting key
   * @param {string} value - Setting value
   * @param {number} userId - User ID who is updating the setting
   * @returns {Promise<Object>} Setting data
   */
  static async set(key, value, userId) {
    if (!key || value === undefined || value === null) {
      throw new Error('Key and value are required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check if setting exists
    const existing = await this.get(key);

    if (existing !== null) {
      // Update existing setting
      const query = `
        UPDATE accounting_settings 
        SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE setting_key = ?
      `;
      
      await db.pool.execute(query, [value, userId, key]);
    } else {
      // Create new setting
      const query = `
        INSERT INTO accounting_settings (setting_key, setting_value, updated_by)
        VALUES (?, ?, ?)
      `;
      
      await db.pool.execute(query, [key, value, userId]);
    }

    return this.findByKey(key);
  }

  /**
   * Get all settings
   * @returns {Promise<Array>} All settings
   */
  static async getAll() {
    const query = `
      SELECT 
        s.*,
        u.email as updated_by_email
      FROM accounting_settings s
      LEFT JOIN users u ON s.updated_by = u.id
      ORDER BY s.setting_key ASC
    `;
    
    const [rows] = await db.pool.execute(query);
    return rows;
  }

  /**
   * Get all settings as key-value object
   * @returns {Promise<Object>} Settings as object
   */
  static async getAllAsObject() {
    const settings = await this.getAll();
    const result = {};
    
    settings.forEach(setting => {
      result[setting.setting_key] = setting.setting_value;
    });
    
    return result;
  }

  /**
   * Find setting by key with metadata
   * @param {string} key - Setting key
   * @returns {Promise<Object|null>} Setting data with metadata or null
   */
  static async findByKey(key) {
    const query = `
      SELECT 
        s.*,
        u.email as updated_by_email
      FROM accounting_settings s
      LEFT JOIN users u ON s.updated_by = u.id
      WHERE s.setting_key = ?
    `;
    
    const [rows] = await db.pool.execute(query, [key]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Delete a setting
   * @param {string} key - Setting key
   * @returns {Promise<boolean>} Success status
   */
  static async delete(key) {
    const query = `DELETE FROM accounting_settings WHERE setting_key = ?`;
    const [result] = await db.pool.execute(query, [key]);
    return result.affectedRows > 0;
  }

  /**
   * Get opening balance setting
   * @returns {Promise<number>} Opening balance
   */
  static async getOpeningBalance() {
    const value = await this.get('opening_balance');
    return value ? parseFloat(value) : 0;
  }

  /**
   * Set opening balance
   * @param {number} balance - Opening balance
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Setting data
   */
  static async setOpeningBalance(balance, userId) {
    return this.set('opening_balance', balance.toString(), userId);
  }

  /**
   * Get fiscal year start date setting
   * @returns {Promise<string|null>} Fiscal year start date (MM-DD format)
   */
  static async getFiscalYearStart() {
    return this.get('fiscal_year_start');
  }

  /**
   * Set fiscal year start date
   * @param {string} date - Fiscal year start date (MM-DD format)
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Setting data
   */
  static async setFiscalYearStart(date, userId) {
    // Validate date format (MM-DD)
    const datePattern = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
    if (!datePattern.test(date)) {
      throw new Error('Invalid date format. Use MM-DD format');
    }
    
    return this.set('fiscal_year_start', date, userId);
  }

  /**
   * Get default income categories setting
   * @returns {Promise<Array>} Default income categories
   */
  static async getDefaultIncomeCategories() {
    const value = await this.get('default_income_categories');
    return value ? JSON.parse(value) : [];
  }

  /**
   * Set default income categories
   * @param {Array} categories - Array of category names
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Setting data
   */
  static async setDefaultIncomeCategories(categories, userId) {
    if (!Array.isArray(categories)) {
      throw new Error('Categories must be an array');
    }
    
    return this.set('default_income_categories', JSON.stringify(categories), userId);
  }

  /**
   * Get default expense categories setting
   * @returns {Promise<Array>} Default expense categories
   */
  static async getDefaultExpenseCategories() {
    const value = await this.get('default_expense_categories');
    return value ? JSON.parse(value) : [];
  }

  /**
   * Set default expense categories
   * @param {Array} categories - Array of category names
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Setting data
   */
  static async setDefaultExpenseCategories(categories, userId) {
    if (!Array.isArray(categories)) {
      throw new Error('Categories must be an array');
    }
    
    return this.set('default_expense_categories', JSON.stringify(categories), userId);
  }

  /**
   * Initialize default settings
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  static async initializeDefaults(userId) {
    const defaults = {
      'opening_balance': '0',
      'fiscal_year_start': '01-01',
      'default_income_categories': JSON.stringify(['ขายสินค้า', 'ดอกเบี้ย', 'รายได้อื่นๆ']),
      'default_expense_categories': JSON.stringify([
        'ซื้อสินค้า',
        'ค่าเช่า',
        'ค่าไฟฟ้า',
        'ค่าน้ำประปา',
        'ค่าขนส่ง',
        'ค่าโฆษณา',
        'เงินเดือน',
        'ค่าใช้จ่ายอื่นๆ'
      ])
    };

    for (const [key, value] of Object.entries(defaults)) {
      const existing = await this.get(key);
      if (existing === null) {
        await this.set(key, value, userId);
      }
    }
  }
}

module.exports = AccountingSettings;
