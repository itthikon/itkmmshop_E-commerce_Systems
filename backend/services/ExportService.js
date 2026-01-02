const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * ExportService
 * Handles exporting financial data to Excel and PDF formats
 */
class ExportService {
  /**
   * Export transactions to Excel
   * @param {Array} transactions - Array of transaction objects
   * @param {string} filename - Output filename (without extension)
   * @returns {Promise<string>} Path to generated Excel file
   */
  static async exportTransactionsToExcel(transactions, filename = 'transactions') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    // Set up columns
    worksheet.columns = [
      { header: 'วันที่', key: 'transaction_date', width: 12 },
      { header: 'ประเภท', key: 'transaction_type', width: 10 },
      { header: 'หมวดหมู่', key: 'category_name', width: 20 },
      { header: 'รายละเอียด', key: 'description', width: 40 },
      { header: 'จำนวนเงิน', key: 'amount', width: 15 },
      { header: 'อ้างอิง', key: 'reference_type', width: 12 },
      { header: 'สร้างโดย', key: 'created_by_email', width: 25 },
      { header: 'สร้างเมื่อ', key: 'created_at', width: 18 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    transactions.forEach(transaction => {
      const row = worksheet.addRow({
        transaction_date: transaction.transaction_date,
        transaction_type: transaction.transaction_type === 'income' ? 'รายรับ' : 'รายจ่าย',
        category_name: transaction.category_name || '-',
        description: transaction.description || '-',
        amount: parseFloat(transaction.amount),
        reference_type: this._formatReferenceType(transaction.reference_type),
        created_by_email: transaction.created_by_email || '-',
        created_at: this._formatDateTime(transaction.created_at)
      });

      // Format amount column
      row.getCell('amount').numFmt = '#,##0.00';
      
      // Color code by transaction type
      if (transaction.transaction_type === 'income') {
        row.getCell('amount').font = { color: { argb: 'FF008000' } }; // Green
      } else {
        row.getCell('amount').font = { color: { argb: 'FFFF0000' } }; // Red
      }
    });

    // Add totals row
    const totalRow = worksheet.addRow({
      transaction_date: '',
      transaction_type: '',
      category_name: '',
      description: 'รวม',
      amount: { formula: `SUM(E2:E${worksheet.rowCount})` },
      reference_type: '',
      created_by_email: '',
      created_at: ''
    });

    totalRow.font = { bold: true };
    totalRow.getCell('amount').numFmt = '#,##0.00';
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF0CC' }
    };

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: `H${worksheet.rowCount - 1}`
    };

    // Save file
    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filepath = path.join(exportDir, `${filename}.xlsx`);
    await workbook.xlsx.writeFile(filepath);

