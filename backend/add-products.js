const db = require('./config/database');
require('dotenv').config();

async function addProducts() {
  try {
    console.log('🔄 Adding more products...');
    
    const products = [
      {
        id: 9,
        sku: 'SHIRT004',
        name: 'เสื้อฮู้ดดี้ สีเทา',
        description: 'เสื้อฮู้ดดี้ผ้าคอตตอนผสม สีเทา อุ่นสบาย',
        category_id: 1,
        price_excluding_vat: 560.75,
        stock_quantity: 35
      },
      {
        id: 10,
        sku: 'SHOE003',
        name: 'รองเท้าแตะ สีดำ',
        description: 'รองเท้าแตะยาง สีดำ ใส่สบาย',
        category_id: 2,
        price_excluding_vat: 186.92,
        stock_quantity: 60
      }
    ];

    for (const product of products) {
      await db.pool.query(`
        INSERT IGNORE INTO products (id, sku, name, description, category_id, price_excluding_vat, stock_quantity, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      `, [
        product.id,
        product.sku,
        product.name,
        product.description,
        product.category_id,
        product.price_excluding_vat,
        product.stock_quantity
      ]);
      
      console.log(`✅ Added: ${product.name}`);
    }

    // Show total products
    const [result] = await db.pool.query('SELECT COUNT(*) as total FROM products');
    console.log(`\n✅ Total products in database: ${result[0].total}`);
    
    // Show all products
    const [products_list] = await db.pool.query(`
      SELECT id, sku, name, price_excluding_vat, vat_amount, price_including_vat, stock_quantity
      FROM products
      ORDER BY id
    `);
    
    console.log('\n📦 All Products:');
    console.log('─'.repeat(100));
    products_list.forEach(p => {
      console.log(`${p.id}. ${p.name} (${p.sku})`);
      console.log(`   ราคา: ฿${p.price_excluding_vat} + VAT ฿${p.vat_amount} = ฿${p.price_including_vat}`);
      console.log(`   สต็อก: ${p.stock_quantity} ชิ้น`);
      console.log('');
    });
    
    await db.closePool();
    console.log('🎉 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addProducts();