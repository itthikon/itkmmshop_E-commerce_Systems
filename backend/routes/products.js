const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadProductImage } = require('../middleware/upload');
const { cacheMiddleware, CACHE_DURATION } = require('../middleware/cache');

/**
 * @route   POST /api/products/generate-sku
 * @desc    Generate SKU preview for product
 * @access  Private (Admin only)
 */
router.post('/generate-sku', authenticate, authorize(['admin']), productController.generateSKU);

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering and pagination
 * @access  Public
 */
router.get('/', cacheMiddleware(CACHE_DURATION.medium), productController.getProducts);

/**
 * @route   GET /api/products/alerts/low-stock
 * @desc    Get low stock products
 * @access  Private (Admin/Staff)
 */
router.get('/alerts/low-stock', authenticate, authorize(['admin', 'staff']), productController.getLowStockProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', cacheMiddleware(CACHE_DURATION.medium), productController.getProductById);

/**
 * @route   GET /api/products/:id/stock-history
 * @desc    Get stock history for a product
 * @access  Private (Admin/Staff)
 */
router.get('/:id/stock-history', authenticate, authorize(['admin', 'staff']), productController.getStockHistory);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (Admin only)
 */
router.post('/', authenticate, authorize(['admin']), productController.createProduct);

/**
 * @route   POST /api/products/:id/stock
 * @desc    Update product stock
 * @access  Private (Admin/Staff)
 */
router.post('/:id/stock', authenticate, authorize(['admin', 'staff']), productController.updateStock);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, authorize(['admin']), productController.updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(['admin']), productController.deleteProduct);

/**
 * @route   POST /api/products/:id/image
 * @desc    Upload product image
 * @access  Private (Admin only)
 */
router.post('/:id/image', authenticate, authorize(['admin']), uploadProductImage.single('image'), productController.uploadImage);

/**
 * @route   DELETE /api/products/:id/image
 * @desc    Delete product image
 * @access  Private (Admin only)
 */
router.delete('/:id/image', authenticate, authorize(['admin']), productController.deleteImage);

module.exports = router;
