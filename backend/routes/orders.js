const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadPackingMedia } = require('../middleware/upload');

/**
 * Order Routes
 */

// Public routes
router.post('/guest-lookup', orderController.guestOrderLookup);

// Protected routes (require authentication)
router.post('/', optionalAuth, orderController.createOrderFromCart);
router.post('/direct', authenticate, orderController.createOrderDirect);
router.get('/', authenticate, orderController.getAllOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.get('/number/:orderNumber', authenticate, orderController.getOrderByNumber);

// Staff/Admin routes
router.put('/:id/status', authenticate, orderController.updateOrderStatus);
router.put('/:id/payment-status', authenticate, orderController.updatePaymentStatus);
router.put('/:id/tracking', authenticate, orderController.updateTrackingNumber);
router.post('/:id/packing-media', authenticate, uploadPackingMedia.single('media'), orderController.uploadPackingMedia);
router.post('/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;
