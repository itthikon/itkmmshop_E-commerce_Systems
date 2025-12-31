const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadPaymentSlip } = require('../middleware/upload');
const { paymentLimiter } = require('../middleware/security');

/**
 * Payment Routes
 * Handles payment processing, slip uploads, and QR code generation
 */

// Public routes (accessible to customers) - with payment rate limiting
router.get('/order/:orderId', paymentController.getPaymentByOrder);
router.get('/promptpay/:orderId', paymentController.generatePromptPayQR);
router.post('/upload-slip', paymentLimiter, uploadPaymentSlip.single('slip_image'), paymentController.uploadSlip);
router.get('/receipt/:receiptNumber', paymentController.downloadReceipt);
router.get('/receipt/:receiptNumber/view', paymentController.viewReceipt);

// SlipOK status check
router.get('/slipok/status', paymentController.checkSlipOKStatus);

// Staff/Admin routes - with payment rate limiting for sensitive operations
router.post('/', authenticate, authorize(['staff', 'admin']), paymentController.createPayment);
router.post('/:id/confirm', paymentLimiter, authenticate, authorize(['staff', 'admin']), paymentController.confirmPayment);
router.post('/:id/verify-slip', paymentLimiter, authenticate, authorize(['staff', 'admin']), paymentController.verifySlip);
router.post('/:id/generate-receipt', authenticate, authorize(['staff', 'admin']), paymentController.generateReceipt);
router.get('/', authenticate, authorize(['staff', 'admin']), paymentController.getAllPayments);
router.get('/:id', authenticate, authorize(['staff', 'admin']), paymentController.getPaymentById);

// Admin only routes
router.delete('/:id', authenticate, authorize(['admin']), paymentController.deletePayment);

module.exports = router;
