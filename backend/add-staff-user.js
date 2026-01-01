const bcrypt = require('bcrypt');
const db = require('./config/database');

async function addStaffUser() {
  try {
    // Hash password
    const staffPassword = await bcrypt.hash('staff123', 10);

    // Check if staff user already exists
    const [existing] = await db.pool.execute(
      'SELECT id FROM users WHERE email = ?',
      ['staff@itkmmshop.com']
    );

    if (existing.length > 0) {
      console.log('⚠ Staff user already exists');
      
      // Update password
      await db.pool.execute(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [staffPassword, 'staff@itkmmshop.com']
      );
      console.log('✓ Staff password updated');
    } else {
      // Insert new staff user
      await db.pool.execute(
        `INSERT INTO users (
          email, password_hash, first_name, last_name, role
        ) VALUES (?, ?, ?, ?, ?)`,
        ['staff@itkmmshop.com', staffPassword, 'Staff', 'User', 'staff']
      );
      console.log('✓ Staff user created successfully');
    }

    console.log('\nStaff Account:');
    console.log('  Email: staff@itkmmshop.com');
    console.log('  Password: staff123');
    console.log('  Role: staff');
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding staff user:', error);
    process.exit(1);
  }
}

addStaffUser();
