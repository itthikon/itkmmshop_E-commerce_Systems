const AnalyticsService = require('../services/AnalyticsService');

/**
 * Get customer demographics analytics
 */
exports.getDemographics = async (req, res) => {
  try {
    const [genderData, ageData] = await Promise.all([
      AnalyticsService.getGenderDistribution(),
      AnalyticsService.getAgeGroupDistribution()
    ]);

    res.json({
      success: true,
      data: {
        gender: genderData,
        ageGroups: ageData
      }
    });
  } catch (error) {
    console.error('Error fetching demographics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to fetch demographics data'
      }
    });
  }
};

/**
 * Get customer location analytics
 */
exports.getLocationAnalytics = async (req, res) => {
  try {
    const { province, district } = req.query;

    let data;
    if (district && province) {
      // Get subdistrict data
      data = {
        level: 'subdistrict',
        data: await AnalyticsService.getSubdistrictDistribution(province, district)
      };
    } else if (province) {
      // Get district data
      data = {
        level: 'district',
        data: await AnalyticsService.getDistrictDistribution(province)
      };
    } else {
      // Get province data
      data = {
        level: 'province',
        data: await AnalyticsService.getProvinceDistribution()
      };
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching location analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to fetch location analytics'
      }
    });
  }
};

/**
 * Get comprehensive dashboard analytics
 */
exports.getDashboard = async (req, res) => {
  try {
    const dashboardData = await AnalyticsService.getDashboardData();

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to fetch dashboard data'
      }
    });
  }
};

/**
 * Get customer purchasing patterns
 */
exports.getPurchasingPatterns = async (req, res) => {
  try {
    const patterns = await AnalyticsService.getPurchasingPatterns();

    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('Error fetching purchasing patterns:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to fetch purchasing patterns'
      }
    });
  }
};

/**
 * Get top customers
 */
exports.getTopCustomers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topCustomers = await AnalyticsService.getTopCustomers(limit);

    res.json({
      success: true,
      data: topCustomers
    });
  } catch (error) {
    console.error('Error fetching top customers:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to fetch top customers'
      }
    });
  }
};

/**
 * Get platform distribution
 */
exports.getPlatformDistribution = async (req, res) => {
  try {
    const platformData = await AnalyticsService.getPlatformDistribution();

    res.json({
      success: true,
      data: platformData
    });
  } catch (error) {
    console.error('Error fetching platform distribution:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to fetch platform distribution'
      }
    });
  }
};
