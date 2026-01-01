/**
 * Integration Test: Complete Product Creation Flow
 * Tests Requirements: 1.1, 1.4, 8.5
 * 
 * This test verifies:
 * - Product creation with category
 * - SKU generated correctly
 * - SKU saved to database
 * - SKU displayed correctly
 */

require('dotenv').config();
const db = require('./config/database');
const skuService = require('./services/SKUGeneratorService');
const Product = require('./models/Product');
const ProductCategory = require('./models/ProductCategory');

async function testProductCreationFlow() {
  console.log('🧪 Testing Complete Product Creation Flow\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Create a test category with prefix
    console.log('\n📋 Step 1: Creating test category with prefix...');
    // Generate unique prefix using letters only
    const timestamp = Date.now().toString();
    const uniquePrefix = 'TST' + String.fromCharCode(65 + (parseInt(timestamp.slice(-2)) % 26));
    const categoryData = {
      name: `Test Category ${Date.now()}`,
      description: 'Test category for SKU generation',
      prefix: uniquePrefix,
      status: 'active'
    };

    const category = await ProductCategory.create(categoryData);
    console.log('✅ Category created:', {
      id: category.id,
      name: category.name,
      prefix: category.prefix
    });

    // Step 2: Generate SKU preview (simulating frontend behavior)
    console.log('\n🔢 Step 2: Generating SKU preview...');
    const previewSKU = await skuService.generateSKU(category.id);
    console.log('✅ SKU preview generated:', previewSKU);

    // Verify SKU format
    const isValidFormat = skuService.validateSKUFormat(previewSKU);
    console.log(`✅ SKU format valid: ${isValidFormat}`);
    if (!isValidFormat) {
      throw new Error('Generated SKU has invalid format');
    }

    // Step 3: Create product with auto-generated SKU
    console.log('\n📦 Step 3: Creating product with auto-generated SKU...');
    const productData = {
      name: `Test Product ${Date.now()}`,
      description: 'Test product for SKU generation flow',
      category_id: category.id,
      price_excluding_vat: 999.99,
      cost_price_excluding_vat: 500.00,
      stock_quantity: 100,
      status: 'active'
    };

    // Generate SKU automatically (as done in productController)
    const generatedSKU = await skuService.generateSKU(productData.category_id);
    productData.sku = generatedSKU;

    const product = await Product.create(productData);
    console.log('✅ Product created:', {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category_id: product.category_id
    });

    // Step 4: Verify SKU saved to database
    console.log('\n💾 Step 4: Verifying SKU saved to database...');
    const savedProduct = await Product.findById(product.id);
    console.log('✅ Product retrieved from database:', {
      id: savedProduct.id,
      sku: savedProduct.sku
    });

    if (savedProduct.sku !== generatedSKU) {
      throw new Error('SKU mismatch: saved SKU does not match generated SKU');
    }
    console.log('✅ SKU correctly saved to database');

    // Step 5: Verify SKU format and uniqueness
    console.log('\n🔍 Step 5: Verifying SKU properties...');
    
    // Check format
    if (!savedProduct.sku.startsWith(uniquePrefix)) {
      throw new Error(`SKU does not start with correct prefix: ${uniquePrefix}`);
    }
    console.log(`✅ SKU has correct prefix: ${uniquePrefix}`);

    // Check sequential number format
    const sequentialPart = savedProduct.sku.substring(uniquePrefix.length);
    if (!/^\d{5}$/.test(sequentialPart)) {
      throw new Error('Sequential number is not 5 digits');
    }
    console.log('✅ SKU has correct sequential number format:', sequentialPart);

    // Check uniqueness
    const isUnique = await skuService.checkSKUUniqueness(savedProduct.sku);
    if (isUnique) {
      throw new Error('SKU should not be unique after creation');
    }
    console.log('✅ SKU uniqueness verified (exists in database)');

    // Step 6: Create another product in same category
    console.log('\n📦 Step 6: Creating second product in same category...');
    const product2Data = {
      name: `Test Product 2 ${Date.now()}`,
      description: 'Second test product',
      category_id: category.id,
      price_excluding_vat: 1299.99,
      cost_price_excluding_vat: 700.00,
      stock_quantity: 50,
      status: 'active'
    };

    const generatedSKU2 = await skuService.generateSKU(product2Data.category_id);
    product2Data.sku = generatedSKU2;

    const product2 = await Product.create(product2Data);
    console.log('✅ Second product created:', {
      id: product2.id,
      sku: product2.sku
    });

    // Verify sequential increment
    const seq1 = parseInt(savedProduct.sku.substring(uniquePrefix.length));
    const seq2 = parseInt(product2.sku.substring(uniquePrefix.length));
    if (seq2 !== seq1 + 1) {
      throw new Error(`Sequential numbers not incrementing correctly: ${seq1} -> ${seq2}`);
    }
    console.log('✅ Sequential numbers increment correctly:', `${seq1} -> ${seq2}`);

    // Step 7: Verify both SKUs are different
    console.log('\n🔍 Step 7: Verifying SKU uniqueness...');
    if (savedProduct.sku === product2.sku) {
      throw new Error('Duplicate SKUs generated!');
    }
    console.log('✅ Both SKUs are unique');

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    // Delete products first, then category
    await Product.delete(product.id);
    console.log('  ✓ Deleted product 1');
    await Product.delete(product2.id);
    console.log('  ✓ Deleted product 2');
    
    // Try to delete category (may fail if products still referenced)
    try {
      await ProductCategory.delete(category.id);
      console.log('  ✓ Deleted category');
    } catch (error) {
      console.log('  ⚠ Could not delete category (may have references):', error.message);
      // Not critical for test - category will be cleaned up manually if needed
    }
    console.log('✅ Test data cleaned up');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED - Product Creation Flow Working Correctly');
    console.log('='.repeat(60));
    console.log('\nVerified:');
    console.log('  ✓ Category creation with prefix');
    console.log('  ✓ SKU preview generation');
    console.log('  ✓ SKU format validation');
    console.log('  ✓ Product creation with auto-generated SKU');
    console.log('  ✓ SKU saved to database correctly');
    console.log('  ✓ SKU has correct prefix and format');
    console.log('  ✓ Sequential numbers increment correctly');
    console.log('  ✓ SKU uniqueness enforced');
    console.log('\n✅ Requirements 1.1, 1.4, 8.5 validated\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

// Run the test
testProductCreationFlow();
