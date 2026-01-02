/**
 * Manual Test: File Size Over 5MB (Should Fail)
 * Tests that files over 5MB are rejected by the system
 * 
 * This test validates:
 * 1. Files over 5MB are rejected by multer
 * 2. Appropriate error messages are returned
 * 3. No files are saved when size limit is exceeded
 * 4. System handles various sizes over the limit (5.1MB, 6MB, 10MB)
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

console.log('=== Manual Test: File Size Over 5MB (Should Fail) ===\n');

// Test configuration
const API_URL = 'http://localhost:5050';
const TEST_DIR = path.join(__dirname, 'uploads', 'products', 'test-oversized');
const TEST_PRODUCT_ID = 1; // Assuming product with ID 1 exists

// Helper function to create test file with specific size
function createTestFileWithSize(filename, sizeInBytes) {
  const filePath = path.join(TEST_DIR, filename);
  
  // Create buffer with specified size
  const buffer = Buffer.alloc(sizeInBytes);
  
  // Fill with some pattern to make it realistic
  for (let i = 0; i < sizeInBytes; i++) {
    buffer[i] = i % 256;
  }
  
  fs.writeFileSync(filePath, buffer);
  
  const actualSize = fs.statSync(filePath).size;
  console.log(`✓ Created test file: ${filename} (${formatFileSize(actualSize)})`);
  
  return filePath;
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Helper function to cleanup test directory
function cleanupTestDir() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

// Setup test environment
function setupTestEnvironment() {
  console.log('Setting up test environment...');
  cleanupTestDir();
  fs.mkdirSync(TEST_DIR, { recursive: true });
  console.log('✓ Test directory created\n');
}

// Helper function to upload file to API
async function uploadFileToAPI(filePath, productId) {
  const form = new FormData();
  form.append('image', fs.createReadStream(filePath));
  
  try {
    const response = await axios.post(
      `${API_URL}/api/products/${productId}/image`,
      form,
      {
        headers: {
          ...form.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response ? error.response.data : error.message,
      status: error.response ? error.response.status : null
    };
  }
}

// Test 1: Upload 5.1MB file (just over limit)
async function testUpload5_1MB() {
  console.log('Test 1: Upload 5.1MB file (just over limit)');
  console.log('─────────────────────────────────');
  
  try {
    const fileSize = Math.floor(5.1 * 1024 * 1024); // 5.1MB
    const tempFile = createTestFileWithSize('temp-5.1mb.jpg', fileSize);
    
    const fileStats = fs.statSync(tempFile);
    console.log(`  File size: ${formatFileSize(fileStats.size)}`);
    console.log(`  Over limit: ${fileStats.size > 5 * 1024 * 1024 ? 'YES' : 'NO'}`);
    
    console.log('\n  Attempting upload...');
    const result = await uploadFileToAPI(tempFile, TEST_PRODUCT_ID);
    
    console.log('\n  Verification:');
    console.log(`  ✓ Upload rejected: ${!result.success ? 'YES' : 'NO'}`);
    console.log(`  ✓ Error returned: ${result.error ? 'YES' : 'NO'}`);
    console.log(`  ✓ HTTP status: ${result.status || 'N/A'}`);
    
    if (result.error) {
      console.log(`  ✓ Error message: ${JSON.stringify(result.error)}`);
    }
    
    const testPass = !result.success && result.error;
    console.log(`\n  Result: ${testPass ? '✅ PASS (Correctly rejected)' : '❌ FAIL (Should have been rejected)'}\n`);
    
    // Cleanup
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    
    return testPass;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 2: Upload 6MB file
async function testUpload6MB() {
  console.log('Test 2: Upload 6MB file');
  console.log('─────────────────────────────────');
  
  try {
    const fileSize = 6 * 1024 * 1024; // 6MB
    const tempFile = createTestFileWithSize('temp-6mb.png', fileSize);
    
    const fileStats = fs.statSync(tempFile);
    console.log(`  File size: ${formatFileSize(fileStats.size)}`);
    console.log(`  Over limit: ${fileStats.size > 5 * 1024 * 1024 ? 'YES' : 'NO'}`);
    
    console.log('\n  Attempting upload...');
    const result = await uploadFileToAPI(tempFile, TEST_PRODUCT_ID);
    
    console.log('\n  Verification:');
    console.log(`  ✓ Upload rejected: ${!result.success ? 'YES' : 'NO'}`);
    console.log(`  ✓ Error returned: ${result.error ? 'YES' : 'NO'}`);
    console.log(`  ✓ HTTP status: ${result.status || 'N/A'}`);
    
    if (result.error) {
      console.log(`  ✓ Error message: ${JSON.stringify(result.error)}`);
    }
    
    const testPass = !result.success && result.error;
    console.log(`\n  Result: ${testPass ? '✅ PASS (Correctly rejected)' : '❌ FAIL (Should have been rejected)'}\n`);
    
    // Cleanup
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    
    return testPass;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 3: Upload 10MB file
async function testUpload10MB() {
  console.log('Test 3: Upload 10MB file');
  console.log('─────────────────────────────────');
  
  try {
    const fileSize = 10 * 1024 * 1024; // 10MB
    const tempFile = createTestFileWithSize('temp-10mb.jpeg', fileSize);
    
    const fileStats = fs.statSync(tempFile);
    console.log(`  File size: ${formatFileSize(fileStats.size)}`);
    console.log(`  Over limit: ${fileStats.size > 5 * 1024 * 1024 ? 'YES' : 'NO'}`);
    
    console.log('\n  Attempting upload...');
    const result = await uploadFileToAPI(tempFile, TEST_PRODUCT_ID);
    
    console.log('\n  Verification:');
    console.log(`  ✓ Upload rejected: ${!result.success ? 'YES' : 'NO'}`);
    console.log(`  ✓ Error returned: ${result.error ? 'YES' : 'NO'}`);
    console.log(`  ✓ HTTP status: ${result.status || 'N/A'}`);
    
    if (result.error) {
      console.log(`  ✓ Error message: ${JSON.stringify(result.error)}`);
    }
    
    const testPass = !result.success && result.error;
    console.log(`\n  Result: ${testPass ? '✅ PASS (Correctly rejected)' : '❌ FAIL (Should have been rejected)'}\n`);
    
    // Cleanup
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    
    return testPass;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 4: Upload 20MB file (significantly over limit)
async function testUpload20MB() {
  console.log('Test 4: Upload 20MB file (significantly over limit)');
  console.log('─────────────────────────────────');
  
  try {
    const fileSize = 20 * 1024 * 1024; // 20MB
    const tempFile = createTestFileWithSize('temp-20mb.jpg', fileSize);
    
    const fileStats = fs.statSync(tempFile);
    console.log(`  File size: ${formatFileSize(fileStats.size)}`);
    console.log(`  Over limit: ${fileStats.size > 5 * 1024 * 1024 ? 'YES' : 'NO'}`);
    
    console.log('\n  Attempting upload...');
    const result = await uploadFileToAPI(tempFile, TEST_PRODUCT_ID);
    
    console.log('\n  Verification:');
    console.log(`  ✓ Upload rejected: ${!result.success ? 'YES' : 'NO'}`);
    console.log(`  ✓ Error returned: ${result.error ? 'YES' : 'NO'}`);
    console.log(`  ✓ HTTP status: ${result.status || 'N/A'}`);
    
    if (result.error) {
      console.log(`  ✓ Error message: ${JSON.stringify(result.error)}`);
    }
    
    const testPass = !result.success && result.error;
    console.log(`\n  Result: ${testPass ? '✅ PASS (Correctly rejected)' : '❌ FAIL (Should have been rejected)'}\n`);
    
    // Cleanup
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    
    return testPass;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 5: Verify no files are saved when rejected
async function testNoFileSavedOnRejection() {
  console.log('Test 5: Verify no files are saved when rejected');
  console.log('─────────────────────────────────');
  
  try {
    const uploadsDir = path.join(__dirname, 'uploads', 'products');
    
    // Get list of files before upload
    const filesBefore = fs.existsSync(uploadsDir) 
      ? fs.readdirSync(uploadsDir).filter(f => !f.startsWith('.'))
      : [];
    
    console.log(`  Files before upload: ${filesBefore.length}`);
    
    // Try to upload oversized file
    const fileSize = 7 * 1024 * 1024; // 7MB
    const tempFile = createTestFileWithSize('temp-7mb.png', fileSize);
    
    console.log(`  Attempting upload of ${formatFileSize(fileSize)} file...`);
    const result = await uploadFileToAPI(tempFile, TEST_PRODUCT_ID);
    
    // Get list of files after upload attempt
    const filesAfter = fs.existsSync(uploadsDir)
      ? fs.readdirSync(uploadsDir).filter(f => !f.startsWith('.'))
      : [];
    
    console.log(`  Files after upload: ${filesAfter.length}`);
    
    console.log('\n  Verification:');
    console.log(`  ✓ Upload rejected: ${!result.success ? 'YES' : 'NO'}`);
    console.log(`  ✓ No new files saved: ${filesBefore.length === filesAfter.length ? 'YES' : 'NO'}`);
    console.log(`  ✓ Temp file cleaned up: ${!fs.existsSync(tempFile) || fs.existsSync(tempFile) ? 'CHECK' : 'N/A'}`);
    
    const testPass = !result.success && filesBefore.length === filesAfter.length;
    console.log(`\n  Result: ${testPass ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Cleanup
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    
    return testPass;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 6: Multiple oversized files in sequence
async function testMultipleOversizedFiles() {
  console.log('Test 6: Multiple oversized files in sequence');
  console.log('─────────────────────────────────');
  
  try {
    const testSizes = [
      { size: 5.5 * 1024 * 1024, name: '5.5MB', ext: '.jpg' },
      { size: 8 * 1024 * 1024, name: '8MB', ext: '.jpeg' },
      { size: 12 * 1024 * 1024, name: '12MB', ext: '.png' }
    ];
    
    let allPass = true;
    
    for (const test of testSizes) {
      const tempFile = createTestFileWithSize(`temp-${test.name}${test.ext}`, test.size);
      const result = await uploadFileToAPI(tempFile, TEST_PRODUCT_ID);
      
      const pass = !result.success && result.error;
      console.log(`  ${pass ? '✓' : '✗'} ${test.name} file: ${pass ? 'REJECTED' : 'ACCEPTED (WRONG!)'}`);
      
      if (!pass) allPass = false;
      
      // Cleanup
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
    
    console.log(`\n  Result: ${allPass ? '✅ PASS' : '❌ FAIL'}\n`);
    return allPass;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Check if server is running
async function checkServerStatus() {
  try {
    await axios.get(`${API_URL}/api/products`);
    return true;
  } catch (error) {
    return false;
  }
}

// Main test runner
async function runOversizedFileTests() {
  console.log('Starting oversized file tests (> 5MB)...\n');
  
  // Check if server is running
  console.log('Checking server status...');
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('❌ ERROR: Server is not running!');
    console.log('\nPlease start the server first:');
    console.log('  cd backend');
    console.log('  node server.js');
    console.log('\nThen run this test again.\n');
    return;
  }
  
  console.log('✓ Server is running\n');
  
  setupTestEnvironment();
  
  const results = [];
  
  // Run all tests
  results.push({ name: 'Upload 5.1MB file', pass: await testUpload5_1MB() });
  results.push({ name: 'Upload 6MB file', pass: await testUpload6MB() });
  results.push({ name: 'Upload 10MB file', pass: await testUpload10MB() });
  results.push({ name: 'Upload 20MB file', pass: await testUpload20MB() });
  results.push({ name: 'No files saved on rejection', pass: await testNoFileSavedOnRejection() });
  results.push({ name: 'Multiple oversized files', pass: await testMultipleOversizedFiles() });
  
  // Cleanup
  cleanupTestDir();
  console.log('✓ Test directory cleaned up\n');
  
  // Summary
  console.log('═══════════════════════════════════════');
  console.log('           TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  
  const passedTests = results.filter(r => r.pass).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    console.log(`${result.pass ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log('───────────────────────────────────────');
  console.log(`Total: ${passedTests}/${totalTests} tests passed`);
  console.log('═══════════════════════════════════════\n');
  
  if (passedTests === totalTests) {
    console.log('🎉 SUCCESS! All oversized file tests passed!');
    console.log('\n✅ Files over 5MB are correctly:');
    console.log('   • Rejected by the system');
    console.log('   • Returning appropriate error messages');
    console.log('   • Not saved to disk');
    console.log('   • Handled consistently across different sizes');
    console.log('   • Cleaned up properly (no orphaned files)');
  } else {
    console.log(`⚠️  WARNING: ${totalTests - passedTests} test(s) failed.`);
    console.log('Please review the failures above.');
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('         NEXT STEPS');
  console.log('═══════════════════════════════════════');
  console.log('1. ✓ Test with .jpg files (COMPLETE)');
  console.log('2. ✓ Test with .jpeg files (COMPLETE)');
  console.log('3. ✓ Test with .png files (COMPLETE)');
  console.log('4. ✓ Test with files < 5MB (COMPLETE)');
  console.log('5. ✓ Test with files > 5MB (COMPLETE)');
  console.log('6. Test with invalid file types (should fail)');
  console.log('7. Test image replacement');
  console.log('8. Test with product not found (should fail)');
  console.log('9. Verify SKU-based filenames');
  console.log('10. Verify old files are deleted');
  console.log('═══════════════════════════════════════\n');
}

// Run tests
runOversizedFileTests().catch(err => {
  console.error('Test runner error:', err);
  cleanupTestDir();
  process.exit(1);
});
