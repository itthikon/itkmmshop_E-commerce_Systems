/**
 * Add Women's Fashion Categories
 * เพิ่มหมวดหมู่ชุดต่างๆของผู้หญิง
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const womenCategories = [
  { name: 'ชุดเดรส', prefix: 'DRES', description: 'เดรสและชุดกระโปรงผู้หญิง' },
  { name: 'ชุดทำงาน', prefix: 'WORK', description: 'ชุดทำงานและชุดออฟฟิศผู้หญิง' },
  { name: 'ชุดลำลอง', prefix: 'CASU', description: 'ชุดลำลองและชุดเที่ยวผู้หญิง' },
  { name: 'ชุดราตรี', prefix: 'EVNG', description: 'ชุดราตรีและชุดออกงานผู้หญิง' },
  { name: 'ชุดชั้นใน', prefix: 'LING', description: 'ชุดชั้นในและชุดนอนผู้หญิง' },
  { name: 'ชุดกีฬา', prefix: 'SPRT', description: 'ชุดกีฬาและชุดออกกำลังกายผู้หญิง' },
  { name: 'ชุดว่ายน้ำ', prefix: 'SWIM', description: 'ชุดว่ายน้ำและบิกินี่ผู้หญิง' },
  { name: 'เสื้อผู้หญิง', prefix: 'WTOP', description: 'เสื้อทุกประเภทสำหรับผู้หญิง' },
  { name: 'กางเกงผู้หญิง', prefix: 'WPNT', description: 'กางเกงและกระโปรงผู้หญิง' },
  { name: 'เสื้อคลุมผู้หญิง', prefix: 'WJKT', description: 'เสื้อคลุมและแจ็คเก็ตผู้หญิง' }
];

async function addWomenCategories() {
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
    console.log('🔄 กำลังเพิ่มหมวดหมู่ชุดผู้หญิง...\n');
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const category of womenCategories) {
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
    console.log(`   📝 ทั้งหมด: ${womenCategories.length} หมวดหมู่`);

    // Show all women's fashion categories
    console.log('\n👗 หมวดหมู่ชุดผู้หญิงทั้งหมด:');
    const [allWomenCategories] = await connection.execute(`
      SELECT id, name, prefix, description, status
      FROM product_categories
      WHERE prefix IN (${womenCategories.map(() => '?').join(',')})
      ORDER BY id
    `, womenCategories.map(c => c.prefix));
    
    console.table(allWomenCategories);

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

    console.log('\n✅ เพิ่มหมวดหมู่ชุดผู้หญิงสำเร็จ!');
    console.log('\n💡 ตัวอย่าง SKU ที่จะถูกสร้าง:');
    console.log('   - ชุดเดรส: DRES00001, DRES00002, DRES00003...');
    console.log('   - ชุดทำงาน: WORK00001, WORK00002, WORK00003...');
    console.log('   - ชุดลำลอง: CASU00001, CASU00002, CASU00003...');
    console.log('   - ชุดราตรี: EVNG00001, EVNG00002, EVNG00003...');
    console.log('   - ชุดชั้นใน: LING00001, LING00002, LING00003...');
    console.log('   - ชุดกีฬา: SPRT00001, SPRT00002, SPRT00003...');
    console.log('   - ชุดว่ายน้ำ: SWIM00001, SWIM00002, SWIM00003...');
    console.log('   - เสื้อผู้หญิง: WTOP00001, WTOP00002, WTOP00003...');
    console.log('   - กางเกงผู้หญิง: WPNT00001, WPNT00002, WPNT00003...');
    console.log('   - เสื้อคลุมผู้หญิง: WJKT00001, WJKT00002, WJKT00003...');

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
addWomenCategories();
