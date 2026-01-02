/**
 * Test Script: Verify SKU-based Filenames
 * 
 * This script verifies that:
 * 1. Uploaded images are renamed to {SKU}.{extension} format
 * 2. Image paths in database use SKU-based filenames
 * 3. Old images are properly deleted when replaced
 * 4. File system and database are in sync
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:5000/api';
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'products');

// Test credentials
const ADMIN_CREDENTIALS = {
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
    const response = await axios.post(`${API_BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ Login successful\n');
      return true;
    }
    
    console.error('❌ Login failed:', response.data);
    return false;
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Create a test product
 */
async function createTestProduct(productData) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/products`,
      productData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Failed to create product');
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

/**
 * Upload image to product
 */
async function uploadImage(productId, imagePath) {
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));
    
    const response = await axios.post(
      `${API_BASE_URL}/products/${productId}/image`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Failed to upload image');
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

/**
 * Get product by ID
 */
async function getProduct(productId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Failed to get product');
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

/**
 * Delete product
 */
async function deleteProduct(productId) {
  try {
    await axios.delete(
      `${API_BASE_URL}/products/${productId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
  } catch (error) {
    console.error('Warning: Failed to delete product:', error.message);
  }
}

/**
 * Create a test image file
 */
function createTestImage(filename, content = 'Test image content') {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

/**
 * Check if file exists in uploads directory
 */
function checkFileExists(filename) {
  const filePath = path.join(UPLOADS_DIR, filename);
  return fs.existsSync(filePath);
}

/**
 * Get all files in uploads directory
 */
function getUploadedFiles() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    return [];
  }
  return fs.readdirSync(UPLOADS_DIR).filter(f => f !== '.gitkeep');
}

/**
 * Clean up test files
 */
function cleanupTestFiles(files) {
  files.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (error) {
      console.error(`Warning: Failed to delete ${file}:`, error.message);
    }
  });
}

/**
 * Test 1: Verify image is renamed to SKU format
 */
async function test1_VerifySKUBasedFilename() {
  console.log('📋 Test 1: Verify image is renamed to SKU format');
  console.log('─'.repeat(60));
  
  let productId = null;
  const testFiles = [];
  
  try {
    // Create test product
    console.log('Creating test product...');
    const product = await createTestProduct({
      name: 'Test Product for SKU Filename',
      price_excluding_vat: 100,
      stock_quantity: 10
    });
    
    productId = product.id;
    const sku = product.sku;
    console.log(`✅ Product created: ID=${productId}, SKU=${sku}`);
    
    // Create test image
    const testImage = createTestImage('test-upload.jpg');
    testFiles.push(testImage);
    console.log('✅ Test image created');
    
    // Upload image
    console.log('Uploading image...');
    const uploadResult = await uploadImage(productId, testImage);
    console.log(`✅ Image uploaded: ${uploadResult.filename}`);
    
    // Verify filename format
    const expectedFilename = `${sku}.jpg`;
    if (uploadResult.filename === expectedFilename) {
      console.log(`✅ Filename matches SKU format: ${expectedFilename}`);
    } else {
      console.log(`❌ Filename mismatch!`);
      console.log(`   Expected: ${expectedFilename}`);
      console.log(`   Got: ${uploadResult.filename}`);
      return false;
    }
    
    // Verify file exists in uploads directory
    if (checkFileExists(expectedFilename)) {
      console.log(`✅ File exists in uploads directory: ${expectedFilename}`);
    } else {
      console.log(`❌ File not found in uploads directory: ${expectedFilename}`);
      return false;
    }
    
    // Verify database image_path
    const updatedProduct = await getProduct(productId);
    const expectedPath = `/uploads/products/${expectedFilename}`;
    if (updatedProduct.image_path === expectedPath) {
      console.log(`✅ Database image_path correct: ${expectedPath}`);
    } else {
      console.log(`❌ Database image_path mismatch!`);
      console.log(`   Expected: ${expectedPath}`);
      console.log(`   Got: ${updatedProduct.image_path}`);
      return false;
    }
    
    console.log('✅ Test 1 PASSED\n');
    return true;
    
  } catch (error) {
    console.error('❌ Test 1 FAILED:', error.message);
    return false;
  } finally {
    // Cleanup
    if (productId) {
      await deleteProduct(productId);
    }
    cleanupTestFiles(testFiles);
  }
}

