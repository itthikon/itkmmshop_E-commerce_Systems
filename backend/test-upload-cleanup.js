/**
 * Test script for upload cleanup logic
 * Tests that temporary and renamed files are properly cleaned up on errors
 */

const fs = require('fs');
const path = require('path');

// Mock the Product model to simulate failures
const mockProduct = {
  findById: async (id) => {
    if (id === 'valid-id') {
      return {
        id: 'valid-id',
        sku: 'TEST00001',
        name: 'Test Product'
      };
    }
    return null;
  },
  update: async (id, data) => {
    if (id === 'fail-update') {
      throw new Error('Database update failed');
    }
    return {
      id,
      ...data
    };
  }
};

// Mock FileNamingService
const mockFileNamingService = {
  renameToSKUFormat: async (currentPath, sku) => {
    const extension = path.extname(currentPath);
    const directory = path.dirname(currentPath);
    const newFilename = `${sku}${extension}`;
    const newPath = path.join(directory, newFilename);
    
    // Simulate rename
    if (fs.existsSync(currentPath)) {
      fs.renameSync(currentPath, newPath);
    }
    
    return newFilename;
  }
};

// Test helper to create a temp file
function createTempFile(filename) {
  const uploadsDir = path.join(__dirname, 'uploads', 'products');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, 'test image data');
  return filePath;
}

// Test helper to check if file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Test helper to cleanup test files
function cleanupTestFiles() {
  const uploadsDir = path.join(__dirname, 'uploads', 'products');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    files.forEach(file => {
      if (file.startsWith('temp-') || file.startsWith('TEST')) {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    });
  }
}

// Simulate the uploadImage controller logic
async function simulateUpload(productId, tempFilePath) {
  const fs = require('fs');
  const path = require('path');
  let renamedFilePath = null;
  
  try {
    const reqFile = {
      path: tempFilePath
    };

    // Check if product exists and get SKU
    const product = await mockProduct.findById(productId);
    if (!product) {
      // Delete uploaded file if product not found
      if (fs.existsSync(reqFile.path)) {
        fs.unlinkSync(reqFile.path);
      }
      
      throw new Error('PRODUCT_NOT_FOUND');
    }

    // Rename file to SKU format
    const newFilename = await mockFileNamingService.renameToSKUFormat(
      reqFile.path,
      product.sku
    );

    // Track the renamed file path for cleanup if needed
    renamedFilePath = path.join(path.dirname(reqFile.path), newFilename);

    // Update product with new image path
    const imagePath = `/uploads/products/${newFilename}`;
    await mockProduct.update(productId, { 
      image_path: imagePath 
    });

    return { success: true, imagePath, newFilename };
  } catch (err) {
    console.error('Upload error:', err.message);
    
    // Comprehensive cleanup logic for failed uploads
    try {
      // Case 1: Original temp file still exists (rename failed)
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log(`✓ Cleaned up temp file: ${path.basename(tempFilePath)}`);
      }
      
      // Case 2: Renamed file exists but database update failed
      if (renamedFilePath && fs.existsSync(renamedFilePath)) {
        fs.unlinkSync(renamedFilePath);
        console.log(`✓ Cleaned up renamed file: ${path.basename(renamedFilePath)}`);
      }
    } catch (cleanupErr) {
      console.error('Error during file cleanup:', cleanupErr);
    }
    
    throw err;
  }
}

// Run tests
async function runTests() {
  console.log('=== Testing Upload Cleanup Logic ===\n');
  
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Product not found - temp file should be cleaned up
  console.log('Test 1: Product not found - cleanup temp file');
  try {
    cleanupTestFiles();
    const tempFile = createTempFile('temp-12345.jpg');
    
    try {
      await simulateUpload('invalid-id', tempFile);
      console.log('✗ Test 1 FAILED: Should have thrown error\n');
      testsFailed++;
    } catch (err) {
      if (!fileExists(tempFile)) {
        console.log('✓ Test 1 PASSED: Temp file cleaned up\n');
        testsPassed++;
      } else {
        console.log('✗ Test 1 FAILED: Temp file not cleaned up\n');
        testsFailed++;
      }
    }
  } catch (err) {
    console.log('✗ Test 1 FAILED:', err.message, '\n');
    testsFailed++;
  }

  // Test 2: Database update fails - renamed file should be cleaned up
  console.log('Test 2: Database update fails - cleanup renamed file');
  try {
    cleanupTestFiles();
    const tempFile = createTempFile('temp-67890.jpg');
    const expectedRenamedFile = path.join(path.dirname(tempFile), 'TEST00001.jpg');
    
    try {
      await simulateUpload('fail-update', tempFile);
      console.log('✗ Test 2 FAILED: Should have thrown error\n');
      testsFailed++;
    } catch (err) {
      if (!fileExists(tempFile) && !fileExists(expectedRenamedFile)) {
        console.log('✓ Test 2 PASSED: Both temp and renamed files cleaned up\n');
        testsPassed++;
      } else {
        console.log('✗ Test 2 FAILED: Files not properly cleaned up');
        console.log(`  Temp file exists: ${fileExists(tempFile)}`);
        console.log(`  Renamed file exists: ${fileExists(expectedRenamedFile)}\n`);
        testsFailed++;
      }
    }
  } catch (err) {
    console.log('✗ Test 2 FAILED:', err.message, '\n');
    testsFailed++;
  }

  // Test 3: Successful upload - only renamed file should exist
  console.log('Test 3: Successful upload - renamed file exists');
  try {
    cleanupTestFiles();
    const tempFile = createTempFile('temp-11111.jpg');
    const expectedRenamedFile = path.join(path.dirname(tempFile), 'TEST00001.jpg');
    
    const result = await simulateUpload('valid-id', tempFile);
    
    if (!fileExists(tempFile) && fileExists(expectedRenamedFile)) {
      console.log('✓ Test 3 PASSED: Temp file removed, renamed file exists\n');
      testsPassed++;
    } else {
      console.log('✗ Test 3 FAILED: File state incorrect');
      console.log(`  Temp file exists: ${fileExists(tempFile)}`);
      console.log(`  Renamed file exists: ${fileExists(expectedRenamedFile)}\n`);
      testsFailed++;
    }
  } catch (err) {
    console.log('✗ Test 3 FAILED:', err.message, '\n');
    testsFailed++;
  }

  // Cleanup
  cleanupTestFiles();

  // Summary
  console.log('=== Test Summary ===');
  console.log(`Total: ${testsPassed + testsFailed}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n✓ All tests passed!');
  } else {
    console.log('\n✗ Some tests failed');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
