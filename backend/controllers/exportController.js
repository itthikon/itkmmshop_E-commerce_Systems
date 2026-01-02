const ExportService = require('../services/ExportService');
const ReportService = require('../services/ReportService');
const TransactionService = require('../services/TransactionService');
const path = require('path');
const fs = require('fs');

/**
 * Export Controller
 * Handles exporting transactions and reports to Excel/PDF
 */

/**
 * Export transactions to Excel
 * POST /api/accounting/export/transactions
 */
const exportTransactions = async (req, res) => {
  try {
    const filters = {
      transaction_type: req.body.transaction_type,
      category_id: req.body.category_id,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      search: req.body.search,
      sort_by: req.body.sort_by || 'transaction_date',
      sort_order: req.body.sort_order || 'DESC'
    };

    // Get all transactions matching filters (no pagination for export)
    const result = await TransactionService.getTransactions({
      ...filters,
      page: 1,
      limit: 10000 // Large limit to get all transactions
    });

    if (!result.transactions || result.transactions.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'ไม่พบข้อมูลที่ต้องการ export'
        }
      });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `transactions-${timestamp}`;

    // Export to Excel
    const filepath = await ExportService.exportTransactionsToExcel(
      result.transactions,
      filename
    );

    // Send file
    res.download(filepath, `${filename}.xlsx`, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: {
              code: 'DOWNLOAD_ERROR',
              message: 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์'
            }
          });
        }
      }

      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }, 5000);
    });
  } catch (error) {
    console.error('Export transactions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_ERROR',
        message: 'เกิดข้อผิดพลาดในการ export ข้อมูล'
      }
    });
  }
};

/**
 * Export report to PDF
 * POST /api/accounting/export/report
 */
const exportReport = async (req, res) => {
  try {
    const { report_type, start_date, end_date, group_by } = req.body;

    // Validate report type
    if (!report_type || !['profit-loss', 'cash-flow'].includes(report_type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ประเภทรายงานไม่ถูกต้อง (profit-loss หรือ cash-flow)'
        }
      });
    }

    // Validate dates
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'กรุณาระบุวันที่เริ่มต้นและสิ้นสุด'
        }
      });
    }

    let reportData;

    // Generate report data based on type
    if (report_type === 'profit-loss') {
      reportData = await ReportService.generateProfitLoss(start_date, end_date);
    } else if (report_type === 'cash-flow') {
      const groupByPeriod = group_by || 'daily';
      reportData = await ReportService.generateCashFlow(start_date, end_date, groupByPeriod);
    }

    if (!reportData) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'ไม่พบข้อมูลรายงาน'
        }
      });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const reportTypeName = report_type === 'profit-loss' ? 'profit-loss' : 'cash-flow';
    const filename = `${reportTypeName}-${timestamp}`;

    // Export to PDF
    const filepath = await ExportService.exportReportToPDF(
      reportData,
      report_type,
      filename
    );

    // Send file
    res.download(filepath, `${filename}.pdf`, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: {
              code: 'DOWNLOAD_ERROR',
              message: 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์'
            }
          });
        }
      }

      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }, 5000);
    });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_ERROR',
        message: 'เกิดข้อผิดพลาดในการ export รายงาน'
      }
    });
  }
};

module.exports = {
  exportTransactions,
  exportReport
};
