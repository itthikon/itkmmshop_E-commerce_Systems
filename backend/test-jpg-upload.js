/**
 * Manual Test: Upload .jpg Files
 * Tests the image upload functionality specifically with .jpg file extension
 * 
 * This test validates:
 * 1. .jpg files are accepted
 * 2. Files are renamed to SKU format with .jpg extension
 * 3. Old .jpg files are replaced correctly
 * 4. File content is preserved
 */

const fs = require('fs');
const path = require('path');
const FileNamingService = require('./services/FileNamingService');

console.log('=== Manual Test: .jpg File Upload ===\n');

// Test configuration
const TEST_DIR = path.join(__dirname, 'uploads', 'products', 'test-jpg');
const TEST_SKU = 'TESTJPG001';

// Helper function to create test .jpg file
function createTestJPGFile(filename, content = 'test jpg image data') {
  const filePath = path.join(TEST_DIR, filename);
  fs.writeFileSync(filePath, content);
  console.log(`✓ Created test file: ${filename}`);
  return filePath;
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

// Test 1: Upload a new .jpg file
async function testUploadNewJPG() {
  console.log('Test 1: Upload new .jpg file');
  console.log('─────────────────────────────────');
  
  try {
    // Create a temporary .jpg file (simulating multer upload)
    const tempFile = createTestJPGFile('temp-1234567890.jpg', 'This is a test JPG image');
    console.log(`  Original file: ${path.basename(tempFile)}`);
    
    // Rename to SKU format
    const newFilename = await FileNamingService.renameToSKUFormat(tempFile, TEST_SKU);
    console.log(`  Renamed to: ${newFilename}`);
    
    // Verify results
    const expectedFilename = `${TEST_SKU}.jpg`;
    const newPath = path.join(TEST_DIR, newFilename);
    
    console.log('\n  Verification:');
    console.log(`  ✓ Expected filename: ${expectedFilename}`);
    console.log(`  ✓ Actual filename: ${newFilename}`);
    console.log(`  ✓ Filename matches: ${newFilename === expectedFilename ? 'YES' : 'NO'}`);
    console.log(`  ✓ File exists: ${fs.existsSync(newPath) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Temp file removed: ${!fs.existsSync(tempFile) ? 'YES' : 'NO'}`);
    
    const content = fs.readFileSync(newPath, 'utf8');
    console.log(`  ✓ Content preserved: ${content === 'This is a test JPG image' ? 'YES' : 'NO'}`);
    
    const allChecks = 
      newFilename === expectedFilename &&
      fs.existsSync(newPath) &&
      !fs.existsSync(tempFile) &&
      content === 'This is a test JPG image';
    
    console.log(`\n  Result: ${allChecks ? '✅ PASS' : '❌ FAIL'}\n`);
    return allChecks;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 2: Replace existing .jpg file
async function testReplaceExistingJPG() {
  console.log('Test 2: Replace existing .jpg file');
  console.log('─────────────────────────────────');
  
  try {
    // Create an existing .jpg file
    const existingFile = path.join(TEST_DIR, `${TEST_SKU}.jpg`);
    fs.writeFileSync(existingFile, 'Old JPG image data');
    console.log(`✓ Created existing file: ${TEST_SKU}.jpg`);
    console.log(`  Content: "Old JPG image data"`);
    
    // Create a new temporary .jpg file
    const tempFile = createTestJPGFile('temp-9876543210.jpg', 'New JPG image data');
    console.log(`  New temp file: ${path.basename(tempFile)}`);
    
    // Rename to SKU format (should replace old file)
    const newFilename = await FileNamingService.renameToSKUFormat(tempFile, TEST_SKU);
    console.log(`  Renamed to: ${newFilename}`);
    
    // Verify results
    const newPath = path.join(TEST_DIR, newFilename);
    const content = fs.readFileSync(newPath, 'utf8');
    
    console.log('\n  Verification:');
    console.log(`  ✓ New file exists: ${fs.existsSync(newPath) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Temp file removed: ${!fs.existsSync(tempFile) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Content updated: ${content === 'New JPG image data' ? 'YES' : 'NO'}`);
    console.log(`  ✓ Old content replaced: ${content !== 'Old JPG image data' ? 'YES' : 'NO'}`);
    
    // Check only one file with this SKU exists
    const filesWithSKU = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    console.log(`  ✓ Only one file exists: ${filesWithSKU.length === 1 ? 'YES' : 'NO'} (found ${filesWithSKU.length})`);
    
    const allChecks = 
      fs.existsSync(newPath) &&
      !fs.existsSync(tempFile) &&
      content === 'New JPG image data' &&
      filesWithSKU.length === 1;
    
    console.log(`\n  Result: ${allChecks ? '✅ PASS' : '❌ FAIL'}\n`);
    return allChecks;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 3: Multiple .jpg uploads
async function testMultipleJPGUploads() {
  console.log('Test 3: Multiple .jpg uploads (sequential)');
  console.log('─────────────────────────────────');
  
  try {
    // Clean up previous files
    const oldFiles = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    oldFiles.forEach(f => fs.unlinkSync(path.join(TEST_DIR, f)));
    console.log('✓ Cleaned up previous test files\n');
    
    // Upload 1
    console.log('  Upload 1:');
    const temp1 = createTestJPGFile('temp-111.jpg', 'JPG Upload 1');
    const file1 = await FileNamingService.renameToSKUFormat(temp1, TEST_SKU);
    console.log(`    Renamed to: ${file1}`);
    
    // Upload 2 (should replace Upload 1)
    console.log('\n  Upload 2:');
    const temp2 = createTestJPGFile('temp-222.jpg', 'JPG Upload 2');
    const file2 = await FileNamingService.renameToSKUFormat(temp2, TEST_SKU);
    console.log(`    Renamed to: ${file2}`);
    
    // Upload 3 (should replace Upload 2)
    console.log('\n  Upload 3:');
    const temp3 = createTestJPGFile('temp-333.jpg', 'JPG Upload 3');
    const file3 = await FileNamingService.renameToSKUFormat(temp3, TEST_SKU);
    console.log(`    Renamed to: ${file3}`);
    
    // Verify final state
    const finalPath = path.join(TEST_DIR, file3);
    const finalContent = fs.readFileSync(finalPath, 'utf8');
    const filesWithSKU = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    
    console.log('\n  Verification:');
    console.log(`  ✓ Final file exists: ${fs.existsSync(finalPath) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Final content: "${finalContent}"`);
    console.log(`  ✓ Content is from Upload 3: ${finalContent === 'JPG Upload 3' ? 'YES' : 'NO'}`);
    console.log(`  ✓ Only one file exists: ${filesWithSKU.length === 1 ? 'YES' : 'NO'} (found ${filesWithSKU.length})`);
    console.log(`  ✓ No temp files remain: ${!fs.existsSync(temp1) && !fs.existsSync(temp2) && !fs.existsSync(temp3) ? 'YES' : 'NO'}`);
    
    const allChecks = 
      fs.existsSync(finalPath) &&
      finalContent === 'JPG Upload 3' &&
      filesWithSKU.length === 1 &&
      !fs.existsSync(temp1) &&
      !fs.existsSync(temp2) &&
      !fs.existsSync(temp3);
    
    console.log(`\n  Result: ${allChecks ? '✅ PASS' : '❌ FAIL'}\n`);
    return allChecks;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 4: Verify .jpg extension is preserved
async function testJPGExtensionPreserved() {
  console.log('Test 4: Verify .jpg extension is preserved');
  console.log('─────────────────────────────────');
  
  try {
    // Clean up
    const oldFiles = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    oldFiles.forEach(f => fs.unlinkSync(path.join(TEST_DIR, f)));
    
    // Test with different temp filenames but .jpg extension
    const testCases = [
      { temp: 'temp-abc123.jpg', expected: `${TEST_SKU}.jpg` },
      { temp: 'temp-xyz789.jpg', expected: `${TEST_SKU}.jpg` },
      { temp: 'temp-product-image.jpg', expected: `${TEST_SKU}.jpg` }
    ];
    
    let allPass = true;
    
    for (const testCase of testCases) {
      const tempFile = createTestJPGFile(testCase.temp, `Test data for ${testCase.temp}`);
      const result = await FileNamingService.renameToSKUFormat(tempFile, TEST_SKU);
      
      const pass = result === testCase.expected;
      console.log(`  ${pass ? '✓' : '✗'} ${testCase.temp} → ${result} ${!pass ? `(expected ${testCase.expected})` : ''}`);
      
      if (!pass) allPass = false;
      
      // Clean up for next iteration
      const resultPath = path.join(TEST_DIR, result);
      if (fs.existsSync(resultPath)) {
        fs.unlinkSync(resultPath);
      }
    }
    
    console.log(`\n  Result: ${allPass ? '✅ PASS' : '❌ FAIL'}\n`);
    return allPass;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 5: Test generateProductImageName with .jpg
function testGenerateJPGFilename() {
  console.log('Test 5: Generate .jpg filename');
  console.log('─────────────────────────────────');
  
  try {
    const testCases = [
      { sku: 'ELEC00001', filename: 'photo.jpg', expected: 'ELEC00001.jpg' },
      { sku: 'FASH00123', filename: 'image.JPG', expected: 'FASH00123.jpg' },
      { sku: 'MISC99999', filename: 'product.jpg', expected: 'MISC99999.jpg' },
      { sku: 'TEST00001', filename: 'temp-12345.jpg', expected: 'TEST00001.jpg' }
    ];
    
    let allPass = true;
    
    testCases.forEach(test => {
      const result = FileNamingService.generateProductImageName(test.sku, test.filename);
      const pass = result === test.expected;
      console.log(`  ${pass ? '✓' : '✗'} ${test.sku} + ${test.filename} = ${result} ${!pass ? `(expected ${test.expected})` : ''}`);
      if (!pass) allPass = false;
    });
    
    console.log(`\n  Result: ${allPass ? '✅ PASS' : '❌ FAIL'}\n`);
    return allPass;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Main test runner
async function runJPGTests() {
  console.log('Starting .jpg file upload tests...\n');
  
  setupTestEnvironment();
  
  const results = [];
  
  // Run all tests
  results.push({ name: 'Upload new .jpg file', pass: await testUploadNewJPG() });
  results.push({ name: 'Replace existing .jpg file', pass: await testReplaceExistingJPG() });
  results.push({ name: 'Multiple .jpg uploads', pass: await testMultipleJPGUploads() });
  results.push({ name: '.jpg extension preserved', pass: await testJPGExtensionPreserved() });
  results.push({ name: 'Generate .jpg filename', pass: testGenerateJPGFilename() });
  
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
    console.log('🎉 SUCCESS! All .jpg file tests passed!');
    console.log('\n✅ .jpg files are correctly:');
    console.log('   • Accepted by the system');
    console.log('   • Renamed to SKU format');
    console.log('   • Replacing old files properly');
    console.log('   • Preserving file content');
    console.log('   • Maintaining .jpg extension');
  } else {
    console.log(`⚠️  WARNING: ${totalTests - passedTests} test(s) failed.`);
    console.log('Please review the failures above.');
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('         NEXT STEPS');
  console.log('═══════════════════════════════════════');
  console.log('1. ✓ Test with .jpg files (COMPLETE)');
  console.log('2. Test with .jpeg files');
  console.log('3. Test with .png files');
  console.log('4. Test with files < 5MB');
  console.log('5. Test with files > 5MB (should fail)');
  console.log('6. Test with invalid file types (should fail)');
  console.log('7. Test image replacement');
  console.log('8. Test with product not found (should fail)');
  console.log('9. Verify SKU-based filenames');
  console.log('10. Verify old files are deleted');
  console.log('═══════════════════════════════════════\n');
}

// Run tests
runJPGTests().catch(err => {
  console.error('Test runner error:', err);
  cleanupTestDir();
  process.exit(1);
});
