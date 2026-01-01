const bcrypt = require('bcrypt');
const db = require('./config/database');

async function updatePasswords() {
  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);
    const staffPassword = await bcrypt.hash('staff123', 10);

    // Update admin password
    await db.pool.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [adminPassword, 'admin@itkmmshop.com']
    );

    // Update customer password
    await db.pool.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [customerPassword, 'customer@example.com']
    );

    // Update staff password
    await db.pool.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [staffPassword, 'staff@itkmmshop.com']
    );

    console.log('✓ Passwords updated successfully');
    console.log('  Admin: admin@itkmmshop.com / admin123');
    console.log('  Staff: staff@itkmmshop.com / staff123');
    console.log('  Customer: customer@example.com / customer123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating passwords:', error);
    process.exit(1);
  }
}

updatePasswords();
