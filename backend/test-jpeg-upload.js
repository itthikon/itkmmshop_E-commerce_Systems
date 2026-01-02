/**
 * Manual Test: Upload .jpeg Files
 * Tests the image upload functionality specifically with .jpeg file extension
 * 
 * This test validates:
 * 1. .jpeg files are accepted
 * 2. Files are renamed to SKU format with .jpeg extension
 * 3. Old .jpeg files are replaced correctly
 * 4. File content is preserved
 */

const fs = require('fs');
const path = require('path');
const FileNamingService = require('./services/FileNamingService');

console.log('=== Manual Test: .jpeg File Upload ===\n');

// Test configuration
const TEST_DIR = path.join(__dirname, 'uploads', 'products', 'test-jpeg');
const TEST_SKU = 'TESTJPEG001';

// Helper function to create test .jpeg file
function createTestJPEGFile(filename, content = 'test jpeg image data') {
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

// Test 1: Upload a new .jpeg file
async function testUploadNewJPEG() {
  console.log('Test 1: Upload new .jpeg file');
  console.log('─────────────────────────────────');
  
  try {
    // Create a temporary .jpeg file (simulating multer upload)
    const tempFile = createTestJPEGFile('temp-1234567890.jpeg', 'This is a test JPEG image');
    console.log(`  Original file: ${path.basename(tempFile)}`);
    
    // Rename to SKU format
    const newFilename = await FileNamingService.renameToSKUFormat(tempFile, TEST_SKU);
    console.log(`  Renamed to: ${newFilename}`);
    
    // Verify results
    const expectedFilename = `${TEST_SKU}.jpeg`;
    const newPath = path.join(TEST_DIR, newFilename);
    
    console.log('\n  Verification:');
    console.log(`  ✓ Expected filename: ${expectedFilename}`);
    console.log(`  ✓ Actual filename: ${newFilename}`);
    console.log(`  ✓ Filename matches: ${newFilename === expectedFilename ? 'YES' : 'NO'}`);
    console.log(`  ✓ File exists: ${fs.existsSync(newPath) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Temp file removed: ${!fs.existsSync(tempFile) ? 'YES' : 'NO'}`);
    
    const content = fs.readFileSync(newPath, 'utf8');
    console.log(`  ✓ Content preserved: ${content === 'This is a test JPEG image' ? 'YES' : 'NO'}`);
    
    const allChecks = 
      newFilename === expectedFilename &&
      fs.existsSync(newPath) &&
      !fs.existsSync(tempFile) &&
      content === 'This is a test JPEG image';
    
    console.log(`\n  Result: ${allChecks ? '✅ PASS' : '❌ FAIL'}\n`);
    return allChecks;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 2: Replace existing .jpeg file
async function testReplaceExistingJPEG() {
  console.log('Test 2: Replace existing .jpeg file');
  console.log('─────────────────────────────────');
  
  try {
    // Create an existing .jpeg file
    const existingFile = path.join(TEST_DIR, `${TEST_SKU}.jpeg`);
    fs.writeFileSync(existingFile, 'Old JPEG image data');
    console.log(`✓ Created existing file: ${TEST_SKU}.jpeg`);
    console.log(`  Content: "Old JPEG image data"`);
    
    // Create a new temporary .jpeg file
    const tempFile = createTestJPEGFile('temp-9876543210.jpeg', 'New JPEG image data');
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
    console.log(`  ✓ Content updated: ${content === 'New JPEG image data' ? 'YES' : 'NO'}`);
    console.log(`  ✓ Old content replaced: ${content !== 'Old JPEG image data' ? 'YES' : 'NO'}`);
    
    // Check only one file with this SKU exists
    const filesWithSKU = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    console.log(`  ✓ Only one file exists: ${filesWithSKU.length === 1 ? 'YES' : 'NO'} (found ${filesWithSKU.length})`);
    
    const allChecks = 
      fs.existsSync(newPath) &&
      !fs.existsSync(tempFile) &&
      content === 'New JPEG image data' &&
      filesWithSKU.length === 1;
    
    console.log(`\n  Result: ${allChecks ? '✅ PASS' : '❌ FAIL'}\n`);
    return allChecks;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 3: Multiple .jpeg uploads
async function testMultipleJPEGUploads() {
  console.log('Test 3: Multiple .jpeg uploads (sequential)');
  console.log('─────────────────────────────────');
  
  try {
    // Clean up previous files
    const oldFiles = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    oldFiles.forEach(f => fs.unlinkSync(path.join(TEST_DIR, f)));
    console.log('✓ Cleaned up previous test files\n');
    
    // Upload 1
    console.log('  Upload 1:');
    const temp1 = createTestJPEGFile('temp-111.jpeg', 'JPEG Upload 1');
    const file1 = await FileNamingService.renameToSKUFormat(temp1, TEST_SKU);
    console.log(`    Renamed to: ${file1}`);
    
    // Upload 2 (should replace Upload 1)
    console.log('\n  Upload 2:');
    const temp2 = createTestJPEGFile('temp-222.jpeg', 'JPEG Upload 2');
    const file2 = await FileNamingService.renameToSKUFormat(temp2, TEST_SKU);
    console.log(`    Renamed to: ${file2}`);
    
    // Upload 3 (should replace Upload 2)
    console.log('\n  Upload 3:');
    const temp3 = createTestJPEGFile('temp-333.jpeg', 'JPEG Upload 3');
    const file3 = await FileNamingService.renameToSKUFormat(temp3, TEST_SKU);
    console.log(`    Renamed to: ${file3}`);
    
    // Verify final state
    const finalPath = path.join(TEST_DIR, file3);
    const finalContent = fs.readFileSync(finalPath, 'utf8');
    const filesWithSKU = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    
    console.log('\n  Verification:');
    console.log(`  ✓ Final file exists: ${fs.existsSync(finalPath) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Final content: "${finalContent}"`);
    console.log(`  ✓ Content is from Upload 3: ${finalContent === 'JPEG Upload 3' ? 'YES' : 'NO'}`);
    console.log(`  ✓ Only one file exists: ${filesWithSKU.length === 1 ? 'YES' : 'NO'} (found ${filesWithSKU.length})`);
    console.log(`  ✓ No temp files remain: ${!fs.existsSync(temp1) && !fs.existsSync(temp2) && !fs.existsSync(temp3) ? 'YES' : 'NO'}`);
    
    const allChecks = 
      fs.existsSync(finalPath) &&
      finalContent === 'JPEG Upload 3' &&
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

// Test 4: Verify .jpeg extension is preserved
async function testJPEGExtensionPreserved() {
  console.log('Test 4: Verify .jpeg extension is preserved');
  console.log('─────────────────────────────────');
  
  try {
    // Clean up
    const oldFiles = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    oldFiles.forEach(f => fs.unlinkSync(path.join(TEST_DIR, f)));
    
    // Test with different temp filenames but .jpeg extension
    const testCases = [
      { temp: 'temp-abc123.jpeg', expected: `${TEST_SKU}.jpeg` },
      { temp: 'temp-xyz789.jpeg', expected: `${TEST_SKU}.jpeg` },
      { temp: 'temp-product-image.jpeg', expected: `${TEST_SKU}.jpeg` }
    ];
    
    let allPass = true;
    
    for (const testCase of testCases) {
      const tempFile = createTestJPEGFile(testCase.temp, `Test data for ${testCase.temp}`);
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

// Test 5: Test generateProductImageName with .jpeg
function testGenerateJPEGFilename() {
  console.log('Test 5: Generate .jpeg filename');
  console.log('─────────────────────────────────');
  
  try {
    const testCases = [
      { sku: 'ELEC00001', filename: 'photo.jpeg', expected: 'ELEC00001.jpeg' },
      { sku: 'FASH00123', filename: 'image.JPEG', expected: 'FASH00123.jpeg' },
      { sku: 'MISC99999', filename: 'product.jpeg', expected: 'MISC99999.jpeg' },
      { sku: 'TEST00001', filename: 'temp-12345.jpeg', expected: 'TEST00001.jpeg' }
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

// Test 6: Cross-extension replacement (.jpeg replaces .jpg)
async function testCrossExtensionReplacement() {
  console.log('Test 6: Cross-extension replacement (.jpeg replaces .jpg)');
  console.log('─────────────────────────────────');
  
  try {
    // Clean up
    const oldFiles = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    oldFiles.forEach(f => fs.unlinkSync(path.join(TEST_DIR, f)));
    
    // Create an existing .jpg file
    const jpgFile = path.join(TEST_DIR, `${TEST_SKU}.jpg`);
    fs.writeFileSync(jpgFile, 'Old JPG image');
    console.log(`✓ Created existing .jpg file: ${TEST_SKU}.jpg`);
    
    // Upload a .jpeg file (should delete the .jpg file)
    const tempFile = createTestJPEGFile('temp-cross.jpeg', 'New JPEG image');
    const newFilename = await FileNamingService.renameToSKUFormat(tempFile, TEST_SKU);
    console.log(`  Uploaded .jpeg file: ${newFilename}`);
    
    // Verify results
    const jpegPath = path.join(TEST_DIR, `${TEST_SKU}.jpeg`);
    const jpgExists = fs.existsSync(jpgFile);
    const jpegExists = fs.existsSync(jpegPath);
    const filesWithSKU = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    
    console.log('\n  Verification:');
    console.log(`  ✓ Old .jpg file deleted: ${!jpgExists ? 'YES' : 'NO'}`);
    console.log(`  ✓ New .jpeg file exists: ${jpegExists ? 'YES' : 'NO'}`);
    console.log(`  ✓ Only one file exists: ${filesWithSKU.length === 1 ? 'YES' : 'NO'} (found ${filesWithSKU.length})`);
    
    if (jpegExists) {
      const content = fs.readFileSync(jpegPath, 'utf8');
      console.log(`  ✓ Content is new: ${content === 'New JPEG image' ? 'YES' : 'NO'}`);
    }
    
    const allChecks = !jpgExists && jpegExists && filesWithSKU.length === 1;
    
    console.log(`\n  Result: ${allChecks ? '✅ PASS' : '❌ FAIL'}\n`);
    return allChecks;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Main test runner
async function runJPEGTests() {
  console.log('Starting .jpeg file upload tests...\n');
  
  setupTestEnvironment();
  
  const results = [];
  
  // Run all tests
  results.push({ name: 'Upload new .jpeg file', pass: await testUploadNewJPEG() });
  results.push({ name: 'Replace existing .jpeg file', pass: await testReplaceExistingJPEG() });
  results.push({ name: 'Multiple .jpeg uploads', pass: await testMultipleJPEGUploads() });
  results.push({ name: '.jpeg extension preserved', pass: await testJPEGExtensionPreserved() });
  results.push({ name: 'Generate .jpeg filename', pass: testGenerateJPEGFilename() });
  results.push({ name: 'Cross-extension replacement', pass: await testCrossExtensionReplacement() });
  
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
    console.log('🎉 SUCCESS! All .jpeg file tests passed!');
    console.log('\n✅ .jpeg files are correctly:');
    console.log('   • Accepted by the system');
    console.log('   • Renamed to SKU format');
    console.log('   • Replacing old files properly');
    console.log('   • Preserving file content');
    console.log('   • Maintaining .jpeg extension');
    console.log('   • Replacing files with different extensions (.jpg)');
  } else {
    console.log(`⚠️  WARNING: ${totalTests - passedTests} test(s) failed.`);
    console.log('Please review the failures above.');
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('         NEXT STEPS');
  console.log('═══════════════════════════════════════');
  console.log('1. ✓ Test with .jpg files (COMPLETE)');
  console.log('2. ✓ Test with .jpeg files (COMPLETE)');
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
runJPEGTests().catch(err => {
  console.error('Test runner error:', err);
  cleanupTestDir();
  process.exit(1);
});
