/**
 * Manual Test Script: File Validation
 * 
 * This script tests file validation for:
 * 1. Invalid file types (non-image files)
 * 2. Files that are too large (> 5MB)
 * 
 * Run this test in a browser console or Node.js environment
 */

// Import validation function (for browser testing, this would be available globally)
// For Node.js testing, we'll simulate the validation logic

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Simulated File object for testing
 */
class MockFile {
  constructor(name, size, type) {
    this.name = name;
    this.size = size;
    this.type = type;
  }
}

/**
 * Validates an image file for payment slip upload
 */
const validateImageFile = (file) => {
  if (!file) {
    return {
      valid: false,
      error: 'กรุณาเลือกไฟล์สลิปการโอนเงิน'
    };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'กรุณาเลือกไฟล์รูปภาพ (.jpg, .jpeg, .png) เท่านั้น'
    };
  }

  const fileName = file.name.toLowerCase();
  const hasValidExtension = ['.jpg', '.jpeg', '.png'].some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'กรุณาเลือกไฟล์รูปภาพ (.jpg, .jpeg, .png) เท่านั้น'
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `ขนาดไฟล์ต้องไม่เกิน 5MB`
    };
  }

  return {
    valid: true,
    error: null
  };
};

/**
 * Test Suite: File Validation
 */
console.log('='.repeat(60));
console.log('FILE VALIDATION TEST SUITE');
console.log('='.repeat(60));
console.log();

