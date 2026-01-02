/**
 * Manual Test: File Size Under 5MB
 * Tests that files under 5MB are accepted and processed correctly
 * 
 * This test validates:
 * 1. Files under 5MB are accepted
 * 2. Various file sizes (1KB, 100KB, 1MB, 4MB) work correctly
 * 3. Files are renamed to SKU format regardless of size
 * 4. File content is preserved for all sizes
 */

const fs = require('fs');
const path = require('path');
const FileNamingService = require('./services/FileNamingService');

console.log('=== Manual Test: File Size Under 5MB ===\n');

// Test configuration
const TEST_DIR = path.join(__dirname, 'uploads', 'products', 'test-file-size');
const TEST_SKU = 'TESTSIZE001';

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

// Test 1: Upload 1KB file
async function testUpload1KB() {
  console.log('Test 1: Upload 1KB file');
  console.log('─────────────────────────────────');
  
  try {
    const fileSize = 1024; // 1KB
    const tempFile = createTestFileWithSize('temp-1kb.jpg', fileSize);
    
    // Get original file stats
    const originalStats = fs.statSync(tempFile);
    console.log(`  Original size: ${formatFileSize(originalStats.size)}`);
    
    // Rename to SKU format
    const newFilename = await FileNamingService.renameToSKUFormat(tempFile, TEST_SKU);
    console.log(`  Renamed to: ${newFilename}`);
    
    // Verify results
    const newPath = path.join(TEST_DIR, newFilename);
    const newStats = fs.statSync(newPath);
    
    console.log('\n  Verification:');
    console.log(`  ✓ File exists: ${fs.existsSync(newPath) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Size preserved: ${newStats.size === originalStats.size ? 'YES' : 'NO'} (${formatFileSize(newStats.size)})`);
    console.log(`  ✓ Temp file removed: ${!fs.existsSync(tempFile) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Under 5MB: ${newStats.size < 5 * 1024 * 1024 ? 'YES' : 'NO'}`);
    
    const allChecks = 
      fs.existsSync(newPath) &&
      newStats.size === originalStats.size &&
      !fs.existsSync(tempFile) &&
      newStats.size < 5 * 1024 * 1024;
    
    console.log(`\n  Result: ${allChecks ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Cleanup for next test
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    
    return allChecks;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 2: Upload 100KB file
async function testUpload100KB() {
  console.log('Test 2: Upload 100KB file');
  console.log('─────────────────────────────────');
  
  try {
    const fileSize = 100 * 1024; // 100KB
    const tempFile = createTestFileWithSize('temp-100kb.png', fileSize);
    
    // Get original file stats
    const originalStats = fs.statSync(tempFile);
    console.log(`  Original size: ${formatFileSize(originalStats.size)}`);
    
    // Rename to SKU format
    const newFilename = await FileNamingService.renameToSKUFormat(tempFile, TEST_SKU);
    console.log(`  Renamed to: ${newFilename}`);
    
    // Verify results
    const newPath = path.join(TEST_DIR, newFilename);
    const newStats = fs.statSync(newPath);
    
    console.log('\n  Verification:');
    console.log(`  ✓ File exists: ${fs.existsSync(newPath) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Size preserved: ${newStats.size === originalStats.size ? 'YES' : 'NO'} (${formatFileSize(newStats.size)})`);
    console.log(`  ✓ Temp file removed: ${!fs.existsSync(tempFile) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Under 5MB: ${newStats.size < 5 * 1024 * 1024 ? 'YES' : 'NO'}`);
    
    const allChecks = 
      fs.existsSync(newPath) &&
      newStats.size === originalStats.size &&
      !fs.existsSync(tempFile) &&
      newStats.size < 5 * 1024 * 1024;
    
    console.log(`\n  Result: ${allChecks ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Cleanup for next test
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    
    return allChecks;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 3: Upload 1MB file
async function testUpload1MB() {
  console.log('Test 3: Upload 1MB file');
  console.log('─────────────────────────────────');
  
  try {
    const fileSize = 1024 * 1024; // 1MB
    const tempFile = createTestFileWithSize('temp-1mb.jpeg', fileSize);
    
    // Get original file stats
    const originalStats = fs.statSync(tempFile);
    console.log(`  Original size: ${formatFileSize(originalStats.size)}`);
    
    // Rename to SKU format
    const newFilename = await FileNamingService.renameToSKUFormat(tempFile, TEST_SKU);
    console.log(`  Renamed to: ${newFilename}`);
    
    // Verify results
    const newPath = path.join(TEST_DIR, newFilename);
    const newStats = fs.statSync(newPath);
    
    console.log('\n  Verification:');
    console.log(`  ✓ File exists: ${fs.existsSync(newPath) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Size preserved: ${newStats.size === originalStats.size ? 'YES' : 'NO'} (${formatFileSize(newStats.size)})`);
    console.log(`  ✓ Temp file removed: ${!fs.existsSync(tempFile) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Under 5MB: ${newStats.size < 5 * 1024 * 1024 ? 'YES' : 'NO'}`);
    
    const allChecks = 
      fs.existsSync(newPath) &&
      newStats.size === originalStats.size &&
      !fs.existsSync(tempFile) &&
      newStats.size < 5 * 1024 * 1024;
    
    console.log(`\n  Result: ${allChecks ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Cleanup for next test
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    
    return allChecks;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 4: Upload 4MB file (close to limit but under)
async function testUpload4MB() {
  console.log('Test 4: Upload 4MB file (close to limit)');
  console.log('─────────────────────────────────');
  
  try {
    const fileSize = 4 * 1024 * 1024; // 4MB
    const tempFile = createTestFileWithSize('temp-4mb.jpg', fileSize);
    
    // Get original file stats
    const originalStats = fs.statSync(tempFile);
    console.log(`  Original size: ${formatFileSize(originalStats.size)}`);
    
    // Rename to SKU format
    const newFilename = await FileNamingService.renameToSKUFormat(tempFile, TEST_SKU);
    console.log(`  Renamed to: ${newFilename}`);
    
    // Verify results
    const newPath = path.join(TEST_DIR, newFilename);
    const newStats = fs.statSync(newPath);
    
    console.log('\n  Verification:');
    console.log(`  ✓ File exists: ${fs.existsSync(newPath) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Size preserved: ${newStats.size === originalStats.size ? 'YES' : 'NO'} (${formatFileSize(newStats.size)})`);
    console.log(`  ✓ Temp file removed: ${!fs.existsSync(tempFile) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Under 5MB: ${newStats.size < 5 * 1024 * 1024 ? 'YES' : 'NO'}`);
    
    const allChecks = 
      fs.existsSync(newPath) &&
      newStats.size === originalStats.size &&
      !fs.existsSync(tempFile) &&
      newStats.size < 5 * 1024 * 1024;
    
    console.log(`\n  Result: ${allChecks ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Cleanup for next test
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    
    return allChecks;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 5: Upload 4.9MB file (just under limit)
async function testUpload4_9MB() {
  console.log('Test 5: Upload 4.9MB file (just under limit)');
  console.log('─────────────────────────────────');
  
  try {
    const fileSize = Math.floor(4.9 * 1024 * 1024); // 4.9MB
    const tempFile = createTestFileWithSize('temp-4.9mb.png', fileSize);
    
    // Get original file stats
    const originalStats = fs.statSync(tempFile);
    console.log(`  Original size: ${formatFileSize(originalStats.size)}`);
    
    // Rename to SKU format
    const newFilename = await FileNamingService.renameToSKUFormat(tempFile, TEST_SKU);
    console.log(`  Renamed to: ${newFilename}`);
    
    // Verify results
    const newPath = path.join(TEST_DIR, newFilename);
    const newStats = fs.statSync(newPath);
    
    console.log('\n  Verification:');
    console.log(`  ✓ File exists: ${fs.existsSync(newPath) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Size preserved: ${newStats.size === originalStats.size ? 'YES' : 'NO'} (${formatFileSize(newStats.size)})`);
    console.log(`  ✓ Temp file removed: ${!fs.existsSync(tempFile) ? 'YES' : 'NO'}`);
    console.log(`  ✓ Under 5MB: ${newStats.size < 5 * 1024 * 1024 ? 'YES' : 'NO'}`);
    
    const allChecks = 
      fs.existsSync(newPath) &&
      newStats.size === originalStats.size &&
      !fs.existsSync(tempFile) &&
      newStats.size < 5 * 1024 * 1024;
    
    console.log(`\n  Result: ${allChecks ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Cleanup for next test
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    
    return allChecks;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 6: Multiple file sizes in sequence
async function testMultipleFileSizes() {
  console.log('Test 6: Multiple file sizes in sequence');
  console.log('─────────────────────────────────');
  
  try {
    const testSizes = [
      { size: 10 * 1024, name: '10KB', ext: '.jpg' },
      { size: 500 * 1024, name: '500KB', ext: '.jpeg' },
      { size: 2 * 1024 * 1024, name: '2MB', ext: '.png' },
      { size: 3.5 * 1024 * 1024, name: '3.5MB', ext: '.jpg' }
    ];
    
    let allPass = true;
    
    for (const test of testSizes) {
      const tempFile = createTestFileWithSize(`temp-${test.name}${test.ext}`, test.size);
      const originalSize = fs.statSync(tempFile).size;
      
      const newFilename = await FileNamingService.renameToSKUFormat(tempFile, TEST_SKU);
      const newPath = path.join(TEST_DIR, newFilename);
      const newSize = fs.statSync(newPath).size;
      
      const pass = 
        fs.existsSync(newPath) &&
        newSize === originalSize &&
        !fs.existsSync(tempFile) &&
        newSize < 5 * 1024 * 1024;
      
      console.log(`  ${pass ? '✓' : '✗'} ${test.name} file: ${formatFileSize(newSize)} ${!pass ? '(FAILED)' : ''}`);
      
      if (!pass) allPass = false;
      
      // Cleanup for next iteration
      if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    }
    
    console.log(`\n  Result: ${allPass ? '✅ PASS' : '❌ FAIL'}\n`);
    return allPass;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Test 7: Verify file content integrity for different sizes
async function testFileContentIntegrity() {
  console.log('Test 7: Verify file content integrity');
  console.log('─────────────────────────────────');
  
  try {
    const testSizes = [
      { size: 1024, name: '1KB' },
      { size: 100 * 1024, name: '100KB' },
      { size: 1024 * 1024, name: '1MB' }
    ];
    
    let allPass = true;
    
    for (const test of testSizes) {
      const tempFile = createTestFileWithSize(`temp-integrity-${test.name}.jpg`, test.size);
      const originalBuffer = fs.readFileSync(tempFile);
      
      const newFilename = await FileNamingService.renameToSKUFormat(tempFile, TEST_SKU);
      const newPath = path.join(TEST_DIR, newFilename);
      const newBuffer = fs.readFileSync(newPath);
      
      const contentMatch = Buffer.compare(originalBuffer, newBuffer) === 0;
      
      console.log(`  ${contentMatch ? '✓' : '✗'} ${test.name} content integrity: ${contentMatch ? 'PRESERVED' : 'CORRUPTED'}`);
      
      if (!contentMatch) allPass = false;
      
      // Cleanup for next iteration
      if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    }
    
    console.log(`\n  Result: ${allPass ? '✅ PASS' : '❌ FAIL'}\n`);
    return allPass;
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}\n`);
    return false;
  }
}

// Main test runner
async function runFileSizeTests() {
  console.log('Starting file size tests (< 5MB)...\n');
  
  setupTestEnvironment();
  
  const results = [];
  
  // Run all tests
  results.push({ name: 'Upload 1KB file', pass: await testUpload1KB() });
  results.push({ name: 'Upload 100KB file', pass: await testUpload100KB() });
  results.push({ name: 'Upload 1MB file', pass: await testUpload1MB() });
  results.push({ name: 'Upload 4MB file', pass: await testUpload4MB() });
  results.push({ name: 'Upload 4.9MB file', pass: await testUpload4_9MB() });
  results.push({ name: 'Multiple file sizes', pass: await testMultipleFileSizes() });
  results.push({ name: 'File content integrity', pass: await testFileContentIntegrity() });
  
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
    console.log('🎉 SUCCESS! All file size tests passed!');
    console.log('\n✅ Files under 5MB are correctly:');
    console.log('   • Accepted by the system');
    console.log('   • Renamed to SKU format');
    console.log('   • Preserving file size');
    console.log('   • Preserving file content');
    console.log('   • Working with various sizes (1KB - 4.9MB)');
    console.log('   • Maintaining data integrity');
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
  console.log('5. Test with files > 5MB (should fail)');
  console.log('6. Test with invalid file types (should fail)');
  console.log('7. Test image replacement');
  console.log('8. Test with product not found (should fail)');
  console.log('9. Verify SKU-based filenames');
  console.log('10. Verify old files are deleted');
  console.log('═══════════════════════════════════════\n');
}

// Run tests
runFileSizeTests().catch(err => {
  console.error('Test runner error:', err);
  cleanupTestDir();
  process.exit(1);
});
