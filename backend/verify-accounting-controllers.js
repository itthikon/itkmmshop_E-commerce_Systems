/**
 * Verification script for accounting controllers
 * Checks if all controllers and routes are properly structured
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('  Accounting Controllers Verification');
console.log('========================================\n');

let allPassed = true;

/**
 * Check if file exists
 */
function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    console.log(`✓ ${description}`);
    return true;
  } else {
    console.log(`✗ ${description} - File not found: ${filePath}`);
    allPassed = false;
    return false;
  }
}

/**
 * Check if file contains required exports
 */
function checkExports(filePath, requiredExports, description) {
  try {
    const module = require(filePath);
    const missingExports = [];
    
    requiredExports.forEach(exportName => {
      if (typeof module[exportName] !== 'function') {
        missingExports.push(exportName);
      }
    });
    
    if (missingExports.length === 0) {
      console.log(`✓ ${description} - All exports present`);
      return true;
    } else {
      console.log(`✗ ${description} - Missing exports: ${missingExports.join(', ')}`);
      allPassed = false;
      return false;
    }
  } catch (error) {
    console.log(`✗ ${description} - Error loading module: ${error.message}`);
    allPassed = false;
    return false;
  }
}

console.log('=== Checking Controller Files ===\n');

// Check accountingController
checkFile('controllers/accountingController.js', 'accountingController.js exists');
checkExports('./controllers/accountingController', [
  'createTransaction',
  'getTransactions',
  'getTransactionById',
  'updateTransaction',
  'deleteTransaction',
  'uploadTransactionAttachment'
], 'accountingController exports');

console.log('');

// Check categoryController
checkFile('controllers/categoryController.js', 'categoryController.js exists');
checkExports('./controllers/categoryController', [
  'createCategory',
  'getCategories',
  'getCategoryById',
  'updateCategory',
  'deleteCategory'
], 'categoryController exports');

console.log('');

// Check reportController
checkFile('controllers/reportController.js', 'reportController.js exists');
checkExports('./controllers/reportController', [
  'getDashboard',
  'getProfitLoss',
  'getCashFlow',
  'getIncomeBreakdown',
  'getExpenseBreakdown'
], 'reportController exports');

console.log('');

// Check settingsController
checkFile('controllers/settingsController.js', 'settingsController.js exists');
checkExports('./controllers/settingsController', [
  'getSettings',
  'getSetting',
  'updateSetting',
  'initializeSettings'
], 'settingsController exports');

console.log('\n=== Checking Routes File ===\n');

// Check routes file
checkFile('routes/accounting.js', 'accounting.js routes file exists');

console.log('\n=== Checking Server Integration ===\n');

// Check if server.js includes accounting routes
try {
  const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  
  if (serverContent.includes("require('./routes/accounting')")) {
    console.log('✓ Server imports accounting routes');
  } else {
    console.log('✗ Server does not import accounting routes');
    allPassed = false;
  }
  
  if (serverContent.includes("app.use('/api/accounting', accountingRoutes)")) {
    console.log('✓ Server registers accounting routes');
  } else {
    console.log('✗ Server does not register accounting routes');
    allPassed = false;
  }
} catch (error) {
  console.log('✗ Error checking server.js:', error.message);
  allPassed = false;
}

console.log('\n=== Checking Dependencies ===\n');

// Check if required services exist
checkFile('services/TransactionService.js', 'TransactionService exists');
checkFile('services/ReportService.js', 'ReportService exists');
checkFile('models/Transaction.js', 'Transaction model exists');
checkFile('models/TransactionCategory.js', 'TransactionCategory model exists');
checkFile('models/AccountingSettings.js', 'AccountingSettings model exists');

console.log('\n========================================');
console.log('  Verification Summary');
console.log('========================================');

if (allPassed) {
  console.log('✓ All checks passed!');
  console.log('\nThe accounting controllers are properly implemented.');
  console.log('You can now start the server and test the endpoints.');
  process.exit(0);
} else {
  console.log('✗ Some checks failed!');
  console.log('\nPlease review the errors above.');
  process.exit(1);
}