/**
 * Test 2: Verify different file extensions
 */
async function test2_VerifyDifferentExtensions() {
  console.log('📋 Test 2: Verify different file extensions (.jpg, .jpeg, .png)');
  console.log('─'.repeat(60));
  
  const extensions = ['jpg', 'jpeg', 'png'];
  const testFiles = [];
  const productIds = [];
  
  try {
    for (const ext of extensions) {
      console.log(`\nTesting .${ext} extension...`);
      
      // Create test product
      const product = await createTestProduct({
        name: `Test Product for .${ext}`,
        price_excluding_vat: 100,
        stock_quantity: 10
      });
      
      productIds.push(product.id);
      const sku = product.sku;
      console.log(`✅ Product created: SKU=${sku}`);
      
      // Create test image
      const testImage = createTestImage(`test-upload.${ext}`);
      testFiles.push(testImage);
      
      // Upload image
      const uploadResult = await uploadImage(product.id, testImage);
      
      // Verify filename
      const expectedFilename = `${sku}.${ext}`;
      if (uploadResult.filename === expectedFilename) {
        console.log(`✅ .${ext} file renamed correctly: ${expectedFilename}`);
      } else {
        console.log(`❌ .${ext} file rename failed!`);
        console.log(`   Expected: ${expectedFilename}`);
        console.log(`   Got: ${uploadResult.filename}`);
        return false;
      }
      
      // Verify file exists
      if (checkFileExists(expectedFilename)) {
        console.log(`✅ .${ext} file exists in uploads directory`);
      } else {
        console.log(`❌ .${ext} file not found in uploads directory`);
        return false;
      }
    }
    
    console.log('\n✅ Test 2 PASSED\n');
    return true;
    
  } catch (error) {
    console.error('❌ Test 2 FAILED:', error.message);
    return false;
  } finally {
    // Cleanup
    for (const productId of productIds) {
      await deleteProduct(productId);
    }
    cleanupTestFiles(testFiles);
  }
}

/**
 * Test 3: Verify old image is deleted when replaced
 */
async function test3_VerifyOldImageDeletion() {
  console.log('📋 Test 3: Verify old image is deleted when replaced');
  console.log('─'.repeat(60));
  
  let productId = null;
  const testFiles = [];
  
  try {
    // Create test product
    console.log('Creating test product...');
    const product = await createTestProduct({
      name: 'Test Product for Image Replacement',
      price_excluding_vat: 100,
      stock_quantity: 10
    });
    
    productId = product.id;
    const sku = product.sku;
    console.log(`✅ Product created: SKU=${sku}`);
    
    // Upload first image (.jpg)
    console.log('\nUploading first image (.jpg)...');
    const testImage1 = createTestImage('test-upload-1.jpg', 'First image');
    testFiles.push(testImage1);
    
    const uploadResult1 = await uploadImage(productId, testImage1);
    const firstFilename = `${sku}.jpg`;
    console.log(`✅ First image uploaded: ${uploadResult1.filename}`);
    
    // Verify first image exists
    if (checkFileExists(firstFilename)) {
      console.log(`✅ First image exists: ${firstFilename}`);
    } else {
      console.log(`❌ First image not found: ${firstFilename}`);
      return false;
    }
    
    // Upload second image (.png) - should replace .jpg
    console.log('\nUploading second image (.png)...');
    const testImage2 = createTestImage('test-upload-2.png', 'Second image');
    testFiles.push(testImage2);
    
    const uploadResult2 = await uploadImage(productId, testImage2);
    const secondFilename = `${sku}.png`;
    console.log(`✅ Second image uploaded: ${uploadResult2.filename}`);
    
    // Verify second image exists
    if (checkFileExists(secondFilename)) {
      console.log(`✅ Second image exists: ${secondFilename}`);
    } else {
      console.log(`❌ Second image not found: ${secondFilename}`);
      return false;
    }
    
    // Verify first image was deleted
    if (!checkFileExists(firstFilename)) {
      console.log(`✅ Old image deleted: ${firstFilename}`);
    } else {
      console.log(`❌ Old image still exists: ${firstFilename}`);
      return false;
    }
    
    // Verify database has new image path
    const updatedProduct = await getProduct(productId);
    const expectedPath = `/uploads/products/${secondFilename}`;
    if (updatedProduct.image_path === expectedPath) {
      console.log(`✅ Database updated with new image path: ${expectedPath}`);
    } else {
      console.log(`❌ Database image_path incorrect!`);
      console.log(`   Expected: ${expectedPath}`);
      console.log(`   Got: ${updatedProduct.image_path}`);
      return false;
    }
    
    console.log('✅ Test 3 PASSED\n');
    return true;
    
  } catch (error) {
    console.error('❌ Test 3 FAILED:', error.message);
    return false;
  } finally {
    // Cleanup
    if (productId) {
      await deleteProduct(productId);
    }
    cleanupTestFiles(testFiles);
  }
}

