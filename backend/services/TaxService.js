const db = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');

/**
 * Tax Service
 * Handles tax settings, calculations, and report generation
 */
class TaxService {
  /**
   * Get tax setting by key
   * @param {string} key - Setting key
   * @returns {Promise<Object|null>} Tax setting
   */
  static async getSetting(key) {
    const [settings] = await db.pool.query(
      'SELECT * FROM tax_settings WHERE setting_key = ?',
      [key]
    );
    return settings.length > 0 ? settings[0] : null;
  }

  /**
   * Update or create tax setting
   * @param {string} key - Setting key
   * @param {string} value - Setting value
   * @param {string} description - Setting description
   * @param {string} effectiveDate - Effective date
   * @returns {Promise<Object>} Updated setting
   */
  static async updateSetting(key, value, description = null, effectiveDate = null) {
    const existing = await this.getSetting(key);

    if (existing) {
      await db.pool.execute(
        'UPDATE tax_settings SET setting_value = ?, description = ?, effective_date = ? WHERE setting_key = ?',
        [value, description, effectiveDate, key]
      );
    } else {
      await db.pool.execute(
        'INSERT INTO tax_settings (setting_key, setting_value, description, effective_date) VALUES (?, ?, ?, ?)',
        [key, value, description, effectiveDate]
      );
    }

    return await this.getSetting(key);
  }

  /**
   * Get all tax settings
   * @returns {Promise<Array>} All tax settings
   */
  static async getAllSettings() {
    const [settings] = await db.pool.query('SELECT * FROM tax_settings ORDER BY setting_key');
    return settings;
  }

  /**
   * Get default VAT rate
   * @returns {Promise<number>} Default VAT rate
   */
  static async getDefaultVATRate() {
    const setting = await this.getSetting('default_vat_rate');
    return setting ? parseFloat(setting.setting_value) : 7.00;
  }

  /**
   * Generate monthly tax report
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise<Object>} Tax report data
   */
  static async generateMonthlyReport(year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

    return await this.generateTaxReport(startDate, endDate, 'monthly');
  }

