const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  /**
   * Create a new user
   */
  static async create(userData) {
    const {
      email,
      password,
      first_name,
      last_name,
      gender,
      birth_date,
      phone,
      role = 'customer'
    } = userData;

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (
        email, password_hash, first_name, last_name, 
        gender, birth_date, phone, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      email,
      password_hash,
      first_name,
      last_name,
      gender,
      birth_date,
      phone,
      role
    ]);

    return result.insertId;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await db.execute(query, [email]);
    return rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update user profile
   */
  static async update(id, userData) {
    const {
      first_name,
      last_name,
      gender,
      birth_date,
      phone
    } = userData;

    const query = `
      UPDATE users 
      SET first_name = ?, last_name = ?, gender = ?, 
          birth_date = ?, phone = ?
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [
      first_name,
      last_name,
      gender,
      birth_date,
      phone,
      id
    ]);

    return result.affectedRows > 0;
  }

  /**
   * Get user profile without sensitive data
   */
  static async getProfile(id) {
    const query = `
      SELECT id, email, first_name, last_name, gender, 
             birth_date, phone, role, created_at, updated_at
      FROM users 
      WHERE id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }
}

module.exports = User;
