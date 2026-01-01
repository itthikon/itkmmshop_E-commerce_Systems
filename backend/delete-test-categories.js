/**
 * Delete Test Categories
 * ลบหมวดหมู่ทดสอบที่มีชื่อว่า Category, Concurrent, หรือ Test
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function deleteTestCategories() {
  let connection;
  
  try {
    console.log('🔄 กำลังเชื่อมต่อฐานข้อมูล...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'shop_db',
      charset: 'utf8mb4'
    });

    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ\n');

    // Find test categories
    console.log('🔍 ค้นหาหมวดหมู่ทดสอบ...');
    const [testCategories] = await connection.execute(`
      SELECT id, name, prefix
      FROM product_categories
      WHERE name LIKE '%Category%' 
         OR name LIKE '%Concurrent%' 
         OR name LIKE '%Test%'
      ORDER BY id
    `);

    if (testCategories.length === 0) {
      console.log('✅ ไม่พบหมวดหมู่ทดสอบในระบบ');
      return;
    }

    console.log(`\n📋 พบหมวดหมู่ทดสอบ ${testCategories.length} รายการ:`);
    console.table(testCategories);

    // Check if any test category has products
    console.log('\n🔍 ตรวจสอบสินค้าในหมวดหมู่ทดสอบ...');
    const categoryIds = testCategories.map(c => c.id);
    
    const [productsInCategories] = await connection.execute(`
      SELECT 
        c.id,
        c.name,
        COUNT(p.id) as product_count
      FROM product_categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.id IN (${categoryIds.map(() => '?').join(',')})
      GROUP BY c.id, c.name
      HAVING product_count > 0
    `, categoryIds);

    if (productsInCategories.length > 0) {
      console.log('\n⚠️  หมวดหมู่ต่อไปนี้มีสินค้าอยู่:');
      console.table(productsInCategories);
      
      console.log('\n🔄 กำลังลบสินค้าในหมวดหมู่ทดสอบ...');
      for (const cat of productsInCategories) {
        const [result] = await connection.execute(
          'DELETE FROM products WHERE category_id = ?',
          [cat.id]
        );
        console.log(`   ✅ ลบสินค้า ${result.affectedRows} รายการจากหมวดหมู่ "${cat.name}" (ID: ${cat.id})`);
      }
    } else {
      console.log('✅ ไม่มีสินค้าในหมวดหมู่ทดสอบ');
    }

    // Delete test categories
    console.log('\n🗑️  กำลังลบหมวดหมู่ทดสอบ...\n');
    
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const category of testCategories) {
      try {
        const [result] = await connection.execute(
          'DELETE FROM product_categories WHERE id = ?',
          [category.id]
        );
        
        if (result.affectedRows > 0) {
          console.log(`✅ ลบหมวดหมู่: ${category.name} (${category.prefix}) - ID: ${category.id}`);
          deletedCount++;
        } else {
          console.log(`⚠️  ไม่สามารถลบ: ${category.name} (ID: ${category.id})`);
          failedCount++;
        }
      } catch (err) {
        console.error(`❌ เกิดข้อผิดพลาดกับหมวดหมู่ "${category.name}":`, err.message);
        failedCount++;
      }
    }

    // Show summary
    console.log('\n📊 สรุปผลการลบหมวดหมู่:');
    console.log(`   ✅ ลบสำเร็จ: ${deletedCount} หมวดหมู่`);
    console.log(`   ❌ ลบไม่สำเร็จ: ${failedCount} หมวดหมู่`);
    console.log(`   📝 ทั้งหมด: ${testCategories.length} หมวดหมู่`);

    // Show remaining categories
    console.log('\n📈 สถิติหมวดหมู่หลังลบ:');
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_categories,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_categories,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_categories
      FROM product_categories
    `);
    
    console.table(stats);

    // Show remaining categories list
    console.log('\n📂 หมวดหมู่ที่เหลือในระบบ:');
    const [remainingCategories] = await connection.execute(`
      SELECT id, name, prefix, status
      FROM product_categories
      ORDER BY id
    `);
    
    console.table(remainingCategories);

    console.log('\n✅ ลบหมวดหมู่ทดสอบสำเร็จ!');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 ปิดการเชื่อมต่อฐานข้อมูล');
    }
  }
}

// Run the script
deleteTestCategories();