/**
 * Test 4: Verify no orphaned files
 */
async function test4_VerifyNoOrphanedFiles() {
  console.log('📋 Test 4: Verify no orphaned files remain');
  console.log('─'.repeat(60));
  
  let productId = null;
  const testFiles = [];
  
  try {
    // Get initial file count
    const initialFiles = getUploadedFiles();
    console.log(`Initial files in uploads directory: ${initialFiles.length}`);
    
    // Create test product
    const product = await createTestProduct({
      name: 'Test Product for Orphan Check',
      price_excluding_vat: 100,
      stock_quantity: 10
    });
    
    productId = product.id;
    const sku = product.sku;
    console.log(`✅ Product created: SKU=${sku}`);
    
    // Upload image
    const testImage = createTestImage('test-upload.jpg');
    testFiles.push(testImage);
    
    await uploadImage(productId, testImage);
    console.log('✅ Image uploaded');
    
    // Check file count increased by 1
    const afterUploadFiles = getUploadedFiles();
    if (afterUploadFiles.length === initialFiles.length + 1) {
      console.log(`✅ File count increased by 1: ${afterUploadFiles.length}`);
    } else {
      console.log(`❌ Unexpected file count!`);
      console.log(`   Expected: ${initialFiles.length + 1}`);
      console.log(`   Got: ${afterUploadFiles.length}`);
      return false;
    }
    
    // Verify only SKU-based filename exists (no temp files)
    const expectedFilename = `${sku}.jpg`;
    const hasExpectedFile = afterUploadFiles.includes(expectedFilename);
    const hasTempFiles = afterUploadFiles.some(f => f.startsWith('temp-'));
    
    if (hasExpectedFile && !hasTempFiles) {
      console.log(`✅ Only SKU-based file exists, no temp files`);
    } else {
      console.log(`❌ Orphaned or temp files detected!`);
      console.log(`   Files: ${afterUploadFiles.join(', ')}`);
      return false;
    }
    
    console.log('✅ Test 4 PASSED\n');
    return true;
    
  } catch (error) {
    console.error('❌ Test 4 FAILED:', error.message);
    return false;
  } finally {
    // Cleanup
    if (productId) {
      await deleteProduct(productId);
    }
    cleanupTestFiles(testFiles);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('═'.repeat(60));
  console.log('🧪 SKU-Based Filename Verification Tests');
  console.log('═'.repeat(60));
  console.log();
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Run tests
  const results = {
    test1: await test1_VerifySKUBasedFilename(),
    test2: await test2_VerifyDifferentExtensions(),
    test3: await test3_VerifyOldImageDeletion(),
    test4: await test4_VerifyNoOrphanedFiles()
  };
  
  // Summary
  console.log('═'.repeat(60));
  console.log('📊 Test Summary');
  console.log('═'.repeat(60));
  
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  
  console.log(`Test 1 (SKU-based filename): ${results.test1 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Test 2 (Different extensions): ${results.test2 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Test 3 (Old image deletion): ${results.test3 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Test 4 (No orphaned files): ${results.test4 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log();
  console.log(`Total: ${passed}/${total} tests passed`);
  console.log('═'.repeat(60));
  
  if (passed === total) {
    console.log('✅ All tests passed! SKU-based filename feature is working correctly.');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
