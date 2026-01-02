const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const accountingCategoryController = require('../controllers/accountingCategoryController');
const reportController = require('../controllers/reportController');
const settingsController = require('../controllers/settingsController');
const exportController = require('../controllers/exportController');
const { requireAdmin } = require('../middleware/auth');
const { uploadAttachment } = require('../middleware/upload');

/**
 * All accounting routes require admin authentication
 * Using requireAdmin middleware for consistent admin-only access
 */

// Transaction routes
/**
 * @route   POST /api/accounting/transactions
 * @desc    Create new transaction
 * @access  Admin only
 */
router.post(
  '/transactions',
  requireAdmin,
  accountingController.createTransaction
);

/**
 * @route   GET /api/accounting/transactions
 * @desc    Get all transactions with filters
 * @access  Admin only
 */
router.get(
  '/transactions',
  requireAdmin,
  accountingController.getTransactions
);

/**
 * @route   GET /api/accounting/transactions/:id
 * @desc    Get transaction by ID
 * @access  Admin only
 */
router.get(
  '/transactions/:id',
  requireAdmin,
  accountingController.getTransactionById
);

/**
 * @route   PUT /api/accounting/transactions/:id
 * @desc    Update transaction
 * @access  Admin only
 */
router.put(
  '/transactions/:id',
  requireAdmin,
  accountingController.updateTransaction
);

/**
 * @route   DELETE /api/accounting/transactions/:id
 * @desc    Delete transaction (soft delete)
 * @access  Admin only
 */
router.delete(
  '/transactions/:id',
  requireAdmin,
  accountingController.deleteTransaction
);

/**
 * @route   POST /api/accounting/transactions/:id/attachment
 * @desc    Upload attachment for transaction
 * @access  Admin only
 */
router.post(
  '/transactions/:id/attachment',
  requireAdmin,
  uploadAttachment.single('attachment'),
  accountingController.uploadTransactionAttachment
);

// Category routes
/**
 * @route   POST /api/accounting/categories
 * @desc    Create new category
 * @access  Admin only
 */
router.post(
  '/categories',
  requireAdmin,
  accountingCategoryController.createCategory
);

/**
 * @route   GET /api/accounting/categories
 * @desc    Get all categories
 * @access  Admin only
 */
router.get(
  '/categories',
  requireAdmin,
  accountingCategoryController.getCategories
);

/**
 * @route   GET /api/accounting/categories/:id
 * @desc    Get category by ID
 * @access  Admin only
 */
router.get(
  '/categories/:id',
  requireAdmin,
  accountingCategoryController.getCategoryById
);

/**
 * @route   GET /api/accounting/categories/:id/can-delete
 * @desc    Check if category can be deleted and get usage count
 * @access  Admin only
 */
router.get(
  '/categories/:id/can-delete',
  requireAdmin,
  accountingCategoryController.checkCanDelete
);

/**
 * @route   PUT /api/accounting/categories/:id
 * @desc    Update category
 * @access  Admin only
 */
router.put(
  '/categories/:id',
  requireAdmin,
  accountingCategoryController.updateCategory
);

/**
 * @route   DELETE /api/accounting/categories/:id
 * @desc    Delete/Deactivate category
 * @access  Admin only
 */
router.delete(
  '/categories/:id',
  requireAdmin,
  accountingCategoryController.deleteCategory
);

// Report routes
/**
 * @route   GET /api/accounting/reports/dashboard
 * @desc    Get dashboard summary
 * @access  Admin only
 */
router.get(
  '/reports/dashboard',
  requireAdmin,
  reportController.getDashboard
);

/**
 * @route   GET /api/accounting/reports/profit-loss
 * @desc    Get profit & loss report
 * @access  Admin only
 */
router.get(
  '/reports/profit-loss',
  requireAdmin,
  reportController.getProfitLoss
);

/**
 * @route   GET /api/accounting/reports/cash-flow
 * @desc    Get cash flow report
 * @access  Admin only
 */
router.get(
  '/reports/cash-flow',
  requireAdmin,
  reportController.getCashFlow
);

/**
 * @route   GET /api/accounting/reports/income-breakdown
 * @desc    Get income breakdown by category
 * @access  Admin only
 */
router.get(
  '/reports/income-breakdown',
  requireAdmin,
  reportController.getIncomeBreakdown
);

/**
 * @route   GET /api/accounting/reports/expense-breakdown
 * @desc    Get expense breakdown by category
 * @access  Admin only
 */
router.get(
  '/reports/expense-breakdown',
  requireAdmin,
  reportController.getExpenseBreakdown
);

// Settings routes
/**
 * @route   GET /api/accounting/settings
 * @desc    Get all settings
 * @access  Admin only
 */
router.get(
  '/settings',
  requireAdmin,
  settingsController.getSettings
);

/**
 * @route   GET /api/accounting/settings/:key
 * @desc    Get specific setting
 * @access  Admin only
 */
router.get(
  '/settings/:key',
  requireAdmin,
  settingsController.getSetting
);

/**
 * @route   PUT /api/accounting/settings/:key
 * @desc    Update setting
 * @access  Admin only
 */
router.put(
  '/settings/:key',
  requireAdmin,
  settingsController.updateSetting
);

/**
 * @route   POST /api/accounting/settings/initialize
 * @desc    Initialize default settings
 * @access  Admin only
 */
router.post(
  '/settings/initialize',
  requireAdmin,
  settingsController.initializeSettings
);

// Export routes
/**
 * @route   POST /api/accounting/export/transactions
 * @desc    Export transactions to Excel
 * @access  Admin only
 */
router.post(
  '/export/transactions',
  requireAdmin,
  exportController.exportTransactions
);

/**
 * @route   POST /api/accounting/export/report
 * @desc    Export report to PDF
 * @access  Admin only
 */
router.post(
  '/export/report',
  requireAdmin,
  exportController.exportReport
);

module.exports = router;
