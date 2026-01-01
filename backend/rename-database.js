const mysql = require('mysql2/promise');
require('dotenv').config();

async function renameDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD
  });

  try {
    console.log('🔄 กำลังสร้างฐานข้อมูล itkmmshop22...');
    
    // Create new database
    await connection.query('CREATE DATABASE IF NOT EXISTS itkmmshop22');
    console.log('✅ สร้างฐานข้อมูล itkmmshop22 สำเร็จ');

    // Get all tables from old database
    const [tables] = await connection.query('SHOW TABLES FROM itkmmshop');
    
    if (tables.length === 0) {
      console.log('⚠️  ไม่พบตารางในฐานข้อมูล itkmmshop');
      console.log('💡 กรุณารัน: node setup-database.js');
      return;
    }

    console.log(`\n📋 พบ ${tables.length} ตาราง กำลังคัดลอก...`);

    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Copy each table
    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      console.log(`   คัดลอก ${tableName}...`);
      
      // Get create table statement
      const [createResult] = await connection.query(`SHOW CREATE TABLE itkmmshop.${tableName}`);
      const createStatement = createResult[0]['Create Table'];
      
      // Create table in new database
      await connection.query(`USE itkmmshop22`);
      await connection.query(createStatement);
      
      // Copy data
      await connection.query(`INSERT INTO itkmmshop22.${tableName} SELECT * FROM itkmmshop.${tableName}`);
    }

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n✅ คัดลอกข้อมูลทั้งหมดสำเร็จ!');
    console.log('\n📊 สรุป:');
    console.log(`   - ฐานข้อมูลเดิม: itkmmshop`);
    console.log(`   - ฐานข้อมูลใหม่: itkmmshop22`);
    console.log(`   - จำนวนตาราง: ${tables.length}`);
    
    console.log('\n⚠️  หมายเหตุ:');
    console.log('   - ฐานข้อมูลเดิม (itkmmshop) ยังคงอยู่');
    console.log('   - หากต้องการลบ ให้รันคำสั่ง: DROP DATABASE itkmmshop;');
    console.log('   - ระบบจะใช้ฐานข้อมูล itkmmshop22 ตาม .env');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

renameDatabase()
  .then(() => {
    console.log('\n🎉 เสร็จสิ้น!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 ล้มเหลว:', error);
    process.exit(1);
  });
