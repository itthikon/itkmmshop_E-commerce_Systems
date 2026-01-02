/**
 * Migration: Create transaction_categories table
 * 
 * This migration creates the transaction_categories table for the accounting system.
 * It includes unique constraints to prevent duplicate category names per type.
 * 
 * Requirements: 4.1
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function up() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'itkmmshop'
  });

  try {
    console.log('Creating transaction_categories table...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS transaction_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        description TEXT NULL,
        is_system BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_name_type (name, type),
        INDEX idx_type_active (type, is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ Transaction_categories table created successfully');
    console.log('✓ Migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function down() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'itkmmshop'
  });

  try {
    console.log('Dropping transaction_categories table...');

    await connection.query('DROP TABLE IF EXISTS transaction_categories');

    console.log('✓ Transaction_categories table dropped successfully');

  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'up') {
    up()
      .then(() => {
        console.log('Migration completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
      });
  } else if (command === 'down') {
    down()
      .then(() => {
        console.log('Rollback completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Rollback failed:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage: node create-transaction-categories-table.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };
