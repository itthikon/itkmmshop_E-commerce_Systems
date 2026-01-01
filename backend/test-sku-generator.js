/**
 * Quick test script for SKU Generator Service
 * Run with: node backend/test-sku-generator.js
 */

const SKUGeneratorService = require('./services/SKUGeneratorService');
const db = require('./config/database');

async function testSKUGenerator() {
  console.log('🧪 Testing SKU Generator Service...\n');

  try {
    // Test 1: Validate SKU format
    console.log('Test 1: Validate SKU Format');
    console.log('  ELEC00001:', SKUGeneratorService.validateSKUFormat('ELEC00001')); // true
    console.log('  GEN00123:', SKUGeneratorService.validateSKUFormat('GEN00123')); // true
    console.log('  INVALID:', SKUGeneratorService.validateSKUFormat('INVALID')); // false
    console.log('  ABC123:', SKUGeneratorService.validateSKUFormat('ABC123')); // false (not 5 digits)
    console.log('  TOOLONG00001:', SKUGeneratorService.validateSKUFormat('TOOLONG00001')); // false (prefix too long)
    console.log('  A00001:', SKUGeneratorService.validateSKUFormat('A00001')); // false (prefix too short)
    console.log('');

    // Test 2: Get category prefix (with null - should return GEN)
    console.log('Test 2: Get Category Prefix');
    const prefix1 = await SKUGeneratorService.getCategoryPrefix(null);
    console.log('  Category ID null:', prefix1); // Should be "GEN"
    
    const prefix2 = await SKUGeneratorService.getCategoryPrefix(999999);
    console.log('  Category ID 999999 (non-existent):', prefix2); // Should be "GEN"
    console.log('');

    // Test 3: Generate SKU with null category
    console.log('Test 3: Generate SKU with null category');
    const sku1 = await SKUGeneratorService.generateSKU(null);
    console.log('  Generated SKU:', sku1);
    console.log('  Format valid:', SKUGeneratorService.validateSKUFormat(sku1));
    console.log('  Starts with GEN:', sku1.startsWith('GEN'));
    console.log('');

    // Test 4: Check SKU uniqueness
    console.log('Test 4: Check SKU Uniqueness');
    const isUnique1 = await SKUGeneratorService.checkSKUUniqueness('NONEXISTENT00001');
    console.log('  NONEXISTENT00001 is unique:', isUnique1); // Should be true
    
    if (sku1) {
      const isUnique2 = await SKUGeneratorService.checkSKUUniqueness(sku1);
      console.log(`  ${sku1} is unique:`, isUnique2); // Should be true (not saved yet)
    }
    console.log('');

    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    // Close database connection
    await db.closePool();
  }
}

// Run tests
testSKUGenerator();
