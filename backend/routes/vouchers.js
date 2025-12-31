const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { authenticate, authorize } = require('../middleware/auth');

// Admin-only routes
router.get('/', authenticate, authorize(['admin']), voucherController.getAllVouchers);
router.get('/:id', authenticate, authorize(['admin']), voucherController.getVoucherById);
router.post('/', authenticate, authorize(['admin']), voucherController.createVoucher);
router.put('/:id', authenticate, authorize(['admin']), voucherController.updateVoucher);
router.delete('/:id', authenticate, authorize(['admin']), voucherController.deleteVoucher);
router.get('/:id/usage', authenticate, authorize(['admin']), voucherController.getVoucherUsage);

module.exports = router;
