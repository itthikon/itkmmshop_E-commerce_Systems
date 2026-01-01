/**
 * Integration Test: Edge Cases
 * Tests Requirements: 1.3, 3.5, 2.6, 6.3
 * 
 * This test verifies:
 * - Create product without category (GEN prefix)
 * - Create 99999 products in one category (limit) - simulated
 * - Attempt duplicate prefix
 * - Change product category (SKU unchanged)
 */

require('dotenv').config();
const db = require('./config/database');
const ProductCategory = require('./models/ProductCategory');
const Product = require('./models/Product');
const skuService = require('./services/SKUGeneratorService');

async function testEdgeCases() {
  console.log('🧪 Testing Edge Cases\n');
  console.log('=' .repeat(60));

  const createdProducts = [];
  const createdCategories = [];

  try {
    // Edge Case 1: Create product without category (GEN prefix)
    console.log('\n🔍 Edge Case 1: Product without category (GEN prefix)...');
    const productNoCategory = {
      name: `No Category Product ${Date.now()}`,
      description: 'Product without category',
      category_id: null, // No category
      price_excluding_vat: 100.00,
      stock_quantity: 10,
      status: 'active'
    };

    const skuNoCategory = await skuService.generateSKU(null);
    productNoCategory.sku = skuNoCategory;
    const product1 = await Product.create(productNoCategory);
    createdProducts.push(product1.id);

    console.log('✅ Product created without category:', {
      id: product1.id,
      sku: product1.sku,
      category_id: product1.category_id
    });

    // Verify SKU starts with GEN
    if (!product1.sku.startsWith('GEN')) {
      throw new Error(`Expected SKU to start with GEN, got ${product1.sku}`);
    }
    console.log('✅ SKU correctly uses default prefix "GEN"');

    // Create another product without category
    const productNoCategory2 = {
      name: `No Category Product 2 ${Date.now()}`,
      description: 'Second product without category',
      category_id: null,
      price_excluding_vat: 200.00,
      stock_quantity: 20,
      status: 'active'
    };

    const skuNoCategory2 = await skuService.generateSKU(null);
    productNoCategory2.sku = skuNoCategory2;
    const product2 = await Product.create(productNoCategory2);
    createdProducts.push(product2.id);

    console.log('✅ Second product created without category:', product2.sku);

    // Verify sequential numbering for GEN prefix
    const seq1 = parseInt(product1.sku.substring(3));
    const seq2 = parseInt(product2.sku.substring(3));
    if (seq2 !== seq1 + 1) {
      throw new Error(`GEN prefix sequential numbers not incrementing: ${seq1} -> ${seq2}`);
    }
    console.log('✅ GEN prefix has independent sequential numbering');

    // Edge Case 2: Attempt duplicate prefix
    console.log('\n🔍 Edge Case 2: Attempt duplicate prefix...');
    const timestamp = Date.now().toString();
    const testPrefix = 'DUP' + String.fromCharCode(65 + (parseInt(timestamp.slice(-2)) % 26));

    // Create first category with prefix
    const category1 = await ProductCategory.create({
      name: `Category 1 ${Date.now()}`,
      prefix: testPrefix,
      status: 'active'
    });
    createdCategories.push(category1.id);
    console.log('✅ First category created with prefix:', testPrefix);

    // Try to create second category with same prefix
    try {
      await ProductCategory.create({
        name: `Category 2 ${Date.now()}`,
        prefix: testPrefix, // Duplicate prefix
        status: 'active'
      });
      throw new Error('Should have rejected duplicate prefix');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('unique')) {
        console.log('✅ Correctly rejected duplicate prefix');
      } else {
        throw error;
      }
    }

    // Edge Case 3: Change product category (SKU unchanged)
    console.log('\n🔍 Edge Case 3: Change product category (SKU unchanged)...');
    
    // Create two categories
    const categoryA = await ProductCategory.create({
      name: `Category A ${Date.now()}`,
      prefix: 'CATA',
      status: 'active'
    });
    createdCategories.push(categoryA.id);

    const categoryB = await ProductCategory.create({
      name: `Category B ${Date.now()}`,
      prefix: 'CATB',
      status: 'active'
    });
    createdCategories.push(categoryB.id);

    // Create product in category A
    const productInA = {
      name: `Product in A ${Date.now()}`,
      description: 'Product initially in category A',
      category_id: categoryA.id,
      price_excluding_vat: 300.00,
      stock_quantity: 30,
      status: 'active'
    };

    const skuInA = await skuService.generateSKU(categoryA.id);
    productInA.sku = skuInA;
    const product3 = await Product.create(productInA);
    createdProducts.push(product3.id);

    console.log('✅ Product created in Category A:', {
      id: product3.id,
      sku: product3.sku,
      category_id: product3.category_id
    });

    const originalSKU = product3.sku;

    // Update product to category B
    const updatedProduct = await Product.update(product3.id, {
      category_id: categoryB.id
    });

    console.log('✅ Product moved to Category B:', {
      id: updatedProduct.id,
      sku: updatedProduct.sku,
      category_id: updatedProduct.category_id
    });

    // Verify SKU unchanged
    if (updatedProduct.sku !== originalSKU) {
      throw new Error(`SKU changed after category update! Original: ${originalSKU}, New: ${updatedProduct.sku}`);
    }
    console.log('✅ SKU remained unchanged after category change');
    console.log(`  Original SKU: ${originalSKU}`);
    console.log(`  Current SKU: ${updatedProduct.sku}`);

    // Edge Case 4: Simulate limit reached (99999)
    console.log('\n🔍 Edge Case 4: Simulate SKU limit reached...');
    console.log('Note: Creating 99999 products would take too long.');
    console.log('Instead, we will test the limit detection logic directly.');

    // Create a category for limit testing
    const limitCategory = await ProductCategory.create({
      name: `Limit Test Category ${Date.now()}`,
      prefix: 'LIM',
      status: 'active'
    });
    createdCategories.push(limitCategory.id);

    // Create a product with SKU near the limit
    const nearLimitProduct = {
      name: `Near Limit Product ${Date.now()}`,
      description: 'Product with high sequential number',
      category_id: limitCategory.id,
      sku: 'LIM99999', // Manually set to max
      price_excluding_vat: 400.00,
      stock_quantity: 40,
      status: 'active'
    };

    const product4 = await Product.create(nearLimitProduct);
    createdProducts.push(product4.id);
    console.log('✅ Created product with SKU at limit:', product4.sku);

    // Try to generate next SKU (should fail)
    try {
      await skuService.generateSKU(limitCategory.id);
      throw new Error('Should have thrown limit reached error');
    } catch (error) {
      if (error.message.includes('limit') || error.message.includes('99999')) {
        console.log('✅ Correctly detected SKU limit reached');
        console.log(`  Error message: ${error.message}`);
      } else {
        throw error;
      }
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    for (const productId of createdProducts) {
      await Product.delete(productId);
    }
    console.log(`  ✓ Deleted ${createdProducts.length} products`);

    for (const categoryId of createdCategories) {
      try {
        await ProductCategory.delete(categoryId);
      } catch (error) {
        console.log(`  ⚠ Could not delete category ${categoryId}:`, error.message);
      }
    }
    console.log('✅ Test data cleaned up');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL EDGE CASES PASSED');
    console.log('='.repeat(60));
    console.log('\nVerified:');
    console.log('  ✓ Products without category use GEN prefix');
    console.log('  ✓ GEN prefix has independent sequential numbering');
    console.log('  ✓ Duplicate prefix correctly rejected');
    console.log('  ✓ SKU remains unchanged when product category changes');
    console.log('  ✓ SKU limit (99999) correctly detected');
    console.log('\n✅ Requirements 1.3, 3.5, 2.6, 6.3 validated\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack trace:', error.stack);

    // Cleanup on error
    console.log('\n🧹 Cleaning up after error...');
    for (const productId of createdProducts) {
      try {
        await Product.delete(productId);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    for (const categoryId of createdCategories) {
      try {
        await ProductCategory.delete(categoryId);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

// Run the test
testEdgeCases();
