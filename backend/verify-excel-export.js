/**
 * Verify Excel Export Structure
 * Validates that the generated Excel file has the correct structure
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function verifyExcelStructure() {
  console.log('='.repeat(60));
  console.log('Verifying Excel Export Structure');
  console.log('='.repeat(60));
  console.log();

  // Find the most recent Excel file
  const exportDir = path.join(__dirname, 'exports');
  const files = fs.readdirSync(exportDir)
    .filter(f => f.endsWith('.xlsx'))
    .map(f => ({
      name: f,
      path: path.join(exportDir, f),
      time: fs.statSync(path.join(exportDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    console.error('❌ No Excel files found in exports directory');
    process.exit(1);
  }

  const latestFile = files[0];
  console.log(`📄 Checking file: ${latestFile.name}`);
  console.log();

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(latestFile.path);

    // Check worksheet
    const worksheet = workbook.getWorksheet('Transactions');
    if (!worksheet) {
      console.error('❌ Worksheet "Transactions" not found');
      process.exit(1);
    }
    console.log('✅ Worksheet "Transactions" exists');

    // Check columns
    const expectedColumns = [
      'วันที่',
      'ประเภท',
      'หมวดหมู่',
      'รายละเอียด',
      'จำนวนเงิน',
      'อ้างอิง',
      'สร้างโดย',
      'สร้างเมื่อ'
    ];

    const headerRow = worksheet.getRow(1);
    const actualColumns = [];
    
    headerRow.eachCell((cell, colNumber) => {
      actualColumns.push(cell.value);
    });

    console.log('✅ Column headers:');
    actualColumns.forEach((col, idx) => {
      const expected = expectedColumns[idx];
      const match = col === expected ? '✅' : '❌';
      console.log(`   ${match} Column ${idx + 1}: "${col}" ${col === expected ? '' : `(expected: "${expected}")`}`);
    });
    console.log();

    // Check header styling
    const headerCell = headerRow.getCell(1);
    const hasBold = headerCell.font?.bold;
    const hasFill = headerCell.fill?.type === 'pattern';
    
    console.log('✅ Header styling:');
    console.log(`   ${hasBold ? '✅' : '❌'} Bold font`);
    console.log(`   ${hasFill ? '✅' : '❌'} Background fill`);
    console.log();

    // Check data rows
    const rowCount = worksheet.rowCount;
    console.log(`✅ Total rows: ${rowCount} (including header and totals)`);
    
    if (rowCount > 2) {
      console.log(`✅ Data rows: ${rowCount - 2}`);
      
      // Check a sample data row
      const dataRow = worksheet.getRow(2);
      const amountCell = dataRow.getCell(5);
      const hasNumberFormat = amountCell.numFmt && amountCell.numFmt.includes('#,##0.00');
      
      console.log('✅ Amount formatting:');
      console.log(`   ${hasNumberFormat ? '✅' : '❌'} Currency format applied`);
      console.log(`   Format: ${amountCell.numFmt || 'none'}`);
    }
    console.log();

    // Check totals row
    const totalsRow = worksheet.getRow(rowCount);
    const totalsCell = totalsRow.getCell(5);
    const hasFormula = totalsCell.formula !== undefined;
    const isBold = totalsRow.font?.bold;
    
    console.log('✅ Totals row:');
    console.log(`   ${hasFormula ? '✅' : '❌'} SUM formula`);
    console.log(`   ${isBold ? '✅' : '❌'} Bold font`);
    if (hasFormula) {
      console.log(`   Formula: ${totalsCell.formula}`);
    }
    console.log();

    // Check auto-filter
    const hasAutoFilter = worksheet.autoFilter !== undefined;
    console.log(`${hasAutoFilter ? '✅' : '❌'} Auto-filter enabled`);
    if (hasAutoFilter) {
      console.log(`   Range: ${worksheet.autoFilter.from} to ${worksheet.autoFilter.to}`);
    }
    console.log();

    // File size
    const stats = fs.statSync(latestFile.path);
    console.log(`✅ File size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log();

    console.log('='.repeat(60));
    console.log('✅ Excel Export Structure Verification Complete');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error reading Excel file:', error.message);
    process.exit(1);
  }
}

verifyExcelStructure();
