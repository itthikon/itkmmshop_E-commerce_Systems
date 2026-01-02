const ReportService = require('../services/ReportService');

/**
 * Report Controller
 * Handles financial report generation
 */

/**
 * Get dashboard summary
 * GET /api/accounting/reports/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Default to current month/year if not provided
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    // Validate month
    if (targetMonth < 1 || targetMonth > 12) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'เดือนต้องอยู่ระหว่าง 1-12'
        }
      });
    }

    // Validate year
    if (targetYear < 2000 || targetYear > 2100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ปีไม่ถูกต้อง'
        }
      });
    }

    const dashboard = await ReportService.getDashboardSummary(targetMonth, targetYear);

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการสร้างรายงาน'
      }
    });
  }
};

/**
 * Get profit & loss report
 * GET /api/accounting/reports/profit-loss
 */
const getProfitLoss = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Validate required parameters
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด'
        }
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)'
        }
      });
    }

    // Validate date range
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด'
        }
      });
    }

    const report = await ReportService.generateProfitLoss(start_date, end_date);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get profit-loss report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการสร้างรายงานกำไร-ขาดทุน'
      }
    });
  }
};

/**
 * Get cash flow report
 * GET /api/accounting/reports/cash-flow
 */
const getCashFlow = async (req, res) => {
  try {
    const { start_date, end_date, group_by } = req.query;

    // Validate required parameters
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด'
        }
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)'
        }
      });
    }

    // Validate date range
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด'
        }
      });
    }

    // Validate group_by parameter
    const validGroupBy = ['daily', 'weekly', 'monthly'];
    const groupBy = group_by || 'daily';
    
    if (!validGroupBy.includes(groupBy)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'รูปแบบการจัดกลุ่มไม่ถูกต้อง (daily, weekly, monthly)'
        }
      });
    }

    const report = await ReportService.generateCashFlow(start_date, end_date, groupBy);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get cash flow report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการสร้างรายงานกระแสเงินสด'
      }
    });
  }
};

/**
 * Get income breakdown by category
 * GET /api/accounting/reports/income-breakdown
 */
const getIncomeBreakdown = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Validate required parameters
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด'
        }
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)'
        }
      });
    }

    // Validate date range
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด'
        }
      });
    }

    const breakdown = await ReportService.getIncomeBreakdown(start_date, end_date);

    res.json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    console.error('Get income breakdown error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการสร้างรายงาน'
      }
    });
  }
};

/**
 * Get expense breakdown by category
 * GET /api/accounting/reports/expense-breakdown
 */
const getExpenseBreakdown = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Validate required parameters
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด'
        }
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)'
        }
      });
    }

    // Validate date range
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด'
        }
      });
    }

    const breakdown = await ReportService.getExpenseBreakdown(start_date, end_date);

    res.json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    console.error('Get expense breakdown error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการสร้างรายงาน'
      }
    });
  }
};

module.exports = {
  getDashboard,
  getProfitLoss,
  getCashFlow,
  getIncomeBreakdown,
  getExpenseBreakdown
};
