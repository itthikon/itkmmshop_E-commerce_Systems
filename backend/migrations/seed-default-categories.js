/**
 * Seed: Default transaction categories
 * 
 * This script seeds the default income and expense categories
 * for the accounting system.
 * 
 * Requirements: 4.1, 12.2, 12.3
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'itkmmshop'
  });

  try {
    console.log('Seeding default transaction categories...');

    // Default Income Categories
    const incomeCategories = [
      {
        name: 'ขายสินค้า',
        type: 'income',
        description: 'รายได้จากการขายสินค้า',
        is_system: true
      },
      {
        name: 'ดอกเบี้ย',
        type: 'income',
        description: 'ดอกเบี้ยรับ',
        is_system: true
      },
      {
        name: 'รายได้อื่นๆ',
        type: 'income',
        description: 'รายได้อื่นๆ',
        is_system: true
      }
    ];

    // Default Expense Categories
    const expenseCategories = [
      {
        name: 'ซื้อสินค้า',
        type: 'expense',
        description: 'ต้นทุนสินค้า',
        is_system: true
      },
      {
        name: 'ค่าเช่า',
        type: 'expense',
        description: 'ค่าเช่าสถานที่',
        is_system: true
      },
      {
        name: 'ค่าไฟฟ้า',
        type: 'expense',
        description: 'ค่าไฟฟ้า',
        is_system: true
      },
      {
        name: 'ค่าน้ำประปา',
        type: 'expense',
        description: 'ค่าน้ำประปา',
        is_system: true
      },
      {
        name: 'ค่าขนส่ง',
        type: 'expense',
        description: 'ค่าขนส่งสินค้า',
        is_system: true
      },
      {
        name: 'ค่าโฆษณา',
        type: 'expense',
        description: 'ค่าโฆษณาและการตลาด',
        is_system: true
      },
      {
        name: 'เงินเดือน',
        type: 'expense',
        description: 'เงินเดือนพนักงาน',
        is_system: true
      },
      {
        name: 'ค่าใช้จ่ายอื่นๆ',
        type: 'expense',
        description: 'ค่าใช้จ่ายอื่นๆ',
        is_system: true
      }
    ];

    // Combine all categories
    const allCategories = [...incomeCategories, ...expenseCategories];

    // Insert categories
    for (const category of allCategories) {
      await connection.query(
        `INSERT INTO transaction_categories (name, type, description, is_system, is_active)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         description = VALUES(description),
         is_system = VALUES(is_system),
         is_active = VALUES(is_active)`,
        [category.name, category.type, category.description, category.is_system, true]
      );
      console.log(`✓ Seeded category: ${category.name} (${category.type})`);
    }

    console.log(`✓ Successfully seeded ${allCategories.length} default categories`);
    console.log('  - Income categories: 3');
    console.log('  - Expense categories: 8');

  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function unseed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'itkmmshop'
  });

  try {
    console.log('Removing default transaction categories...');

    await connection.query(
      'DELETE FROM transaction_categories WHERE is_system = true'
    );

    console.log('✓ Default categories removed successfully');

  } catch (error) {
    console.error('Unseed failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run seed if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'seed' || !command) {
    seed()
      .then(() => {
        console.log('Seeding completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
      });
  } else if (command === 'unseed') {
    unseed()
      .then(() => {
        console.log('Unseed completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Unseed failed:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage: node seed-default-categories.js [seed|unseed]');
    process.exit(1);
  }
}

module.exports = { seed, unseed };
