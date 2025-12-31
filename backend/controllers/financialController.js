const Expense = require('../models/Expense');
const FinancialService = require('../services/FinancialService');
const TaxService = require('../services/TaxService');
const path = require('path');
const fs = require('fs').promises;

/**
 * Financial Controller
 * Handles financial tracking, expenses, and reporting
 */

/**
 * Create new expense
 */
exports.createExpense = async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      created_by: req.user.id
    };

    const expense = await Expense.create(expenseData);

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: error.message
    });
  }
};

/**
 * Get all expenses with filtering
 */
exports.getExpenses = async (req, res) => {
  try {
    const options = {
      category: req.query.category,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      search: req.query.search,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await Expense.findAll(options);

    res.json({
      success: true,
      data: result.expenses,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expenses',
      error: error.message
    });
  }
};

/**
 * Get expense by ID
 */
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expense',
      error: error.message
    });
  }
};

/**
 * Update expense
 */
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.update(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message
    });
  }
};

/**
 * Delete expense
 */
exports.deleteExpense = async (req, res) => {
  try {
    const success = await Expense.delete(req.params.id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
};

/**
 * Get expense summary
 */
exports.getExpenseSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const summary = await Expense.getSummary(start_date, end_date);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get expense summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expense summary',
      error: error.message
    });
  }
};

/**
 * Get revenue summary
 */
exports.getRevenueSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const summary = await FinancialService.getRevenueSummary(start_date, end_date);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get revenue summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve revenue summary',
      error: error.message
    });
  }
};

/**
 * Get profit by product
 */
exports.getProfitByProduct = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const profitData = await FinancialService.getProfitByProduct(start_date, end_date);

    res.json({
      success: true,
      data: profitData
    });
  } catch (error) {
    console.error('Get profit by product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profit data',
      error: error.message
    });
  }
};

/**
 * Get comprehensive financial report
 */
exports.getFinancialReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const report = await FinancialService.getFinancialReport(start_date, end_date);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get financial report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial report',
      error: error.message
    });
  }
};

/**
 * Get revenue by period
 */
exports.getRevenueByPeriod = async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'month' } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const data = await FinancialService.getRevenueByPeriod(start_date, end_date, group_by);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get revenue by period error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve revenue by period',
      error: error.message
    });
  }
};

/**
 * Get top selling products
 */
exports.getTopProducts = async (req, res) => {
  try {
    const { start_date, end_date, limit = 10 } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const products = await FinancialService.getTopProducts(start_date, end_date, parseInt(limit));

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve top products',
      error: error.message
    });
  }
};

/**
 * Get tax setting
 */
exports.getTaxSetting = async (req, res) => {
  try {
    const setting = await TaxService.getSetting(req.params.key);

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Tax setting not found'
      });
    }

    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Get tax setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tax setting',
      error: error.message
    });
  }
};

/**
 * Get all tax settings
 */
exports.getAllTaxSettings = async (req, res) => {
  try {
    const settings = await TaxService.getAllSettings();

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get all tax settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tax settings',
      error: error.message
    });
  }
};

/**
 * Update tax setting
 */
exports.updateTaxSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description, effective_date } = req.body;

    if (!value) {
      return res.status(400).json({
        success: false,
        message: 'Setting value is required'
      });
    }

    const setting = await TaxService.updateSetting(key, value, description, effective_date);

    res.json({
      success: true,
      message: 'Tax setting updated successfully',
      data: setting
    });
  } catch (error) {
    console.error('Update tax setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tax setting',
      error: error.message
    });
  }
};

/**
 * Generate monthly tax report
 */
exports.generateMonthlyTaxReport = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }

    const report = await TaxService.generateMonthlyReport(parseInt(year), parseInt(month));

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Generate monthly tax report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly tax report',
      error: error.message
    });
  }
};

/**
 * Generate yearly tax report
 */
exports.generateYearlyTaxReport = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year is required'
      });
    }

    const report = await TaxService.generateYearlyReport(parseInt(year));

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Generate yearly tax report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate yearly tax report',
      error: error.message
    });
  }
};

/**
 * Generate custom tax report
 */
exports.generateCustomTaxReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const report = await TaxService.generateTaxReport(start_date, end_date, 'custom');

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Generate custom tax report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate custom tax report',
      error: error.message
    });
  }
};

/**
 * Export tax report to Excel
 */
exports.exportTaxReportExcel = async (req, res) => {
  try {
    const { start_date, end_date, report_type = 'custom' } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const report = await TaxService.generateTaxReport(start_date, end_date, report_type);
    
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '../exports');
    try {
      await fs.mkdir(exportsDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    const filename = `tax_report_${start_date}_to_${end_date}.xlsx`;
    const filepath = path.join(exportsDir, filename);

    await TaxService.exportToExcel(report, filepath);

    res.download(filepath, filename, async (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      try {
        await fs.unlink(filepath);
      } catch (unlinkErr) {
        console.error('File cleanup error:', unlinkErr);
      }
    });
  } catch (error) {
    console.error('Export tax report to Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export tax report to Excel',
      error: error.message
    });
  }
};

/**
 * Export tax report to PDF
 */
exports.exportTaxReportPDF = async (req, res) => {
  try {
    const { start_date, end_date, report_type = 'custom' } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const report = await TaxService.generateTaxReport(start_date, end_date, report_type);
    
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '../exports');
    try {
      await fs.mkdir(exportsDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    const filename = `tax_report_${start_date}_to_${end_date}.pdf`;
    const filepath = path.join(exportsDir, filename);

    await TaxService.exportToPDF(report, filepath);

    res.download(filepath, filename, async (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      try {
        await fs.unlink(filepath);
      } catch (unlinkErr) {
        console.error('File cleanup error:', unlinkErr);
      }
    });
  } catch (error) {
    console.error('Export tax report to PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export tax report to PDF',
      error: error.message
    });
  }
};

/**
 * Export tax report to SQL
 */
exports.exportTaxReportSQL = async (req, res) => {
  try {
    const { start_date, end_date, report_type = 'custom' } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const report = await TaxService.generateTaxReport(start_date, end_date, report_type);
    
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '../exports');
    try {
      await fs.mkdir(exportsDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    const filename = `tax_report_${start_date}_to_${end_date}.sql`;
    const filepath = path.join(exportsDir, filename);

    await TaxService.exportToSQL(report, filepath);

    res.download(filepath, filename, async (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      try {
        await fs.unlink(filepath);
      } catch (unlinkErr) {
        console.error('File cleanup error:', unlinkErr);
      }
    });
  } catch (error) {
    console.error('Export tax report to SQL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export tax report to SQL',
      error: error.message
    });
  }
};

/**
 * Export financial report to CSV
 */
exports.exportFinancialReportCSV = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const report = await FinancialService.getFinancialReport(start_date, end_date);
    const csvContent = FinancialService.exportToCSV(report);

    const filename = `financial_report_${start_date}_to_${end_date}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export financial report to CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export financial report to CSV',
      error: error.message
    });
  }
};

/**
 * Export financial report to JSON
 */
exports.exportFinancialReportJSON = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const report = await FinancialService.getFinancialReport(start_date, end_date);
    const jsonContent = FinancialService.exportToJSON(report);

    const filename = `financial_report_${start_date}_to_${end_date}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(jsonContent);
  } catch (error) {
    console.error('Export financial report to JSON error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export financial report to JSON',
      error: error.message
    });
  }
};

