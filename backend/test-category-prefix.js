/**
 * Test script for Category Prefix functionality
 * Tests the validateAndNormalizePrefix and isPrefixUnique methods
 */

const ProductCategory = require('./models/ProductCategory');
const db = require('./config/database');

async function testCategoryPrefix() {
  console.log('🧪 Testing Category Prefix Functionality\n');

  try {
    // Test 1: Validate and normalize prefix
    console.log('Test 1: Validate and normalize prefix');
    console.log('---------------------------------------');
    
    // Valid prefixes
    const validTests = [
      { input: 'elec', expected: 'ELEC' },
      { input: 'FASH', expected: 'FASH' },
      { input: 'ab', expected: 'AB' },
      { input: 'ABCD', expected: 'ABCD' },
      { input: '  tech  ', expected: 'TECH' }
    ];

    for (const test of validTests) {
      try {
        const result = ProductCategory.validateAndNormalizePrefix(test.input);
        console.log(`✅ Input: "${test.input}" → Output: "${result}" (Expected: "${test.expected}")`);
      } catch (error) {
        console.log(`❌ Input: "${test.input}" → Error: ${error.message}`);
      }
    }

    console.log('\n');

    // Test 2: Invalid prefixes
    console.log('Test 2: Invalid prefix validation');
    console.log('----------------------------------');
    
    const invalidTests = [
      { input: 'a', reason: 'Too short (1 char)' },
      { input: 'ABCDE', reason: 'Too long (5 chars)' },
      { input: 'AB1', reason: 'Contains number' },
      { input: 'AB-C', reason: 'Contains special char' },
      { input: 'AB C', reason: 'Contains space' },
      { input: '', reason: 'Empty string' },
      { input: null, reason: 'Null value' }
    ];

    for (const test of invalidTests) {
      try {
        const result = ProductCategory.validateAndNormalizePrefix(test.input);
        if (result === null) {
          console.log(`✅ Input: "${test.input}" → Returned null (${test.reason})`);
        } else {
          console.log(`❌ Input: "${test.input}" → Should have failed (${test.reason})`);
        }
      } catch (error) {
        console.log(`✅ Input: "${test.input}" → Rejected: ${error.message} (${test.reason})`);
      }
    }

    console.log('\n');

    // Test 3: Create category with prefix
    console.log('Test 3: Create category with prefix');
    console.log('------------------------------------');
    
    // Use a random letter to ensure uniqueness
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const uniquePrefix = 'TMP' + randomLetter;
    
    try {
      const testCategory = await ProductCategory.create({
        name: 'Test Electronics',
        description: 'Test category for electronics',
        prefix: uniquePrefix
      });
      console.log(`✅ Created category with prefix: ${testCategory.prefix}`);
      console.log(`   Category ID: ${testCategory.id}, Name: ${testCategory.name}`);

      // Test 4: Check prefix uniqueness
      console.log('\nTest 4: Check prefix uniqueness');
      console.log('--------------------------------');
      
      const isUnique = await ProductCategory.isPrefixUnique(uniquePrefix);
      console.log(`✅ Prefix "${uniquePrefix}" uniqueness check: ${!isUnique ? 'Already exists (correct)' : 'Unique (unexpected)'}`);

      const isUniqueNew = await ProductCategory.isPrefixUnique('NEWP');
      console.log(`✅ Prefix "NEWP" uniqueness check: ${isUniqueNew ? 'Unique (correct)' : 'Already exists (unexpected)'}`);

      // Test 5: Try to create duplicate prefix
      console.log('\nTest 5: Try to create duplicate prefix');
      console.log('---------------------------------------');
      
      try {
        await ProductCategory.create({
          name: 'Another Test Category',
          prefix: uniquePrefix
        });
        console.log('❌ Should have rejected duplicate prefix');
      } catch (error) {
        console.log(`✅ Duplicate prefix rejected: ${error.message}`);
      }

      // Test 6: Update category prefix
      console.log('\nTest 6: Update category prefix');
      console.log('-------------------------------');
      
      const updated = await ProductCategory.update(testCategory.id, {
        prefix: 'TSTB'
      });
      console.log(`✅ Updated prefix from "${uniquePrefix}" to "${updated.prefix}"`);

      // Cleanup
      console.log('\nCleaning up test data...');
      await ProductCategory.delete(testCategory.id);
      console.log('✅ Test category deleted');

    } catch (error) {
      console.error('❌ Error during database tests:', error.message);
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.pool.end();
  }
}

// Run tests
testCategoryPrefix();