    return filepath;
  }

  /**
   * Export report to PDF
   * @param {Object} reportData - Report data object
   * @param {string} reportType - Type of report ('profit-loss' or 'cash-flow')
   * @param {string} filename - Output filename (without extension)
   * @returns {Promise<string>} Path to generated PDF file
   */
  static async exportReportToPDF(reportData, reportType, filename = 'report') {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch company branding from settings (if available)
        const AccountingSettings = require('../models/AccountingSettings');
        let companyName = 'ITKMMSHOP';
        
        try {
          const companyNameSetting = await AccountingSettings.get('company_name');
          if (companyNameSetting) {
            companyName = companyNameSetting;
          }
        } catch (err) {
          // Use default if settings not available
          console.log('Using default company name');
        }

        const exportDir = path.join(__dirname, '../exports');
        if (!fs.existsSync(exportDir)) {
          fs.mkdirSync(exportDir, { recursive: true });
        }

        const filepath = path.join(exportDir, `${filename}.pdf`);
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Store company name for use in PDF generation
        reportData._companyName = companyName;

        // Register Thai font if available (fallback to default)
        // Note: For production, you should add a Thai font file
        // doc.registerFont('THSarabunNew', 'path/to/THSarabunNew.ttf');
        // doc.font('THSarabunNew');

        if (reportType === 'profit-loss') {
          this._generateProfitLossPDF(doc, reportData);
        } else if (reportType === 'cash-flow') {
          this._generateCashFlowPDF(doc, reportData);
        } else {
          throw new Error('Invalid report type');
        }

        doc.end();

        stream.on('finish', () => {
          resolve(filepath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Profit & Loss PDF
   * @private
   */
  static _generateProfitLossPDF(doc, reportData) {
    const { period, income, expenses, net_profit, comparison, _companyName } = reportData;

    // Header with company branding
    this._addPDFHeader(doc, 'Profit & Loss Report', 'รายงานกำไร-ขาดทุน', _companyName);
    
    // Period information
    doc.fontSize(11)
       .fillColor('#666666')
       .text(`Period: ${this._formatDateThai(period.start_date)} to ${this._formatDateThai(period.end_date)}`, { align: 'center' });
    doc.moveDown(1.5);

    // Income Section
    this._addSectionHeader(doc, 'INCOME', 'รายรับ');
    doc.moveDown(0.5);

    let yPosition = doc.y;
    
    if (income.by_category && income.by_category.length > 0) {
      income.by_category.forEach(category => {
        doc.fontSize(11)
           .fillColor('#333333')
           .text(`${category.category_name}`, 80, yPosition);
        doc.fontSize(11)
           .fillColor('#2E7D32')
           .text(`${this._formatCurrency(category.total)}`, 450, yPosition, { width: 100, align: 'right' });
        yPosition += 20;
        doc.y = yPosition;
      });
    } else {
      doc.fontSize(10).fillColor('#999999').text('No income transactions', 80, yPosition);
      yPosition += 20;
      doc.y = yPosition;
    }

    // Total Income
    doc.moveDown(0.3);
    doc.moveTo(80, doc.y).lineTo(550, doc.y).strokeColor('#CCCCCC').stroke();
    doc.moveDown(0.3);
    
    doc.fontSize(12)
       .fillColor('#000000')
       .text('Total Income', 80, doc.y, { continued: false });
    doc.fontSize(12)
       .fillColor('#2E7D32')
       .text(`${this._formatCurrency(income.total)}`, 450, doc.y - 12, { width: 100, align: 'right' });
    doc.moveDown(2);

    // Expenses Section
    this._addSectionHeader(doc, 'EXPENSES', 'รายจ่าย');
    doc.moveDown(0.5);

    yPosition = doc.y;
    
    if (expenses.by_category && expenses.by_category.length > 0) {
      expenses.by_category.forEach(category => {
        doc.fontSize(11)
           .fillColor('#333333')
           .text(`${category.category_name}`, 80, yPosition);
        doc.fontSize(11)
           .fillColor('#C62828')
           .text(`${this._formatCurrency(category.total)}`, 450, yPosition, { width: 100, align: 'right' });
        yPosition += 20;
        doc.y = yPosition;
      });
    } else {
      doc.fontSize(10).fillColor('#999999').text('No expense transactions', 80, yPosition);
      yPosition += 20;
      doc.y = yPosition;
    }

    // Total Expenses
    doc.moveDown(0.3);
    doc.moveTo(80, doc.y).lineTo(550, doc.y).strokeColor('#CCCCCC').stroke();
    doc.moveDown(0.3);
    
    doc.fontSize(12)
       .fillColor('#000000')
       .text('Total Expenses', 80, doc.y);
    doc.fontSize(12)
       .fillColor('#C62828')
       .text(`${this._formatCurrency(expenses.total)}`, 450, doc.y - 12, { width: 100, align: 'right' });
    doc.moveDown(2);

    // Net Profit/Loss
    doc.moveTo(80, doc.y).lineTo(550, doc.y).strokeColor('#000000').lineWidth(2).stroke();
    doc.moveDown(0.5);
    
    const profitColor = net_profit >= 0 ? '#2E7D32' : '#C62828';
    const profitLabel = net_profit >= 0 ? 'Net Profit' : 'Net Loss';
    const profitLabelThai = net_profit >= 0 ? 'กำไรสุทธิ' : 'ขาดทุนสุทธิ';
    
    doc.fontSize(14)
       .fillColor('#000000')
       .text(`${profitLabel} (${profitLabelThai})`, 80, doc.y);
    doc.fontSize(14)
       .fillColor(profitColor)
       .text(`${this._formatCurrency(Math.abs(net_profit))}`, 450, doc.y - 14, { width: 100, align: 'right' });
    doc.moveDown(2);

    // Period Comparison (if available)
    if (comparison && comparison.previous_period) {
      doc.moveDown(1);
      this._addSectionHeader(doc, 'PERIOD COMPARISON', 'เปรียบเทียบงวด');
      doc.moveDown(0.5);

      const changePercent = comparison.change_percent || 0;
      const changeColor = changePercent >= 0 ? '#2E7D32' : '#C62828';
      const changeSymbol = changePercent >= 0 ? '▲' : '▼';

      doc.fontSize(10)
         .fillColor('#666666')
         .text(`Previous Period: ${this._formatCurrency(comparison.previous_period.net_profit)}`, 80, doc.y);
      doc.moveDown(0.3);
      
      doc.fontSize(10)
         .fillColor('#666666')
         .text(`Current Period: ${this._formatCurrency(net_profit)}`, 80, doc.y);
      doc.moveDown(0.3);
      
      doc.fontSize(10)
         .fillColor(changeColor)
         .text(`Change: ${changeSymbol} ${Math.abs(changePercent).toFixed(2)}%`, 80, doc.y);
    }

    // Footer
    this._addPDFFooter(doc);
  }

  /**
   * Generate Cash Flow PDF
   * @private
   */
  static _generateCashFlowPDF(doc, reportData) {
    const { period, opening_balance, total_inflows, total_outflows, closing_balance, cash_flow_by_period, _companyName } = reportData;

    // Header with company branding
    this._addPDFHeader(doc, 'Cash Flow Report', 'รายงานกระแสเงินสด', _companyName);
    
    // Period information
    doc.fontSize(11)
       .fillColor('#666666')
       .text(`Period: ${this._formatDateThai(period.start_date)} to ${this._formatDateThai(period.end_date)}`, { align: 'center' });
    doc.fontSize(10)
       .fillColor('#666666')
       .text(`Grouped by: ${period.group_by}`, { align: 'center' });
    doc.moveDown(1.5);

    // Summary Section
    this._addSectionHeader(doc, 'SUMMARY', 'สรุป');
    doc.moveDown(0.5);

    // Summary box with background
    const summaryTop = doc.y;
    doc.rect(70, summaryTop, 480, 120)
       .fillAndStroke('#F5F5F5', '#CCCCCC');
    
    doc.fillColor('#333333');
    
    let yPos = summaryTop + 15;
    
    doc.fontSize(11).text('Opening Balance', 90, yPos);
    doc.fontSize(11).fillColor('#1976D2').text(`${this._formatCurrency(opening_balance)}`, 450, yPos, { width: 90, align: 'right' });
    yPos += 25;

    doc.fillColor('#333333').text('Total Inflows (+)', 90, yPos);
    doc.fillColor('#2E7D32').text(`${this._formatCurrency(total_inflows)}`, 450, yPos, { width: 90, align: 'right' });
    yPos += 25;

    doc.fillColor('#333333').text('Total Outflows (-)', 90, yPos);
    doc.fillColor('#C62828').text(`${this._formatCurrency(total_outflows)}`, 450, yPos, { width: 90, align: 'right' });
    yPos += 25;

    // Divider line
    doc.moveTo(90, yPos).lineTo(540, yPos).strokeColor('#000000').lineWidth(1.5).stroke();
    yPos += 10;

    doc.fontSize(12).fillColor('#000000').text('Closing Balance', 90, yPos);
    const closingColor = closing_balance >= 0 ? '#2E7D32' : '#C62828';
    doc.fontSize(12).fillColor(closingColor).text(`${this._formatCurrency(closing_balance)}`, 450, yPos, { width: 90, align: 'right' });

    doc.y = summaryTop + 130;
    doc.moveDown(2);

    // Period Details
    if (cash_flow_by_period && cash_flow_by_period.length > 0) {
      this._addSectionHeader(doc, 'PERIOD DETAILS', 'รายละเอียดแต่ละงวด');
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      doc.rect(70, tableTop, 480, 25)
         .fillAndStroke('#E0E0E0', '#CCCCCC');
      
      doc.fontSize(10)
         .fillColor('#000000')
         .text('Period', 80, tableTop + 8, { width: 120 })
         .text('Inflows', 220, tableTop + 8, { width: 90, align: 'right' })
         .text('Outflows', 330, tableTop + 8, { width: 90, align: 'right' })
         .text('Net Change', 440, tableTop + 8, { width: 100, align: 'right' });
      
      doc.y = tableTop + 25;
      doc.moveDown(0.3);

      // Table rows
      cash_flow_by_period.forEach((periodData, index) => {
        const rowY = doc.y;
        
        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(70, rowY, 480, 20).fillAndStroke('#FAFAFA', '#EEEEEE');
        }

        const netChangeColor = periodData.net_change >= 0 ? '#2E7D32' : '#C62828';
        
        doc.fontSize(9)
           .fillColor('#333333')
           .text(periodData.period, 80, rowY + 5, { width: 120 });
        
        doc.fillColor('#2E7D32')
           .text(this._formatCurrency(periodData.inflows), 220, rowY + 5, { width: 90, align: 'right' });
        
        doc.fillColor('#C62828')
           .text(this._formatCurrency(periodData.outflows), 330, rowY + 5, { width: 90, align: 'right' });
        
        doc.fillColor(netChangeColor)
           .text(this._formatCurrency(periodData.net_change), 440, rowY + 5, { width: 100, align: 'right' });
        
        doc.y = rowY + 20;
        doc.moveDown(0.1);

        // Add page break if needed
        if (doc.y > doc.page.height - 120) {
          doc.addPage();
          this._addPDFHeader(doc, 'Cash Flow Report (Continued)', 'รายงานกระแสเงินสด (ต่อ)', _companyName);
          doc.moveDown(1);
        }
      });
    }

    // Footer
    this._addPDFFooter(doc);
  }

  /**
   * Helper: Format currency
   * @private
   */
  static _formatCurrency(amount) {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  }

  /**
   * Helper: Format date in Thai format
   * @private
   */
  static _formatDateThai(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Helper: Add PDF header with company branding
   * @private
   */
  static _addPDFHeader(doc, titleEn, titleTh, companyName = 'ITKMMSHOP') {
    // Company name (can be configured via settings)
    doc.fontSize(10)
       .fillColor('#666666')
       .text(companyName, 50, 40, { align: 'center' });
    
    // Title
    doc.fontSize(18)
       .fillColor('#1976D2')
       .text(titleEn, 50, 60, { align: 'center' });
    
    doc.fontSize(14)
       .fillColor('#666666')
       .text(titleTh, 50, 82, { align: 'center' });
    
    // Horizontal line
    doc.moveTo(50, 105)
       .lineTo(doc.page.width - 50, 105)
       .strokeColor('#1976D2')
       .lineWidth(2)
       .stroke();
    
    doc.y = 120;
  }

  /**
   * Helper: Add section header
   * @private
   */
  static _addSectionHeader(doc, titleEn, titleTh) {
    doc.fontSize(13)
       .fillColor('#1976D2')
       .text(`${titleEn} / ${titleTh}`, 70, doc.y);
    
    doc.moveTo(70, doc.y + 5)
       .lineTo(550, doc.y + 5)
       .strokeColor('#1976D2')
       .lineWidth(1)
       .stroke();
    
    doc.y += 10;
  }

  /**
   * Helper: Add PDF footer
   * @private
   */
  static _addPDFFooter(doc) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 60;
    
    // Horizontal line
    doc.moveTo(50, footerY)
       .lineTo(doc.page.width - 50, footerY)
       .strokeColor('#CCCCCC')
       .lineWidth(1)
       .stroke();
    
    // Generation timestamp
    doc.fontSize(9)
       .fillColor('#999999')
       .text(
         `Generated on ${new Date().toLocaleString('th-TH', {
           year: 'numeric',
           month: 'long',
           day: 'numeric',
           hour: '2-digit',
           minute: '2-digit'
         })}`,
         50,
         footerY + 10,
         { align: 'center', width: doc.page.width - 100 }
       );
    
    // Page number
    doc.fontSize(9)
       .fillColor('#999999')
       .text(
         `Page ${doc.bufferedPageRange().start + 1}`,
         50,
         footerY + 25,
         { align: 'center', width: doc.page.width - 100 }
       );
  }

  /**
   * Helper: Format reference type
   * @private
   */
  static _formatReferenceType(referenceType) {
    const types = {
      'order': 'คำสั่งซื้อ',
      'manual': 'บันทึกเอง',
      'other': 'อื่นๆ'
    };
    return types[referenceType] || referenceType;
  }

  /**
   * Helper: Format datetime
   * @private
   */
  static _formatDateTime(datetime) {
    if (!datetime) return '-';
    const date = new Date(datetime);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

module.exports = ExportService;
