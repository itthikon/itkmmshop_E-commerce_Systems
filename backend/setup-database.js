const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔄 Starting database setup...');
    
    // Connect to MySQL without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      // Only include password if it's not empty
      ...(process.env.DB_PASSWORD && { password: process.env.DB_PASSWORD }),
      charset: 'utf8mb4',
      multipleStatements: true
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'itkmmshop';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' created or already exists`);
    
    // Use the database
    await connection.execute(`USE \`${dbName}\``);
    console.log(`✅ Using database '${dbName}'`);
    
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'config', 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Execute the entire schema as one query (MySQL supports multiple statements)
    await connection.query(schema);
    
    console.log('✅ Database schema created successfully');
    
    // Insert sample data
    await insertSampleData(connection);
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function insertSampleData(connection) {
  console.log('🔄 Inserting sample data...');
  
  try {
    // Insert sample categories
    await connection.execute(`
      INSERT IGNORE INTO product_categories (id, name, description, status) VALUES
      (1, 'เสื้อผ้า', 'เสื้อผ้าแฟชั่นทุกประเภท', 'active'),
      (2, 'รองเท้า', 'รองเท้าแฟชั่นและกีฬา', 'active'),
      (3, 'กระเป๋า', 'กระเป๋าและอุปกรณ์เสริม', 'active'),
      (4, 'เครื่องประดับ', 'เครื่องประดับและนาฬิกา', 'active'),
      (5, 'อิเล็กทรอนิกส์', 'อุปกรณ์อิเล็กทรอนิกส์', 'active')
    `);
    
    // Insert sample products
    await connection.execute(`
      INSERT IGNORE INTO products (id, sku, name, description, category_id, price_excluding_vat, stock_quantity, status) VALUES
      (1, 'SHIRT001', 'เสื้อยืดคอกลม สีขาว', 'เสื้อยืดผ้าคอตตอน 100% สีขาว ใส่สบาย', 1, 280.37, 50, 'active'),
      (2, 'SHIRT002', 'เสื้อเชิ้ตแขนยาว สีฟ้า', 'เสื้อเชิ้ตผ้าคอตตอนแขนยาว สีฟ้าอ่อน', 1, 467.29, 30, 'active'),
      (3, 'SHOE001', 'รองเท้าผ้าใบ สีดำ', 'รองเท้าผ้าใบแฟชั่น สีดำ ใส่สบาย', 2, 934.58, 25, 'active'),
      (4, 'BAG001', 'กระเป๋าสะพายข้าง', 'กระเป๋าหนังแท้ สะพายข้าง สีน้ำตาล', 3, 1401.87, 15, 'active'),
      (5, 'WATCH001', 'นาฬิกาข้อมือ', 'นาฬิกาข้อมือแฟชั่น กันน้ำ', 4, 2336.45, 20, 'active')
    `);
    
    // Insert sample admin user
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.execute(`
      INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, role, status) VALUES
      (1, 'admin@itkmmshop.com', ?, 'Admin', 'User', 'admin', 'active')
    `, [hashedPassword]);
    
    // Insert sample voucher
    await connection.execute(`
      INSERT IGNORE INTO vouchers (id, code, name, description, discount_type, discount_value, minimum_order_amount, start_date, end_date, status) VALUES
      (1, 'WELCOME10', 'ส่วนลดต้อนรับ 10%', 'ส่วนลด 10% สำหรับลูกค้าใหม่', 'percentage', 10.00, 500.00, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 'active')
    `);
    
    console.log('✅ Sample data inserted successfully');
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
    throw error;
  }
}

// Run setup
setupDatabase();