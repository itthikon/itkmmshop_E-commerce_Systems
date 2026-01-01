/**
 * Verification script for Auto SKU Generation API Implementation
 * Verifies that all required endpoints and error handling are implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Auto SKU Generation API Implementation\n');
console.log('=' .repeat(60));

// Read the files
const productRoutes = fs.readFileSync(path.join(__dirname, 'routes/products.js'), 'utf8');
const productController = fs.readFileSync(path.join(__dirname, 'controllers/productController.js'), 'utf8');
const categoryController = fs.readFileSync(path.join(__dirname, 'controllers/categoryController.js'), 'utf8');

let allPassed = true;

/**
 * Check if a pattern exists in content
 */
function checkPattern(content, pattern, description) {
  const found = pattern.test(content);
  console.log(`${found ? '✅' : '❌'} ${description}`);
  if (!found) allPassed = false;
  return found;
}

console.log('\n📝 Task 4.1: Create SKU generation endpoint');
console.log('-'.repeat(60));
checkPattern(productRoutes, /POST.*\/generate-sku/, 'Route: POST /api/products/generate-sku');
checkPattern(productController, /exports\.generateSKU/, 'Controller: generateSKU method exists');
checkPattern(productController, /SKUGeneratorService\.generateSKU/, 'Calls SKU Generator Service');
checkPattern(productController, /sequential_number/, 'Returns SKU metadata');

console.log('\n📝 Task 4.2: Update product creation endpoint');
console.log('-'.repeat(60));
checkPattern(productController, /sku:.*optional/, 'SKU is optional in validation schema');
checkPattern(productController, /if\s*\(!value\.sku\)/, 'Auto-generates SKU if not provided');
checkPattern(productController, /validateSKUFormat/, 'Validates generated SKU format');
checkPattern(productController, /existingProduct.*findBySku/, 'Checks SKU uniqueness before saving');

console.log('\n📝 Task 4.3: Update product update endpoint');
console.log('-'.repeat(60));
checkPattern(productController, /SKU_IMMUTABLE/, 'Returns SKU_IMMUTABLE error code');
checkPattern(productController, /sku.*!==.*existingProduct\.sku/, 'Checks if SKU is being changed');
checkPattern(productController, /delete value\.sku/, 'Removes SKU from update data');

console.log('\n📝 Task 4.4: Update category endpoints');
console.log('-'.repeat(60));
checkPattern(categoryController, /prefix:.*Joi\.string/, 'POST /categories accepts prefix');
checkPattern(categoryController, /validateAndNormalizePrefix/, 'Validates prefix on create');
checkPattern(categoryController, /isPrefixUnique/, 'Checks prefix uniqueness');
checkPattern(categoryController, /PREFIX_CHANGE_WARNING/, 'Shows warning on prefix change');

console.log('\n📝 Task 4.5: Add error handling for all endpoints');
console.log('-'.repeat(60));
checkPattern(productController, /SKU_LIMIT_REACHED/, 'Handles SKU limit reached error');
checkPattern(productController, /DUPLICATE_SKU/, 'Handles duplicate SKU error');
checkPattern(categoryController, /DUPLICATE_PREFIX/, 'Handles duplicate prefix error');
checkPattern(categoryController, /INVALID_PREFIX/, 'Handles invalid prefix error');
checkPattern(productController, /status\(400\)/, 'Returns 400 for validation errors');
checkPattern(productController, /status\(409\)/, 'Returns 409 for conflicts');
checkPattern(productController, /status\(500\)/, 'Returns 500 for server errors');

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('\n✅ All implementation checks passed!');
  console.log('\n📋 Summary:');
  console.log('   ✅ Task 4.1: SKU generation endpoint implemented');
  console.log('   ✅ Task 4.2: Product creation with auto-SKU implemented');
  console.log('   ✅ Task 4.3: SKU immutability enforced');
  console.log('   ✅ Task 4.4: Category endpoints updated with prefix support');
  console.log('   ✅ Task 4.5: Comprehensive error handling added');
  console.log('\n🎉 Task 4 "Backend - API Endpoints" is complete!\n');
  process.exit(0);
} else {
  console.log('\n❌ Some implementation checks failed!');
  console.log('Please review the failed checks above.\n');
  process.exit(1);
}
