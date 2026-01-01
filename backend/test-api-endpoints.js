/**
 * Test script for Auto SKU Generation API Endpoints
 * Tests the new endpoints added in task 4
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test credentials (admin account)
const TEST_ADMIN = {
  email: 'admin@itkmmshop.com',
  password: 'Admin123!'
};

let authToken = null;

/**
 * Login and get auth token
 */
async function login() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_ADMIN);
    authToken = response.data.token;
    console.log('✅ Login successful\n');
    return authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

/**
 * Test 1: Generate SKU with category
 */
async function testGenerateSKUWithCategory() {
  console.log('📝 Test 1: Generate SKU with category');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/products/generate-sku`,
      { category_id: 1 },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ SKU generated:', response.data.data);
    console.log('   - SKU:', response.data.data.sku);
    console.log('   - Prefix:', response.data.data.prefix);
    console.log('   - Sequential Number:', response.data.data.sequential_number);
    console.log('');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

/**
 * Test 2: Generate SKU without category (default GEN prefix)
 */
async function testGenerateSKUWithoutCategory() {
  console.log('📝 Test 2: Generate SKU without category (default GEN)');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/products/generate-sku`,
      { category_id: null },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ SKU generated:', response.data.data);
    console.log('   - SKU:', response.data.data.sku);
    console.log('   - Prefix:', response.data.data.prefix);
    console.log('   - Should be GEN:', response.data.data.prefix === 'GEN' ? '✅' : '❌');
    console.log('');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

/**
 * Test 3: Create product with auto-generated SKU
 */
async function testCreateProductAutoSKU() {
  console.log('📝 Test 3: Create product with auto-generated SKU');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/products`,
      {
        name: 'Test Product Auto SKU',
        category_id: 1,
        price_excluding_vat: 100,
        stock_quantity: 10
        // Note: No SKU provided - should be auto-generated
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Product created with auto SKU:', response.data.data);
    console.log('   - Product ID:', response.data.data.id);
    console.log('   - SKU:', response.data.data.sku);
    console.log('   - SKU format valid:', /^[A-Z]{2,4}\d{5}$/.test(response.data.data.sku) ? '✅' : '❌');
    console.log('');
    
    return response.data.data.id;
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

/**
 * Test 4: Try to update product SKU (should fail - immutable)
 */
async function testUpdateProductSKU(productId) {
  console.log('📝 Test 4: Try to update product SKU (should fail)');
  try {
    const response = await axios.put(
      `${API_BASE_URL}/products/${productId}`,
      {
        sku: 'TEST99999',
        name: 'Updated Product Name'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('❌ Test failed: SKU update should have been rejected');
    console.log('');
  } catch (error) {
    if (error.response?.data?.error?.code === 'SKU_IMMUTABLE') {
      console.log('✅ SKU immutability enforced correctly');
      console.log('   - Error code:', error.response.data.error.code);
      console.log('   - Message:', error.response.data.error.message);
      console.log('');
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

/**
 * Test 5: Create category with prefix
 */
async function testCreateCategoryWithPrefix() {
  console.log('📝 Test 5: Create category with prefix');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/categories`,
      {
        name: 'Test Category',
        prefix: 'TEST',
        description: 'Test category for SKU generation'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Category created with prefix:', response.data.data);
    console.log('   - Category ID:', response.data.data.id);
    console.log('   - Prefix:', response.data.data.prefix);
    console.log('   - Prefix uppercase:', response.data.data.prefix === 'TEST' ? '✅' : '❌');
    console.log('');
    
    return response.data.data.id;
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

/**
 * Test 6: Try to create category with duplicate prefix (should fail)
 */
async function testDuplicatePrefix() {
  console.log('📝 Test 6: Try to create category with duplicate prefix (should fail)');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/categories`,
      {
        name: 'Another Test Category',
        prefix: 'TEST', // Same as previous test
        description: 'Should fail due to duplicate prefix'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('❌ Test failed: Duplicate prefix should have been rejected');
    console.log('');
  } catch (error) {
    if (error.response?.data?.error?.code === 'DUPLICATE_PREFIX') {
      console.log('✅ Duplicate prefix rejected correctly');
      console.log('   - Error code:', error.response.data.error.code);
      console.log('   - Message:', error.response.data.error.message);
      console.log('');
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

/**
 * Test 7: Update category prefix with warning
 */
async function testUpdateCategoryPrefix(categoryId) {
  console.log('📝 Test 7: Update category prefix (should show warning)');
  try {
    const response = await axios.put(
      `${API_BASE_URL}/categories/${categoryId}`,
      {
        prefix: 'TST2'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Category prefix updated:', response.data.data);
    console.log('   - New prefix:', response.data.data.prefix);
    if (response.data.warning) {
      console.log('   - Warning shown:', '✅');
      console.log('   - Warning message:', response.data.warning.message);
    }
    console.log('');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

/**
 * Test 8: Get all categories (should include prefix)
 */
async function testGetCategories() {
  console.log('📝 Test 8: Get all categories (should include prefix)');
  try {
    const response = await axios.get(`${API_BASE_URL}/categories`);
    
    console.log('✅ Categories retrieved:', response.data.data.length, 'categories');
    const categoriesWithPrefix = response.data.data.filter(c => c.prefix);
    console.log('   - Categories with prefix:', categoriesWithPrefix.length);
    if (categoriesWithPrefix.length > 0) {
      console.log('   - Example:', categoriesWithPrefix[0].name, '(', categoriesWithPrefix[0].prefix, ')');
    }
    console.log('');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting API Endpoint Tests\n');
  console.log('=' .repeat(60));
  console.log('\n');

  await login();
  
  await testGenerateSKUWithCategory();
  await testGenerateSKUWithoutCategory();
  
  const productId = await testCreateProductAutoSKU();
  if (productId) {
    await testUpdateProductSKU(productId);
  }
  
  const categoryId = await testCreateCategoryWithPrefix();
  await testDuplicatePrefix();
  if (categoryId) {
    await testUpdateCategoryPrefix(categoryId);
  }
  
  await testGetCategories();
  
  console.log('=' .repeat(60));
  console.log('\n✅ All tests completed!\n');
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
