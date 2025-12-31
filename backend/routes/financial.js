const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const { authenticate, authorize } = require('../middleware/auth');

// All financial routes require authentication and admin/staff role
router.use(authenticate);

// Expense routes
router.post('/expenses', authorize(['admin', 'staff']), financialController.createExpense);
router.get('/expenses', authorize(['admin', 'staff']), financialController.getExpenses);
router.get('/expenses/summary', authorize(['admin', 'staff']), financialController.getExpenseSummary);
router.get('/expenses/:id', authorize(['admin', 'staff']), financialController.getExpenseById);
router.put('/expenses/:id', authorize(['admin', 'staff']), financialController.updateExpense);
router.delete('/expenses/:id', authorize(['admin']), financialController.deleteExpense);

// Revenue routes
router.get('/revenue/summary', authorize(['admin', 'staff']), financialController.getRevenueSummary);
router.get('/revenue/by-period', authorize(['admin', 'staff']), financialController.getRevenueByPeriod);
router.get('/revenue/top-products', authorize(['admin', 'staff']), financialController.getTopProducts);

// Profit routes
router.get('/profit/by-product', authorize(['admin', 'staff']), financialController.getProfitByProduct);

// Comprehensive financial report
router.get('/report', authorize(['admin', 'staff']), financialController.getFinancialReport);

// Tax settings routes
router.get('/tax/settings', authorize(['admin', 'staff']), financialController.getAllTaxSettings);
router.get('/tax/settings/:key', authorize(['admin', 'staff']), financialController.getTaxSetting);
router.put('/tax/settings/:key', authorize(['admin']), financialController.updateTaxSetting);

// Tax report routes
router.get('/tax/report/monthly', authorize(['admin', 'staff']), financialController.generateMonthlyTaxReport);
router.get('/tax/report/yearly', authorize(['admin', 'staff']), financialController.generateYearlyTaxReport);
router.get('/tax/report/custom', authorize(['admin', 'staff']), financialController.generateCustomTaxReport);

// Tax report export routes
router.get('/tax/report/export/excel', authorize(['admin', 'staff']), financialController.exportTaxReportExcel);
router.get('/tax/report/export/pdf', authorize(['admin', 'staff']), financialController.exportTaxReportPDF);
router.get('/tax/report/export/sql', authorize(['admin', 'staff']), financialController.exportTaxReportSQL);

// Financial report export routes
router.get('/report/export/csv', authorize(['admin', 'staff']), financialController.exportFinancialReportCSV);
router.get('/report/export/json', authorize(['admin', 'staff']), financialController.exportFinancialReportJSON);

module.exports = router;
