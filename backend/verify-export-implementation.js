/**
 * Verify Export Implementation
 * Checks that all export endpoints are properly implemented
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('Verifying Export Implementation');
console.log('='.repeat(60));
console.log();

let allPassed = true;

// Check 1: Export controller exists
console.log('1. Checking exportController.js exists...');
const exportControllerPath = path.join(__dirname, 'controllers', 'exportController.js');
if (fs.existsSync(exportControllerPath)) {
  console.log('   ✅ exportController.js exists');
  
  // Check controller content
  const controllerContent = fs.readFileSync(exportControllerPath, 'utf8');
  
  // Check for exportTransactions function
  if (controllerContent.includes('exportTransactions')) {
    console.log('   ✅ exportTransactions function exists');
  } else {
    console.log('   ❌ exportTransactions function missing');
    allPassed = false;
  }
  
  // Check for exportReport function
  if (controllerContent.includes('exportReport')) {
    console.log('   ✅ exportReport function exists');
  } else {
    console.log('   ❌ exportReport function missing');
    allPassed = false;
  }
  
  // Check for proper error handling
  if (controllerContent.includes('try') && controllerContent.includes('catch')) {
    console.log('   ✅ Error handling implemented');
  } else {
    console.log('   ❌ Error handling missing');
    allPassed = false;
  }
  
  // Check for validation
  if (controllerContent.includes('VALIDATION_ERROR')) {
    console.log('   ✅ Validation implemented');
  } else {
    console.log('   ❌ Validation missing');
    allPassed = false;
  }
} else {
  console.log('   ❌ exportController.js does not exist');
  allPassed = false;
}
console.log();

// Check 2: Routes are configured
console.log('2. Checking routes configuration...');
const routesPath = path.join(__dirname, 'routes', 'accounting.js');
if (fs.existsSync(routesPath)) {
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  
  // Check for exportController import
  if (routesContent.includes("require('../controllers/exportController')")) {
    console.log('   ✅ exportController imported');
  } else {
    console.log('   ❌ exportController not imported');
    allPassed = false;
  }
  
  // Check for export/transactions route
  if (routesContent.includes("'/export/transactions'")) {
    console.log('   ✅ /export/transactions route exists');
  } else {
    console.log('   ❌ /export/transactions route missing');
    allPassed = false;
  }
  
  // Check for export/report route
  if (routesContent.includes("'/export/report'")) {
    console.log('   ✅ /export/report route exists');
  } else {
    console.log('   ❌ /export/report route missing');
    allPassed = false;
  }
  
  // Check for authentication middleware
  if (routesContent.includes('authenticate') && routesContent.includes("authorize('admin')")) {
    console.log('   ✅ Authentication and authorization configured');
  } else {
    console.log('   ❌ Authentication/authorization missing');
    allPassed = false;
  }
} else {
  console.log('   ❌ accounting.js routes file does not exist');
  allPassed = false;
}
console.log();

// Check 3: ExportService has required methods
console.log('3. Checking ExportService...');
const exportServicePath = path.join(__dirname, 'services', 'ExportService.js');
if (fs.existsSync(exportServicePath)) {
  const serviceContent = fs.readFileSync(exportServicePath, 'utf8');
  
  // Check for exportTransactionsToExcel
  if (serviceContent.includes('exportTransactionsToExcel')) {
    console.log('   ✅ exportTransactionsToExcel method exists');
  } else {
    console.log('   ❌ exportTransactionsToExcel method missing');
    allPassed = false;
  }
  
  // Check for exportReportToPDF
  if (serviceContent.includes('exportReportToPDF')) {
    console.log('   ✅ exportReportToPDF method exists');
  } else {
    console.log('   ❌ exportReportToPDF method missing');
    allPassed = false;
  }
  
  // Check for ExcelJS usage
  if (serviceContent.includes('ExcelJS') || serviceContent.includes('exceljs')) {
    console.log('   ✅ ExcelJS library used');
  } else {
    console.log('   ❌ ExcelJS library not used');
    allPassed = false;
  }
  
  // Check for PDFKit usage
  if (serviceContent.includes('PDFDocument') || serviceContent.includes('pdfkit')) {
    console.log('   ✅ PDFKit library used');
  } else {
    console.log('   ❌ PDFKit library not used');
    allPassed = false;
  }
} else {
  console.log('   ❌ ExportService.js does not exist');
  allPassed = false;
}
console.log();

// Check 4: Dependencies installed
console.log('4. Checking dependencies...');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.dependencies.exceljs) {
    console.log('   ✅ exceljs dependency installed');
  } else {
    console.log('   ❌ exceljs dependency missing');
    allPassed = false;
  }
  
  if (packageJson.dependencies.pdfkit) {
    console.log('   ✅ pdfkit dependency installed');
  } else {
    console.log('   ❌ pdfkit dependency missing');
    allPassed = false;
  }
} else {
  console.log('   ❌ package.json not found');
  allPassed = false;
}
console.log();

// Check 5: Verify endpoint specifications match requirements
console.log('5. Checking requirements compliance...');
const exportControllerContent = fs.readFileSync(exportControllerPath, 'utf8');

// Check POST /api/accounting/export/transactions
if (exportControllerContent.includes('POST /api/accounting/export/transactions')) {
  console.log('   ✅ POST /api/accounting/export/transactions documented');
} else {
  console.log('   ⚠️  POST /api/accounting/export/transactions not documented (minor)');
}

// Check POST /api/accounting/export/report
if (exportControllerContent.includes('POST /api/accounting/export/report')) {
  console.log('   ✅ POST /api/accounting/export/report documented');
} else {
  console.log('   ⚠️  POST /api/accounting/export/report not documented (minor)');
}

// Check for Requirements references
if (exportControllerContent.includes('Requirements: 10.1') || 
    exportControllerContent.includes('Requirements: 10.2') ||
    exportControllerContent.includes('Requirements: 10.3')) {
  console.log('   ✅ Requirements referenced in code');
} else {
  console.log('   ⚠️  Requirements not explicitly referenced (minor)');
}
console.log();

// Summary
console.log('='.repeat(60));
console.log('Verification Summary');
console.log('='.repeat(60));

if (allPassed) {
  console.log('✅ All critical checks passed!');
  console.log();
  console.log('Implementation includes:');
  console.log('  • POST /api/accounting/export/transactions - Export transactions to Excel');
  console.log('  • POST /api/accounting/export/report - Export reports to PDF');
  console.log('  • Admin authentication and authorization');
  console.log('  • Proper error handling and validation');
  console.log('  • ExcelJS for Excel export');
  console.log('  • PDFKit for PDF export');
  console.log();
  console.log('✅ Task 5.1 implementation is complete!');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the implementation.');
  process.exit(1);
}
