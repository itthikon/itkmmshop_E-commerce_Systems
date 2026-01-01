const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/.env' });

async function addDefectsColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'itkmmshop22'
  });

  try {
    console.log('Adding defects column to products table...');
    
    await connection.execute(`
      ALTER TABLE products 
      ADD COLUMN defects TEXT NULL AFTER description
    `);
    
    console.log('✓ Defects column added successfully!');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✓ Defects column already exists');
    } else {
      console.error('Error adding defects column:', error.message);
      throw error;
    }
  } finally {
    await connection.end();
  }
}

addDefectsColumn()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
