const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Analytics Routes
 * All routes require admin authentication
 */

// Get customer demographics (gender and age groups)
router.get('/demographics', authenticate, authorize('admin'), analyticsController.getDemographics);

// Get location analytics (province, district, subdistrict)
router.get('/location', authenticate, authorize('admin'), analyticsController.getLocationAnalytics);

// Get comprehensive dashboard data
router.get('/dashboard', authenticate, authorize('admin'), analyticsController.getDashboard);

// Get customer purchasing patterns
router.get('/purchasing-patterns', authenticate, authorize('admin'), analyticsController.getPurchasingPatterns);

// Get top customers by revenue
router.get('/top-customers', authenticate, authorize('admin'), analyticsController.getTopCustomers);

// Get sales by platform
router.get('/platform-distribution', authenticate, authorize('admin'), analyticsController.getPlatformDistribution);

module.exports = router;
