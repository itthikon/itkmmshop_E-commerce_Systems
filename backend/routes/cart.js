const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { optionalAuth } = require('../middleware/auth');

// All cart routes support both authenticated and guest users
router.get('/', optionalAuth, cartController.getCart);
router.post('/add', optionalAuth, cartController.addItem);
router.put('/update', optionalAuth, cartController.updateItem);
router.delete('/remove/:product_id', optionalAuth, cartController.removeItem);
router.delete('/clear', optionalAuth, cartController.clearCart);

// Voucher operations
router.post('/voucher/apply', optionalAuth, cartController.applyVoucher);
router.delete('/voucher/remove', optionalAuth, cartController.removeVoucher);
router.post('/voucher/validate', optionalAuth, cartController.validateVoucher);

// Merge guest cart with user cart on login
router.post('/merge', optionalAuth, cartController.mergeCart);

module.exports = router;
