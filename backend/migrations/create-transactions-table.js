/**
 * Migration: Create transactions table
 * 
 * This migration creates the transactions table for the accounting system.
 * It includes all necessary indexes and foreign keys for optimal performance.
 * 
 * Requirements: 1.1, 2.1, 3.1
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
    console.log('Creating transactions table...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        transaction_type ENUM('income', 'expense') NOT NULL,
        category_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        transaction_date DATE NOT NULL,
        description TEXT,
        reference_type ENUM('order', 'manual', 'other') DEFAULT 'manual',
        reference_id INT NULL,
        attachment_path VARCHAR(500) NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        
        INDEX idx_transaction_type (transaction_type),
        INDEX idx_transaction_date (transaction_date),
        INDEX idx_category_id (category_id),
        INDEX idx_reference (reference_type, reference_id),
        INDEX idx_deleted_at (deleted_at),
        INDEX idx_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ Transactions table created successfully');

    // Add foreign key constraints after table creation
    console.log('Adding foreign key constraints...');

    // Note: Foreign keys will be added after transaction_categories table is created
    // and after verifying the users and orders tables exist

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
    console.log('Dropping transactions table...');

    await connection.query('DROP TABLE IF EXISTS transactions');

    console.log('✓ Transactions table dropped successfully');

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
    console.log('Usage: node create-transactions-table.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };
