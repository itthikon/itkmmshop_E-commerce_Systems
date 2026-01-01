/**
 * Add Women's Skirt Categories
 * เพิ่มหมวดหมู่กระโปรงต่างๆของผู้หญิง
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const skirtCategories = [
  { name: 'กระโปรงสั้น', prefix: 'MINI', description: 'กระโปรงสั้นเหนือเข่า มินิสเกิร์ต' },
  { name: 'กระโปรงยาว', prefix: 'MAXI', description: 'กระโปรงยาวระดับข้อเท้า แม็กซี่สเกิร์ต' },
  { name: 'กระโปรงเอ', prefix: 'ALNE', description: 'กระโปรงทรงเอ A-Line Skirt' },
  { name: 'กระโปรงดินสอ', prefix: 'PENC', description: 'กระโปรงทรงดินสอ Pencil Skirt' },
  { name: 'กระโปรงจีบ', prefix: 'PLET', description: 'กระโปรงจีบ Pleated Skirt' },
  { name: 'กระโปรงบาน', prefix: 'FLRE', description: 'กระโปรงบาน Flare Skirt' },
  { name: 'กระโปรงยีนส์', prefix: 'DNIM', description: 'กระโปรงยีนส์ Denim Skirt' },
  { name: 'กระโปรงผ้าไหม', prefix: 'SILK', description: 'กระโปรงผ้าไหมและผ้าซาติน' },
  { name: 'กระโปรงลูกไม้', prefix: 'LACE', description: 'กระโปรงลูกไม้ Lace Skirt' },
  { name: 'กระโปรงทรงสอบ', prefix: 'WRAP', description: 'กระโปรงทรงสอบ Wrap Skirt' }
];

async function addSkirtCategories() {
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
    console.log('🔄 กำลังเพิ่มหมวดหมู่กระโปรงผู้หญิง...\n');
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const category of skirtCategories) {
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
    console.log(`   📝 ทั้งหมด: ${skirtCategories.length} หมวดหมู่`);

    // Show all skirt categories
    console.log('\n👗 หมวดหมู่กระโปรงทั้งหมด:');
    const [allSkirtCategories] = await connection.execute(`
      SELECT id, name, prefix, description, status
      FROM product_categories
      WHERE prefix IN (${skirtCategories.map(() => '?').join(',')})
      ORDER BY id
    `, skirtCategories.map(c => c.prefix));
    
    console.table(allSkirtCategories);

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

    console.log('\n✅ เพิ่มหมวดหมู่กระโปรงผู้หญิงสำเร็จ!');
    console.log('\n💡 ตัวอย่าง SKU ที่จะถูกสร้าง:');
    console.log('   - กระโปรงสั้น: MINI00001, MINI00002, MINI00003...');
    console.log('   - กระโปรงยาว: MAXI00001, MAXI00002, MAXI00003...');
    console.log('   - กระโปรงเอ: ALNE00001, ALNE00002, ALNE00003...');
    console.log('   - กระโปรงดินสอ: PENC00001, PENC00002, PENC00003...');
    console.log('   - กระโปรงจีบ: PLET00001, PLET00002, PLET00003...');
    console.log('   - กระโปรงบาน: FLRE00001, FLRE00002, FLRE00003...');
    console.log('   - กระโปรงยีนส์: DNIM00001, DNIM00002, DNIM00003...');
    console.log('   - กระโปรงผ้าไหม: SILK00001, SILK00002, SILK00003...');
    console.log('   - กระโปรงลูกไม้: LACE00001, LACE00002, LACE00003...');
    console.log('   - กระโปรงทรงสอบ: WRAP00001, WRAP00002, WRAP00003...');

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
addSkirtCategories();
