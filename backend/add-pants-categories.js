/**
 * Add Women's Pants Categories
 * เพิ่มหมวดหมู่กางเกงต่างๆของผู้หญิง
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pantsCategories = [
  { name: 'กางเกงขายาว', prefix: 'LONG', description: 'กางเกงขายาวผู้หญิงทุกแบบ' },
  { name: 'กางเกงขาสั้น', prefix: 'SHRT', description: 'กางเกงขาสั้นและกางเกงฮอตแพนท์' },
  { name: 'กางเกงยีนส์', prefix: 'JEAN', description: 'กางเกงยีนส์ผู้หญิงทุกทรง' },
  { name: 'กางเกงขากระบอก', prefix: 'WIDE', description: 'กางเกงขากระบอกและขาบาน Wide Leg' },
  { name: 'กางเกงขาเดฟ', prefix: 'SLIM', description: 'กางเกงขาเดฟและสกินนี่ Slim Fit' },
  { name: 'กางเกงเอวสูง', prefix: 'HIGH', description: 'กางเกงเอวสูง High Waist' },
  { name: 'กางเกงวอร์ม', prefix: 'JGGR', description: 'กางเกงวอร์มและจ็อกเกอร์ Jogger' },
  { name: 'กางเกงขาม้า', prefix: 'BOOT', description: 'กางเกงขาม้า Bootcut' },
  { name: 'กางเกงผ้าลินิน', prefix: 'LINN', description: 'กางเกงผ้าลินินและผ้าบาง' },
  { name: 'กางเกงเลกกิ้ง', prefix: 'LEGG', description: 'เลกกิ้งและกางเกงรัดรูป Leggings' }
];

async function addPantsCategories() {
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
      'SELECT id, name, prefix FROM product_categories ORDER BY id DESC LIMIT 10'
    );
    
    console.table(existingCategories);
    console.log('');

    // Add each category
    console.log('🔄 กำลังเพิ่มหมวดหมู่กางเกงผู้หญิง...\n');
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const category of pantsCategories) {
      try {
        // Check if prefix already exists
        const [existing] = await connection.execute(
          'SELECT id, name FROM product_categories WHERE prefix = ?',
          [category.prefix]
        );

        if (existing.length > 0) {
          console.log(`⚠️  ข้าม: ${category.name} (${category.prefix}) - Prefix มีอยู่แล้ว (ID: ${existing[0].id})`);
          skipCount++;
          continue;
        }

        // Insert new category
        const [result] = await connection.execute(
          `INSERT INTO product_categories (name, prefix, description, status)
           VALUES (?, ?, ?, 'active')`,
          [category.name, category.prefix, category.description]
        );
        
        console.log(`✅ เพิ่มหมวดหมู่: ${category.name} (${category.prefix}) - ID: ${result.insertId}`);
        successCount++;
        
      } catch (err) {
        console.error(`❌ เกิดข้อผิดพลาดกับหมวดหมู่ "${category.name}":`, err.message);
      }
    }

    // Show summary
    console.log('\n📊 สรุปผลการเพิ่มหมวดหมู่:');
    console.log(`   ✅ เพิ่มสำเร็จ: ${successCount} หมวดหมู่`);
    console.log(`   ⚠️  ข้าม: ${skipCount} หมวดหมู่`);
    console.log(`   📝 ทั้งหมด: ${pantsCategories.length} หมวดหมู่`);

    // Show all pants categories
    console.log('\n👖 หมวดหมู่กางเกงทั้งหมด:');
    const [allPantsCategories] = await connection.execute(`
      SELECT id, name, prefix, description, status
      FROM product_categories
      WHERE prefix IN (${pantsCategories.map(() => '?').join(',')})
      ORDER BY id
    `, pantsCategories.map(c => c.prefix));
    
    console.table(allPantsCategories);

    // Show total categories
    console.log('\n📈 สถิติหมวดหมู่ทั้งหมด:');
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_categories,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_categories,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_categories
      FROM product_categories
    `);
    
    console.table(stats);

    console.log('\n✅ เพิ่มหมวดหมู่กางเกงผู้หญิงสำเร็จ!');
    console.log('\n💡 ตัวอย่าง SKU ที่จะถูกสร้าง:');
    console.log('   - กางเกงขายาว: LONG00001, LONG00002, LONG00003...');
    console.log('   - กางเกงขาสั้น: SHRT00001, SHRT00002, SHRT00003...');
    console.log('   - กางเกงยีนส์: JEAN00001, JEAN00002, JEAN00003...');
    console.log('   - กางเกงขากระบอก: WIDE00001, WIDE00002, WIDE00003...');
    console.log('   - กางเกงขาเดฟ: SLIM00001, SLIM00002, SLIM00003...');
    console.log('   - กางเกงเอวสูง: HIGH00001, HIGH00002, HIGH00003...');
    console.log('   - กางเกงวอร์ม: JGGR00001, JGGR00002, JGGR00003...');
    console.log('   - กางเกงขาม้า: BOOT00001, BOOT00002, BOOT00003...');
    console.log('   - กางเกงผ้าลินิน: LINN00001, LINN00002, LINN00003...');
    console.log('   - กางเกงเลกกิ้ง: LEGG00001, LEGG00002, LEGG00003...');

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
addPantsCategories();
