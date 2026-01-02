/**
 * Master Migration Script: Accounting System
 * 
 * This script runs all accounting system migrations in the correct order:
 * 1. Create transaction_categories table
 * 2. Create accounting_settings table
 * 3. Create transactions table
 * 4. Add foreign key constraints
 * 5. Seed default categories
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const createTransactionCategoriesTable = require('./create-transaction-categories-table');
const createAccountingSettingsTable = require('./create-accounting-settings-table');
const createTransactionsTable = require('./create-transactions-table');
const seedDefaultCategories = require('./seed-default-categories');

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'itkmmshop'
  });

  try {
    console.log('='.repeat(60));
    console.log('Running Accounting System Migrations');
    console.log('='.repeat(60));
    console.log();

    // Step 1: Create transaction_categories table
    console.log('Step 1/5: Creating transaction_categories table...');
    await createTransactionCategoriesTable.up();
    console.log();

    // Step 2: Create accounting_settings table
    console.log('Step 2/5: Creating accounting_settings table...');
    await createAccountingSettingsTable.up();
    console.log();

    // Step 3: Create transactions table
    console.log('Step 3/5: Creating transactions table...');
    await createTransactionsTable.up();
    console.log();

    // Step 4: Add foreign key constraints
    console.log('Step 4/5: Adding foreign key constraints...');
    
    // Add foreign key to transaction_categories
    try {
      await connection.query(`
        ALTER TABLE transactions
        ADD CONSTRAINT fk_transactions_category
        FOREIGN KEY (category_id) REFERENCES transaction_categories(id)
      `);
      console.log('✓ Added foreign key: transactions -> transaction_categories');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('  Foreign key already exists: transactions -> transaction_categories');
      } else {
        throw error;
      }
    }

    // Add foreign key to users
    try {
      await connection.query(`
        ALTER TABLE transactions
        ADD CONSTRAINT fk_transactions_user
        FOREIGN KEY (created_by) REFERENCES users(id)
      `);
      console.log('✓ Added foreign key: transactions -> users');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('  Foreign key already exists: transactions -> users');
      } else {
        throw error;
      }
    }

    // Add foreign key to orders (optional, can be null)
    try {
      await connection.query(`
        ALTER TABLE transactions
        ADD CONSTRAINT fk_transactions_order
        FOREIGN KEY (reference_id) REFERENCES orders(id) ON DELETE SET NULL
      `);
      console.log('✓ Added foreign key: transactions -> orders');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('  Foreign key already exists: transactions -> orders');
      } else {
        throw error;
      }
    }

    // Add foreign key for accounting_settings
    try {
      await connection.query(`
        ALTER TABLE accounting_settings
        ADD CONSTRAINT fk_accounting_settings_user
        FOREIGN KEY (updated_by) REFERENCES users(id)
      `);
      console.log('✓ Added foreign key: accounting_settings -> users');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('  Foreign key already exists: accounting_settings -> users');
      } else {
        throw error;
      }
    }

    console.log();

    // Step 5: Seed default categories
    console.log('Step 5/5: Seeding default categories...');
    await seedDefaultCategories.seed();
    console.log();

    console.log('='.repeat(60));
    console.log('✓ All migrations completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error();
    console.error('='.repeat(60));
    console.error('✗ Migration failed:', error.message);
    console.error('='.repeat(60));
    throw error;
  } finally {
    await connection.end();
  }
}

async function rollbackMigrations() {
  console.log('='.repeat(60));
  console.log('Rolling back Accounting System Migrations');
  console.log('='.repeat(60));
  console.log();

  try {
    // Rollback in reverse order
    console.log('Step 1/3: Removing default categories...');
    await seedDefaultCategories.unseed();
    console.log();

    console.log('Step 2/3: Dropping transactions table...');
    await createTransactionsTable.down();
    console.log();

    console.log('Step 3/3: Dropping accounting_settings table...');
    await createAccountingSettingsTable.down();
    console.log();

    console.log('Step 4/3: Dropping transaction_categories table...');
    await createTransactionCategoriesTable.down();
    console.log();

    console.log('='.repeat(60));
    console.log('✓ All migrations rolled back successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error();
    console.error('='.repeat(60));
    console.error('✗ Rollback failed:', error.message);
    console.error('='.repeat(60));
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'up' || !command) {
    runMigrations()
      .then(() => {
        console.log();
        console.log('You can now start using the accounting system!');
        process.exit(0);
      })
      .catch((error) => {
        console.error();
        console.error('Please fix the error and try again.');
        process.exit(1);
      });
  } else if (command === 'down') {
    rollbackMigrations()
      .then(() => {
        console.log();
        console.log('Accounting system tables removed.');
        process.exit(0);
      })
      .catch((error) => {
        console.error();
        console.error('Please fix the error and try again.');
        process.exit(1);
      });
  } else {
    console.log('Usage: node run-accounting-migrations.js [up|down]');
    process.exit(1);
  }
}

module.exports = { runMigrations, rollbackMigrations };
