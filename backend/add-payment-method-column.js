/**
 * Add payment_method column to orders table
 * This script adds the missing payment_method column that should have been there from the start
 */

const db = require('./config/database');

async function addPaymentMethodColumn() {
  const connection = await db.pool.getConnection();
  
  try {
    console.log('🔧 Adding payment_method column to orders table...\n');

    // Check if column already exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'orders' 
        AND COLUMN_NAME = 'payment_method'
    `);

    if (columns.length > 0) {
      console.log('✅ Column payment_method already exists in orders table');
      return;
    }

    // Add the column
    await connection.query(`
      ALTER TABLE orders 
      ADD COLUMN payment_method ENUM('bank_transfer', 'promptpay', 'cod', 'cash', 'credit_card') 
      DEFAULT 'bank_transfer' 
      AFTER payment_status
    `);

    console.log('✅ Successfully added payment_method column to orders table');

    // Update existing orders to have a default payment_method
    const [result] = await connection.query(`
      UPDATE orders 
      SET payment_method = 'bank_transfer' 
      WHERE payment_method IS NULL
    `);

    console.log(`✅ Updated ${result.affectedRows} existing orders with default payment_method`);

    console.log('\n✨ Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Added payment_method column to orders table');
    console.log('   - Type: ENUM(\'bank_transfer\', \'promptpay\', \'cod\', \'cash\', \'credit_card\')');
    console.log('   - Default: bank_transfer');
    console.log('   - Position: After payment_status column');

  } catch (error) {
    console.error('❌ Error adding payment_method column:', error);
    throw error;
  } finally {
    connection.release();
    await db.pool.end();
  }
}

// Run the migration
addPaymentMethodColumn()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
