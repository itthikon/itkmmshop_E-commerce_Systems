const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Update email accounts to match itkmmshop22 branding
 */
async function updateEmailAccounts() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'itkmmshop22'
    });

    console.log('✅ เชื่อมต่อ database สำเร็จ');

    // Update admin email
    const [adminResult] = await connection.execute(
      `UPDATE users 
       SET email = 'admin@itkmmshop22.com',
           first_name = 'Admin',
           last_name = 'itkmmshop22'
       WHERE role = 'admin' AND email LIKE '%admin%'`,
      []
    );
    console.log(`✅ อัปเดตบัญชี Admin: ${adminResult.affectedRows} รายการ`);

    // Update staff email
    const [staffResult] = await connection.execute(
      `UPDATE users 
       SET email = 'staff@itkmmshop22.com',
           first_name = 'Staff',
           last_name = 'itkmmshop22'
       WHERE role = 'staff' AND email LIKE '%staff%'`,
      []
    );
    console.log(`✅ อัปเดตบัญชี Staff: ${staffResult.affectedRows} รายการ`);

    // Update customer email (if exists)
    const [customerResult] = await connection.execute(
      `UPDATE users 
       SET email = 'customer@itkmmshop22.com',
           first_name = 'Customer',
           last_name = 'Test'
       WHERE role = 'customer' AND email LIKE '%customer%example%'`,
      []
    );
    console.log(`✅ อัปเดตบัญชี Customer: ${customerResult.affectedRows} รายการ`);

    // Display updated accounts
    console.log('\n📋 บัญชีที่อัปเดตแล้ว:');
    const [users] = await connection.execute(
      `SELECT id, email, first_name, last_name, role, created_at 
       FROM users 
       WHERE email LIKE '%itkmmshop22%' OR email LIKE '%customer%'
       ORDER BY role, id`
    );

    console.table(users);

    console.log('\n✅ อัปเดตอีเมลบัญชีทดสอบเรียบร้อยแล้ว!');
    console.log('\n📝 บัญชีทดสอบ:');
    console.log('   Admin:    admin@itkmmshop22.com / admin123');
    console.log('   Staff:    staff@itkmmshop22.com / staff123');
    console.log('   Customer: customer@itkmmshop22.com / customer123');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ ปิดการเชื่อมต่อ database แล้ว');
    }
  }
}

// Run the update
updateEmailAccounts();
