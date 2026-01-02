/**
 * Migration: Create accounting_settings table
 * 
 * This migration creates the accounting_settings table for storing
 * system-wide accounting configuration.
 * 
 * Requirements: 12.1
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
    console.log('Creating accounting_settings table...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS accounting_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        updated_by INT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_setting_key (setting_key),
        INDEX idx_updated_by (updated_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ Accounting_settings table created successfully');
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
    console.log('Dropping accounting_settings table...');

    await connection.query('DROP TABLE IF EXISTS accounting_settings');

    console.log('✓ Accounting_settings table dropped successfully');

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
    console.log('Usage: node create-accounting-settings-table.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };
