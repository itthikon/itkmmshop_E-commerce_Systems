/**
 * Manual Test: Upload .png Files
 * Tests the image upload functionality specifically with .png file extension
 * 
 * This test validates:
 * 1. .png files are accepted
 * 2. Files are renamed to SKU format with .png extension
 * 3. Old .png files are replaced correctly
 * 4. File content is preserved
 */

const fs = require('fs');
const path = require('path');
const FileNamingService = require('./services/FileNamingService');

console.log('=== Manual Test: .png File Upload ===\n');

// Test configuration
const TEST_DIR = path.join(__dirname, 'uploads', 'products', 'test-png');
const TEST_SKU = 'TESTPNG001';

// Helper function to create test .png file
function createTestPNGFile(filename, content = 'test png image data') {
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

// Test 1: Upload a new .png file
async function testUploadNewPNG() {
  console.log('Test 1: Upload new .png file');
  console.log('─────────────────────────────────');
  
  try {
    // Create a temporary .png file (simulating multer upload)
    const tempFile = createTestPNGFile('temp-1234567890.png', 'This is a test PNG image');
    console.log(`  Original file: ${path.basename(tempFile)}`);
    
    // Rename to SKU format
    const newFilename = await FileNamingService.renameToSKUFormat(tempFile, TEST_SKU);
    console.log(`  Renamed to: ${newFilename}`);
    
    // Verify results
    const expectedFilename = `${TEST_SKU}.png`;
    const newPath = path.join(TEST_DIR, newFilename);
    
    console.log('\n  Verification:');
    console.log(`  ✓ Expected filename: ${expectedFilename}`);
    console.log(`  ✓ Actual filename: ${newFilename}`);
    console.log(`  ✓ Filename matches: ${newFilename === expectedFilename ? 'YES' : 'NO'}`);
    console.log(`  ✓ File exists: ${fs.existsSync(newPath) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Temp file removed: ${!fs.existsSync(tempFile) ? 'YES' : 'NO'}`);
    
    const content = fs.readFileSync(newPath, 'utf8');
    console.log(`  ✓ Content preserved: ${content === 'This is a test PNG image' ? 'YES' : 'NO'}`);
    
    const allChecks = 
      newFilename === expectedFilename &&
      fs.existsSync(newPath) &&
      !fs.existsSync(tempFile) &&
      content === 'This is a test PNG image';
    
    console.log(`\n  Result: ${allChecks ? '✅ PASS' : '❌ FAIL'}\n`);
    return allChecks;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 2: Replace existing .png file
async function testReplaceExistingPNG() {
  console.log('Test 2: Replace existing .png file');
  console.log('─────────────────────────────────');
  
  try {
    // Create an existing .png file
    const existingFile = path.join(TEST_DIR, `${TEST_SKU}.png`);
    fs.writeFileSync(existingFile, 'Old PNG image data');
    console.log(`✓ Created existing file: ${TEST_SKU}.png`);
    console.log(`  Content: "Old PNG image data"`);
    
    // Create a new temporary .png file
    const tempFile = createTestPNGFile('temp-9876543210.png', 'New PNG image data');
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
    console.log(`  ✓ Content updated: ${content === 'New PNG image data' ? 'YES' : 'NO'}`);
    console.log(`  ✓ Old content replaced: ${content !== 'Old PNG image data' ? 'YES' : 'NO'}`);
    
    // Check only one file with this SKU exists
    const filesWithSKU = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    console.log(`  ✓ Only one file exists: ${filesWithSKU.length === 1 ? 'YES' : 'NO'} (found ${filesWithSKU.length})`);
    
    const allChecks = 
      fs.existsSync(newPath) &&
      !fs.existsSync(tempFile) &&
      content === 'New PNG image data' &&
      filesWithSKU.length === 1;
    
    console.log(`\n  Result: ${allChecks ? '✅ PASS' : '❌ FAIL'}\n`);
    return allChecks;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 3: Multiple .png uploads
async function testMultiplePNGUploads() {
  console.log('Test 3: Multiple .png uploads (sequential)');
  console.log('─────────────────────────────────');
  
  try {
    // Clean up previous files
    const oldFiles = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    oldFiles.forEach(f => fs.unlinkSync(path.join(TEST_DIR, f)));
    console.log('✓ Cleaned up previous test files\n');
    
    // Upload 1
    console.log('  Upload 1:');
    const temp1 = createTestPNGFile('temp-111.png', 'PNG Upload 1');
    const file1 = await FileNamingService.renameToSKUFormat(temp1, TEST_SKU);
    console.log(`    Renamed to: ${file1}`);
    
    // Upload 2 (should replace Upload 1)
    console.log('\n  Upload 2:');
    const temp2 = createTestPNGFile('temp-222.png', 'PNG Upload 2');
    const file2 = await FileNamingService.renameToSKUFormat(temp2, TEST_SKU);
    console.log(`    Renamed to: ${file2}`);
    
    // Upload 3 (should replace Upload 2)
    console.log('\n  Upload 3:');
    const temp3 = createTestPNGFile('temp-333.png', 'PNG Upload 3');
    const file3 = await FileNamingService.renameToSKUFormat(temp3, TEST_SKU);
    console.log(`    Renamed to: ${file3}`);
    
    // Verify final state
    const finalPath = path.join(TEST_DIR, file3);
    const finalContent = fs.readFileSync(finalPath, 'utf8');
    const filesWithSKU = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    
    console.log('\n  Verification:');
    console.log(`  ✓ Final file exists: ${fs.existsSync(finalPath) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Final content: "${finalContent}"`);
    console.log(`  ✓ Content is from Upload 3: ${finalContent === 'PNG Upload 3' ? 'YES' : 'NO'}`);
    console.log(`  ✓ Only one file exists: ${filesWithSKU.length === 1 ? 'YES' : 'NO'} (found ${filesWithSKU.length})`);
    console.log(`  ✓ No temp files remain: ${!fs.existsSync(temp1) && !fs.existsSync(temp2) && !fs.existsSync(temp3) ? 'YES' : 'NO'}`);
    
    const allChecks = 
      fs.existsSync(finalPath) &&
      finalContent === 'PNG Upload 3' &&
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

// Test 4: Verify .png extension is preserved
async function testPNGExtensionPreserved() {
  console.log('Test 4: Verify .png extension is preserved');
  console.log('─────────────────────────────────');
  
  try {
    // Clean up
    const oldFiles = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    oldFiles.forEach(f => fs.unlinkSync(path.join(TEST_DIR, f)));
    
    // Test with different temp filenames but .png extension
    const testCases = [
      { temp: 'temp-abc123.png', expected: `${TEST_SKU}.png` },
      { temp: 'temp-xyz789.png', expected: `${TEST_SKU}.png` },
      { temp: 'temp-product-image.png', expected: `${TEST_SKU}.png` }
    ];
    
    let allPass = true;
    
    for (const testCase of testCases) {
      const tempFile = createTestPNGFile(testCase.temp, `Test data for ${testCase.temp}`);
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

// Test 5: Test generateProductImageName with .png
function testGeneratePNGFilename() {
  console.log('Test 5: Generate .png filename');
  console.log('─────────────────────────────────');
  
  try {
    const testCases = [
      { sku: 'ELEC00001', filename: 'photo.png', expected: 'ELEC00001.png' },
      { sku: 'FASH00123', filename: 'image.PNG', expected: 'FASH00123.png' },
      { sku: 'MISC99999', filename: 'product.png', expected: 'MISC99999.png' },
      { sku: 'TEST00001', filename: 'temp-12345.png', expected: 'TEST00001.png' }
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

// Test 6: Cross-extension replacement (.png replaces .jpg/.jpeg)
async function testCrossExtensionReplacement() {
  console.log('Test 6: Cross-extension replacement (.png replaces .jpg/.jpeg)');
  console.log('─────────────────────────────────');
  
  try {
    // Clean up
    const oldFiles = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    oldFiles.forEach(f => fs.unlinkSync(path.join(TEST_DIR, f)));
    
    // Create existing .jpg and .jpeg files
    const jpgFile = path.join(TEST_DIR, `${TEST_SKU}.jpg`);
    const jpegFile = path.join(TEST_DIR, `${TEST_SKU}.jpeg`);
    fs.writeFileSync(jpgFile, 'Old JPG image');
    fs.writeFileSync(jpegFile, 'Old JPEG image');
    console.log(`✓ Created existing .jpg and .jpeg files`);
    
    // Upload a .png file (should delete both .jpg and .jpeg files)
    const tempFile = createTestPNGFile('temp-cross.png', 'New PNG image');
    const newFilename = await FileNamingService.renameToSKUFormat(tempFile, TEST_SKU);
    console.log(`  Uploaded .png file: ${newFilename}`);
    
    // Verify results
    const pngPath = path.join(TEST_DIR, `${TEST_SKU}.png`);
    const jpgExists = fs.existsSync(jpgFile);
    const jpegExists = fs.existsSync(jpegFile);
    const pngExists = fs.existsSync(pngPath);
    const filesWithSKU = fs.readdirSync(TEST_DIR).filter(f => f.startsWith(TEST_SKU));
    
    console.log('\n  Verification:');
    console.log(`  ✓ Old .jpg file deleted: ${!jpgExists ? 'YES' : 'NO'}`);
    console.log(`  ✓ Old .jpeg file deleted: ${!jpegExists ? 'YES' : 'NO'}`);
    console.log(`  ✓ New .png file exists: ${pngExists ? 'YES' : 'NO'}`);
    console.log(`  ✓ Only one file exists: ${filesWithSKU.length === 1 ? 'YES' : 'NO'} (found ${filesWithSKU.length})`);
    
    if (pngExists) {
      const content = fs.readFileSync(pngPath, 'utf8');
      console.log(`  ✓ Content is new: ${content === 'New PNG image' ? 'YES' : 'NO'}`);
    }
    
    const allChecks = !jpgExists && !jpegExists && pngExists && filesWithSKU.length === 1;
    
    console.log(`\n  Result: ${allChecks ? '✅ PASS' : '❌ FAIL'}\n`);
    return allChecks;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Main test runner
async function runPNGTests() {
  console.log('Starting .png file upload tests...\n');
  
  setupTestEnvironment();
  
  const results = [];
  
  // Run all tests
  results.push({ name: 'Upload new .png file', pass: await testUploadNewPNG() });
  results.push({ name: 'Replace existing .png file', pass: await testReplaceExistingPNG() });
  results.push({ name: 'Multiple .png uploads', pass: await testMultiplePNGUploads() });
  results.push({ name: '.png extension preserved', pass: await testPNGExtensionPreserved() });
  results.push({ name: 'Generate .png filename', pass: testGeneratePNGFilename() });
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
    console.log('🎉 SUCCESS! All .png file tests passed!');
    console.log('\n✅ .png files are correctly:');
    console.log('   • Accepted by the system');
    console.log('   • Renamed to SKU format');
    console.log('   • Replacing old files properly');
    console.log('   • Preserving file content');
    console.log('   • Maintaining .png extension');
    console.log('   • Replacing files with different extensions (.jpg, .jpeg)');
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
runPNGTests().catch(err => {
  console.error('Test runner error:', err);
  cleanupTestDir();
  process.exit(1);
});
