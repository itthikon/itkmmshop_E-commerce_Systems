/**
 * Add prefix column to product_categories table
 * This migration adds support for category prefixes used in auto SKU generation
 * 
 * Requirements: 2.2, 2.3, 2.6
 */

const db = require('../config/database');

async function addCategoryPrefixColumn() {
  const connection = await db.pool.getConnection();
  
  try {
    console.log('🔧 Adding prefix column to product_categories table...\n');

    // Check if column already exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'product_categories' 
        AND COLUMN_NAME = 'prefix'
    `);

    if (columns.length > 0) {
      console.log('✅ Column prefix already exists in product_categories table');
      return;
    }

    // Add the prefix column
    await connection.query(`
      ALTER TABLE product_categories 
      ADD COLUMN prefix VARCHAR(4) DEFAULT NULL 
      COMMENT 'Category prefix for SKU generation (2-4 uppercase letters)'
      AFTER description
    `);

    console.log('✅ Successfully added prefix column to product_categories table');

    // Add unique constraint on prefix
    await connection.query(`
      ALTER TABLE product_categories 
      ADD UNIQUE KEY unique_prefix (prefix)
    `);

    console.log('✅ Successfully added unique constraint on prefix column');

    // Add index for better performance
    await connection.query(`
      ALTER TABLE product_categories 
      ADD INDEX idx_prefix (prefix)
    `);

    console.log('✅ Successfully added index on prefix column');

    console.log('\n✨ Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Added prefix column to product_categories table');
    console.log('   - Type: VARCHAR(4)');
    console.log('   - Default: NULL (existing categories have no prefix)');
    console.log('   - Constraint: UNIQUE (no duplicate prefixes allowed)');
    console.log('   - Index: idx_prefix for better query performance');
    console.log('   - Position: After description column');
    console.log('\n💡 Note: Existing categories will have NULL prefix.');
    console.log('   You can update them later through the Category Management interface.');

  } catch (error) {
    console.error('❌ Error adding prefix column:', error);
    throw error;
  } finally {
    connection.release();
    await db.pool.end();
  }
}

// Run the migration
addCategoryPrefixColumn()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
