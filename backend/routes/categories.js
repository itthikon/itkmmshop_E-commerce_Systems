const express = require('express');
const router = express.Router();
const productCategoryController = require('../controllers/productCategoryController');
const { authenticate, authorize } = require('../middleware/auth');
const { cacheMiddleware, CACHE_DURATION } = require('../middleware/cache');

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', cacheMiddleware(CACHE_DURATION.long), productCategoryController.getCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/:id', cacheMiddleware(CACHE_DURATION.long), productCategoryController.getCategoryById);

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private (Admin only)
 */
router.post('/', authenticate, authorize(['admin']), productCategoryController.createCategory);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, authorize(['admin']), productCategoryController.updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(['admin']), productCategoryController.deleteCategory);

module.exports = router;
