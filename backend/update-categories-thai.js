/**
 * Update Categories to Thai Names with English Prefixes
 * อัพเดทหมวดหมู่สินค้าให้เป็นภาษาไทย พร้อม Prefix ภาษาอังกฤษ
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const categories = [
  { id: 1, name: 'เสื้อผ้า', prefix: 'CLTH', description: 'เสื้อผ้าและเครื่องแต่งกาย' },
  { id: 2, name: 'รองเท้า', prefix: 'SHOE', description: 'รองเท้าทุกประเภท' },
  { id: 3, name: 'กระเป๋า', prefix: 'BAG', description: 'กระเป๋าและเครื่องหนัง' },
  { id: 4, name: 'เครื่องประดับ', prefix: 'JWLR', description: 'เครื่องประดับและอุปกรณ์เสริม' },
  { id: 5, name: 'อิเล็กทรอนิกส์', prefix: 'ELEC', description: 'อุปกรณ์อิเล็กทรอนิกส์' }
];

async function updateCategories() {
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

    // Check existing categories
    console.log('📋 ตรวจสอบหมวดหมู่ที่มีอยู่:');
    const [existingCategories] = await connection.execute(
      'SELECT id, name, prefix FROM product_categories ORDER BY id'
    );
    
    console.table(existingCategories);
    console.log('');

    // Update each category
    console.log('🔄 กำลังอัพเดทหมวดหมู่...\n');
    
    for (const category of categories) {
      try {
        const [result] = await connection.execute(
          `UPDATE product_categories 
           SET name = ?, prefix = ?, description = ?
           WHERE id = ?`,
          [category.name, category.prefix, category.description, category.id]
        );

        if (result.affectedRows > 0) {
          console.log(`✅ อัพเดทหมวดหมู่ ID ${category.id}: ${category.name} (${category.prefix})`);
        } else {
          console.log(`⚠️  ไม่พบหมวดหมู่ ID ${category.id} - กำลังสร้างใหม่...`);
          
          // Insert if not exists
          await connection.execute(
            `INSERT INTO product_categories (id, name, prefix, description, status)
             VALUES (?, ?, ?, ?, 'active')`,
            [category.id, category.name, category.prefix, category.description]
          );
          
          console.log(`✅ สร้างหมวดหมู่ใหม่ ID ${category.id}: ${category.name} (${category.prefix})`);
        }
      } catch (err) {
        console.error(`❌ เกิดข้อผิดพลาดกับหมวดหมู่ ID ${category.id}:`, err.message);
      }
    }

    // Show updated categories
    console.log('\n📊 หมวดหมู่หลังอัพเดท:');
    const [updatedCategories] = await connection.execute(
      'SELECT id, name, prefix, description, status FROM product_categories ORDER BY id'
    );
    
    console.table(updatedCategories);

    // Check products using these categories
    console.log('\n📦 จำนวนสินค้าในแต่ละหมวดหมู่:');
    const [productCounts] = await connection.execute(`
      SELECT 
        c.id,
        c.name as category_name,
        c.prefix,
        COUNT(p.id) as product_count
      FROM product_categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name, c.prefix
      ORDER BY c.id
    `);
    
    console.table(productCounts);

    console.log('\n✅ อัพเดทหมวดหมู่สำเร็จ!');
    console.log('\n💡 หมายเหตุ:');
    console.log('   - ชื่อหมวดหมู่เป็นภาษาไทย');
    console.log('   - Prefix เป็นภาษาอังกฤษ 3-4 ตัวอักษร');
    console.log('   - SKU ของสินค้าที่มีอยู่จะไม่เปลี่ยนแปลง');
    console.log('   - สินค้าใหม่จะใช้ Prefix ใหม่');

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

// Run the update
updateCategories();