let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`✓ PASS: ${testName}`);
    passedTests++;
  } catch (error) {
    console.log(`✗ FAIL: ${testName}`);
    console.log(`  Error: ${error.message}`);
    failedTests++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Test 1: Invalid file type - PDF
console.log('Test 1: Invalid file type - PDF');
runTest('Should reject PDF files', () => {
  const pdfFile = new MockFile('document.pdf', 1024 * 1024, 'application/pdf');
  const result = validateImageFile(pdfFile);
  assert(!result.valid, 'PDF file should be invalid');
  assert(result.error.includes('รูปภาพ'), 'Error message should mention image files');
  console.log(`  File: ${pdfFile.name} (${pdfFile.type})`);
  console.log(`  Result: ${result.error}`);
});
console.log();

// Test 2: Invalid file type - Word document
console.log('Test 2: Invalid file type - Word document');
runTest('Should reject Word documents', () => {
  const docFile = new MockFile('document.docx', 1024 * 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const result = validateImageFile(docFile);
  assert(!result.valid, 'Word document should be invalid');
  assert(result.error.includes('รูปภาพ'), 'Error message should mention image files');
  console.log(`  File: ${docFile.name} (${docFile.type})`);
  console.log(`  Result: ${result.error}`);
});
console.log();

// Test 3: Invalid file type - Text file
console.log('Test 3: Invalid file type - Text file');
runTest('Should reject text files', () => {
  const txtFile = new MockFile('notes.txt', 1024, 'text/plain');
  const result = validateImageFile(txtFile);
  assert(!result.valid, 'Text file should be invalid');
  assert(result.error.includes('รูปภาพ'), 'Error message should mention image files');
  console.log(`  File: ${txtFile.name} (${txtFile.type})`);
  console.log(`  Result: ${result.error}`);
});
console.log();

// Test 4: Invalid file type - GIF (not in allowed list)
console.log('Test 4: Invalid file type - GIF');
runTest('Should reject GIF files', () => {
  const gifFile = new MockFile('animation.gif', 1024 * 1024, 'image/gif');
  const result = validateImageFile(gifFile);
  assert(!result.valid, 'GIF file should be invalid');
  assert(result.error.includes('รูปภาพ'), 'Error message should mention image files');
  console.log(`  File: ${gifFile.name} (${gifFile.type})`);
  console.log(`  Result: ${result.error}`);
});
console.log();

// Test 5: Invalid file type - SVG
console.log('Test 5: Invalid file type - SVG');
runTest('Should reject SVG files', () => {
  const svgFile = new MockFile('icon.svg', 1024 * 100, 'image/svg+xml');
  const result = validateImageFile(svgFile);
  assert(!result.valid, 'SVG file should be invalid');
  assert(result.error.includes('รูปภาพ'), 'Error message should mention image files');
  console.log(`  File: ${svgFile.name} (${svgFile.type})`);
  console.log(`  Result: ${result.error}`);
});
console.log();

// Test 6: File too large - 6MB
console.log('Test 6: File too large - 6MB');
runTest('Should reject files larger than 5MB', () => {
  const largeFile = new MockFile('large-image.jpg', 6 * 1024 * 1024, 'image/jpeg');
  const result = validateImageFile(largeFile);
  assert(!result.valid, 'File larger than 5MB should be invalid');
  assert(result.error.includes('5MB'), 'Error message should mention 5MB limit');
  console.log(`  File: ${largeFile.name} (${largeFile.type})`);
  console.log(`  Size: ${(largeFile.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  Result: ${result.error}`);
});
console.log();

// Test 7: File too large - 10MB
console.log('Test 7: File too large - 10MB');
runTest('Should reject files much larger than 5MB', () => {
  const veryLargeFile = new MockFile('very-large-image.png', 10 * 1024 * 1024, 'image/png');
  const result = validateImageFile(veryLargeFile);
  assert(!result.valid, 'File larger than 5MB should be invalid');
  assert(result.error.includes('5MB'), 'Error message should mention 5MB limit');
  console.log(`  File: ${veryLargeFile.name} (${veryLargeFile.type})`);
  console.log(`  Size: ${(veryLargeFile.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  Result: ${result.error}`);
});
console.log();

// Test 8: File exactly at limit - 5MB
console.log('Test 8: File exactly at limit - 5MB');
runTest('Should accept files exactly at 5MB limit', () => {
  const exactFile = new MockFile('exact-limit.jpg', 5 * 1024 * 1024, 'image/jpeg');
  const result = validateImageFile(exactFile);
  assert(result.valid, 'File exactly at 5MB should be valid');
  assert(result.error === null, 'Should have no error');
  console.log(`  File: ${exactFile.name} (${exactFile.type})`);
  console.log(`  Size: ${(exactFile.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  Result: Valid ✓`);
});
console.log();

// Test 9: File just over limit - 5MB + 1 byte
console.log('Test 9: File just over limit - 5MB + 1 byte');
runTest('Should reject files just over 5MB limit', () => {
  const justOverFile = new MockFile('just-over.jpg', (5 * 1024 * 1024) + 1, 'image/jpeg');
  const result = validateImageFile(justOverFile);
  assert(!result.valid, 'File over 5MB should be invalid');
  assert(result.error.includes('5MB'), 'Error message should mention 5MB limit');
  console.log(`  File: ${justOverFile.name} (${justOverFile.type})`);
  console.log(`  Size: ${(justOverFile.size / (1024 * 1024)).toFixed(6)} MB`);
  console.log(`  Result: ${result.error}`);
});
console.log();

// Test 10: Valid file types should pass (for comparison)
console.log('Test 10: Valid JPEG file');
runTest('Should accept valid JPEG files', () => {
  const jpegFile = new MockFile('payment-slip.jpg', 2 * 1024 * 1024, 'image/jpeg');
  const result = validateImageFile(jpegFile);
  assert(result.valid, 'Valid JPEG file should be accepted');
  assert(result.error === null, 'Should have no error');
  console.log(`  File: ${jpegFile.name} (${jpegFile.type})`);
  console.log(`  Size: ${(jpegFile.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  Result: Valid ✓`);
});
console.log();

console.log('Test 11: Valid PNG file');
runTest('Should accept valid PNG files', () => {
  const pngFile = new MockFile('payment-slip.png', 3 * 1024 * 1024, 'image/png');
  const result = validateImageFile(pngFile);
  assert(result.valid, 'Valid PNG file should be accepted');
  assert(result.error === null, 'Should have no error');
  console.log(`  File: ${pngFile.name} (${pngFile.type})`);
  console.log(`  Size: ${(pngFile.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  Result: Valid ✓`);
});
console.log();

// Test 12: Wrong extension with correct MIME type
console.log('Test 12: Wrong extension with correct MIME type');
runTest('Should reject files with wrong extension even if MIME type is correct', () => {
  const wrongExtFile = new MockFile('image.gif', 1 * 1024 * 1024, 'image/jpeg');
  const result = validateImageFile(wrongExtFile);
  assert(!result.valid, 'File with wrong extension should be invalid');
  console.log(`  File: ${wrongExtFile.name} (${wrongExtFile.type})`);
  console.log(`  Result: ${result.error}`);
});
console.log();

// Summary
console.log('='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests} ✓`);
console.log(`Failed: ${failedTests} ✗`);
console.log();

if (failedTests === 0) {
  console.log('🎉 All tests passed!');
  console.log();
  console.log('File validation is working correctly:');
  console.log('  ✓ Invalid file types are rejected (PDF, DOC, TXT, GIF, SVG)');
  console.log('  ✓ Files larger than 5MB are rejected');
  console.log('  ✓ Files at exactly 5MB are accepted');
  console.log('  ✓ Files just over 5MB are rejected');
  console.log('  ✓ Valid image files (JPG, PNG) are accepted');
  console.log('  ✓ Extension validation works correctly');
} else {
  console.log('❌ Some tests failed. Please review the errors above.');
}

console.log('='.repeat(60));