  /**
   * Generate yearly tax report
   * @param {number} year - Year
   * @returns {Promise<Object>} Tax report data
   */
  static async generateYearlyReport(year) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    return await this.generateTaxReport(startDate, endDate, 'yearly');
  }

  /**
   * Generate tax report for date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {string} reportType - Report type (monthly, yearly, custom)
   * @returns {Promise<Object>} Tax report data
   */
  static async generateTaxReport(startDate, endDate, reportType = 'custom') {
    // Get output VAT (from sales)
    const [salesData] = await db.pool.execute(`
      SELECT 
        o.id as order_id,
        o.order_number,
        o.created_at as transaction_date,
        oi.product_id,
        oi.product_name,
        oi.product_sku,
        oi.quantity,
        oi.unit_price_excluding_vat,
        oi.vat_rate,
        oi.unit_vat_amount,
        oi.line_total_excluding_vat,
        oi.line_total_vat,
        oi.line_total_including_vat
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.payment_status = 'paid'
        AND DATE(o.created_at) >= ?
        AND DATE(o.created_at) <= ?
      ORDER BY o.created_at, o.id, oi.id
    `, [startDate, endDate]);

    // Get input VAT (from expenses)
    const [expenseData] = await db.pool.execute(`
      SELECT 
        id as expense_id,
        description,
        category,
        expense_date as transaction_date,
        amount_excluding_vat,
        vat_rate,
        input_vat_amount,
        total_amount,
        vendor_name,
        vendor_tax_id
      FROM expenses
      WHERE DATE(expense_date) >= ?
        AND DATE(expense_date) <= ?
      ORDER BY expense_date, id
    `, [startDate, endDate]);

    // Calculate totals
    let totalOutputVAT = 0;
    let totalSalesExcludingVAT = 0;
    let totalSalesIncludingVAT = 0;

    for (const sale of salesData) {
      totalOutputVAT += parseFloat(sale.line_total_vat);
      totalSalesExcludingVAT += parseFloat(sale.line_total_excluding_vat);
      totalSalesIncludingVAT += parseFloat(sale.line_total_including_vat);
    }

    let totalInputVAT = 0;
    let totalExpensesExcludingVAT = 0;
    let totalExpensesIncludingVAT = 0;

    for (const expense of expenseData) {
      totalInputVAT += parseFloat(expense.input_vat_amount || 0);
      totalExpensesExcludingVAT += parseFloat(expense.amount_excluding_vat);
      totalExpensesIncludingVAT += parseFloat(expense.total_amount);
    }

    const netVATPayable = totalOutputVAT - totalInputVAT;

    return {
      report_type: reportType,
      period: {
        start_date: startDate,
        end_date: endDate
      },
      sales: {
        transactions: salesData,
        summary: {
          total_sales_excluding_vat: totalSalesExcludingVAT.toFixed(2),
          total_output_vat: totalOutputVAT.toFixed(2),
          total_sales_including_vat: totalSalesIncludingVAT.toFixed(2),
          transaction_count: salesData.length
        }
      },
      expenses: {
        transactions: expenseData,
        summary: {
          total_expenses_excluding_vat: totalExpensesExcludingVAT.toFixed(2),
          total_input_vat: totalInputVAT.toFixed(2),
          total_expenses_including_vat: totalExpensesIncludingVAT.toFixed(2),
          transaction_count: expenseData.length
        }
      },
      vat_summary: {
        output_vat: totalOutputVAT.toFixed(2),
        input_vat: totalInputVAT.toFixed(2),
        net_vat_payable: netVATPayable.toFixed(2)
      },
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Export tax report to Excel
   * @param {Object} reportData - Tax report data
   * @param {string} outputPath - Output file path
   * @returns {Promise<string>} File path
   */
  static async exportToExcel(reportData, outputPath) {
    const workbook = new ExcelJS.Workbook();
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Amount (THB)', key: 'amount', width: 20 }
    ];

    summarySheet.addRows([
      { description: 'Report Period', amount: `${reportData.period.start_date} to ${reportData.period.end_date}` },
      { description: '', amount: '' },
      { description: 'Sales Summary', amount: '' },
      { description: 'Total Sales (Excluding VAT)', amount: reportData.sales.summary.total_sales_excluding_vat },
      { description: 'Output VAT', amount: reportData.sales.summary.total_output_vat },
      { description: 'Total Sales (Including VAT)', amount: reportData.sales.summary.total_sales_including_vat },
      { description: '', amount: '' },
      { description: 'Expense Summary', amount: '' },
      { description: 'Total Expenses (Excluding VAT)', amount: reportData.expenses.summary.total_expenses_excluding_vat },
      { description: 'Input VAT', amount: reportData.expenses.summary.total_input_vat },
      { description: 'Total Expenses (Including VAT)', amount: reportData.expenses.summary.total_expenses_including_vat },
      { description: '', amount: '' },
      { description: 'VAT Summary', amount: '' },
      { description: 'Output VAT (from sales)', amount: reportData.vat_summary.output_vat },
      { description: 'Input VAT (from expenses)', amount: reportData.vat_summary.input_vat },
      { description: 'Net VAT Payable', amount: reportData.vat_summary.net_vat_payable }
    ]);

    // Sales detail sheet
    const salesSheet = workbook.addWorksheet('Sales Details');
    salesSheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Order Number', key: 'order_number', width: 20 },
      { header: 'Product SKU', key: 'sku', width: 15 },
      { header: 'Product Name', key: 'product_name', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Price Excl. VAT', key: 'price_excl_vat', width: 15 },
      { header: 'VAT Rate %', key: 'vat_rate', width: 10 },
      { header: 'VAT Amount', key: 'vat_amount', width: 15 },
      { header: 'Total Excl. VAT', key: 'total_excl_vat', width: 15 },
      { header: 'Total VAT', key: 'total_vat', width: 15 },
      { header: 'Total Incl. VAT', key: 'total_incl_vat', width: 15 }
    ];

    for (const sale of reportData.sales.transactions) {
      salesSheet.addRow({
        date: new Date(sale.transaction_date).toISOString().split('T')[0],
        order_number: sale.order_number,
        sku: sale.product_sku,
        product_name: sale.product_name,
        quantity: sale.quantity,
        price_excl_vat: parseFloat(sale.unit_price_excluding_vat).toFixed(2),
        vat_rate: parseFloat(sale.vat_rate).toFixed(2),
        vat_amount: parseFloat(sale.unit_vat_amount).toFixed(2),
        total_excl_vat: parseFloat(sale.line_total_excluding_vat).toFixed(2),
        total_vat: parseFloat(sale.line_total_vat).toFixed(2),
        total_incl_vat: parseFloat(sale.line_total_including_vat).toFixed(2)
      });
    }

    // Expenses detail sheet
    const expensesSheet = workbook.addWorksheet('Expense Details');
    expensesSheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Vendor', key: 'vendor', width: 20 },
      { header: 'Vendor Tax ID', key: 'vendor_tax_id', width: 15 },
      { header: 'Amount Excl. VAT', key: 'amount_excl_vat', width: 15 },
      { header: 'VAT Rate %', key: 'vat_rate', width: 10 },
      { header: 'Input VAT', key: 'input_vat', width: 15 },
      { header: 'Total Amount', key: 'total_amount', width: 15 }
    ];

    for (const expense of reportData.expenses.transactions) {
      expensesSheet.addRow({
        date: new Date(expense.transaction_date).toISOString().split('T')[0],
        description: expense.description,
        category: expense.category || '',
        vendor: expense.vendor_name || '',
        vendor_tax_id: expense.vendor_tax_id || '',
        amount_excl_vat: parseFloat(expense.amount_excluding_vat).toFixed(2),
        vat_rate: parseFloat(expense.vat_rate).toFixed(2),
        input_vat: parseFloat(expense.input_vat_amount || 0).toFixed(2),
        total_amount: parseFloat(expense.total_amount).toFixed(2)
      });
    }

    await workbook.xlsx.writeFile(outputPath);
    return outputPath;
  }

  /**
   * Export tax report to PDF
   * @param {Object} reportData - Tax report data
   * @param {string} outputPath - Output file path
   * @returns {Promise<string>} File path
   */
  static async exportToPDF(reportData, outputPath) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = require('fs').createWriteStream(outputPath);

      doc.pipe(stream);

      // Title
      doc.fontSize(20).text('Tax Report', { align: 'center' });
      doc.moveDown();

      // Period
      doc.fontSize(12).text(`Period: ${reportData.period.start_date} to ${reportData.period.end_date}`);
      doc.text(`Generated: ${new Date(reportData.generated_at).toLocaleString()}`);
      doc.moveDown();

      // VAT Summary
      doc.fontSize(16).text('VAT Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Output VAT (from sales): ${reportData.vat_summary.output_vat} THB`);
      doc.text(`Input VAT (from expenses): ${reportData.vat_summary.input_vat} THB`);
      doc.text(`Net VAT Payable: ${reportData.vat_summary.net_vat_payable} THB`, { bold: true });
      doc.moveDown();

      // Sales Summary
      doc.fontSize(16).text('Sales Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Total Sales (Excluding VAT): ${reportData.sales.summary.total_sales_excluding_vat} THB`);
      doc.text(`Total Output VAT: ${reportData.sales.summary.total_output_vat} THB`);
      doc.text(`Total Sales (Including VAT): ${reportData.sales.summary.total_sales_including_vat} THB`);
      doc.text(`Number of Transactions: ${reportData.sales.summary.transaction_count}`);
      doc.moveDown();

      // Expense Summary
      doc.fontSize(16).text('Expense Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Total Expenses (Excluding VAT): ${reportData.expenses.summary.total_expenses_excluding_vat} THB`);
      doc.text(`Total Input VAT: ${reportData.expenses.summary.total_input_vat} THB`);
      doc.text(`Total Expenses (Including VAT): ${reportData.expenses.summary.total_expenses_including_vat} THB`);
      doc.text(`Number of Transactions: ${reportData.expenses.summary.transaction_count}`);

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    });
  }

  /**
   * Export tax report to SQL dump
   * @param {Object} reportData - Tax report data
   * @param {string} outputPath - Output file path
   * @returns {Promise<string>} File path
   */
  static async exportToSQL(reportData, outputPath) {
    let sql = `-- Tax Report SQL Dump\n`;
    sql += `-- Period: ${reportData.period.start_date} to ${reportData.period.end_date}\n`;
    sql += `-- Generated: ${reportData.generated_at}\n\n`;

    sql += `-- VAT Summary\n`;
    sql += `-- Output VAT: ${reportData.vat_summary.output_vat} THB\n`;
    sql += `-- Input VAT: ${reportData.vat_summary.input_vat} THB\n`;
    sql += `-- Net VAT Payable: ${reportData.vat_summary.net_vat_payable} THB\n\n`;

    sql += `-- Sales Transactions\n`;
    sql += `CREATE TABLE IF NOT EXISTS tax_report_sales (\n`;
    sql += `  order_id INT,\n`;
    sql += `  order_number VARCHAR(50),\n`;
    sql += `  transaction_date DATETIME,\n`;
    sql += `  product_sku VARCHAR(50),\n`;
    sql += `  product_name VARCHAR(255),\n`;
    sql += `  quantity INT,\n`;
    sql += `  unit_price_excluding_vat DECIMAL(10,2),\n`;
    sql += `  vat_rate DECIMAL(5,2),\n`;
    sql += `  unit_vat_amount DECIMAL(10,2),\n`;
    sql += `  line_total_excluding_vat DECIMAL(10,2),\n`;
    sql += `  line_total_vat DECIMAL(10,2),\n`;
    sql += `  line_total_including_vat DECIMAL(10,2)\n`;
    sql += `);\n\n`;

    for (const sale of reportData.sales.transactions) {
      sql += `INSERT INTO tax_report_sales VALUES (`;
      sql += `${sale.order_id}, `;
      sql += `'${sale.order_number}', `;
      sql += `'${new Date(sale.transaction_date).toISOString().slice(0, 19).replace('T', ' ')}', `;
      sql += `'${sale.product_sku}', `;
      sql += `'${sale.product_name.replace(/'/g, "''")}', `;
      sql += `${sale.quantity}, `;
      sql += `${parseFloat(sale.unit_price_excluding_vat).toFixed(2)}, `;
      sql += `${parseFloat(sale.vat_rate).toFixed(2)}, `;
      sql += `${parseFloat(sale.unit_vat_amount).toFixed(2)}, `;
      sql += `${parseFloat(sale.line_total_excluding_vat).toFixed(2)}, `;
      sql += `${parseFloat(sale.line_total_vat).toFixed(2)}, `;
      sql += `${parseFloat(sale.line_total_including_vat).toFixed(2)}`;
      sql += `);\n`;
    }

    sql += `\n-- Expense Transactions\n`;
    sql += `CREATE TABLE IF NOT EXISTS tax_report_expenses (\n`;
    sql += `  expense_id INT,\n`;
    sql += `  description VARCHAR(255),\n`;
    sql += `  category VARCHAR(100),\n`;
    sql += `  transaction_date DATE,\n`;
    sql += `  amount_excluding_vat DECIMAL(10,2),\n`;
    sql += `  vat_rate DECIMAL(5,2),\n`;
    sql += `  input_vat_amount DECIMAL(10,2),\n`;
    sql += `  total_amount DECIMAL(10,2),\n`;
    sql += `  vendor_name VARCHAR(255),\n`;
    sql += `  vendor_tax_id VARCHAR(50)\n`;
    sql += `);\n\n`;

    for (const expense of reportData.expenses.transactions) {
      sql += `INSERT INTO tax_report_expenses VALUES (`;
      sql += `${expense.expense_id}, `;
      sql += `'${expense.description.replace(/'/g, "''")}', `;
      sql += `'${expense.category || ''}', `;
      sql += `'${new Date(expense.transaction_date).toISOString().split('T')[0]}', `;
      sql += `${parseFloat(expense.amount_excluding_vat).toFixed(2)}, `;
      sql += `${parseFloat(expense.vat_rate).toFixed(2)}, `;
      sql += `${parseFloat(expense.input_vat_amount || 0).toFixed(2)}, `;
      sql += `${parseFloat(expense.total_amount).toFixed(2)}, `;
      sql += `'${expense.vendor_name || ''}', `;
      sql += `'${expense.vendor_tax_id || ''}'`;
      sql += `);\n`;
    }

    await fs.writeFile(outputPath, sql, 'utf8');
    return outputPath;
  }
}

module.exports = TaxService;
