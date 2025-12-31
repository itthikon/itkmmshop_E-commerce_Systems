const db = require('../config/database');

/**
 * Analytics Service
 * Provides customer demographics and location analytics
 */
class AnalyticsService {
  /**
   * Get customer demographics by gender
   * @returns {Promise<Array>} Gender distribution
   */
  static async getGenderDistribution() {
    const query = `
      SELECT 
        gender,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE role = 'customer'), 2) as percentage
      FROM users
      WHERE role = 'customer' AND gender IS NOT NULL
      GROUP BY gender
      ORDER BY count DESC
    `;

    const [results] = await db.pool.query(query);
    return results;
  }

  /**
   * Get customer demographics by age group
   * @returns {Promise<Array>} Age group distribution
   */
  static async getAgeGroupDistribution() {
    const query = `
      SELECT 
        CASE
          WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) < 18 THEN 'Under 18'
          WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 18 AND 24 THEN '18-24'
          WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 25 AND 34 THEN '25-34'
          WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 35 AND 44 THEN '35-44'
          WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 45 AND 54 THEN '45-54'
          WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 55 AND 64 THEN '55-64'
          ELSE '65+'
        END as age_group,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE role = 'customer' AND birth_date IS NOT NULL), 2) as percentage
      FROM users
      WHERE role = 'customer' AND birth_date IS NOT NULL
      GROUP BY age_group
      ORDER BY 
        CASE age_group
          WHEN 'Under 18' THEN 1
          WHEN '18-24' THEN 2
          WHEN '25-34' THEN 3
          WHEN '35-44' THEN 4
          WHEN '45-54' THEN 5
          WHEN '55-64' THEN 6
          WHEN '65+' THEN 7
        END
    `;

    const [results] = await db.pool.query(query);
    return results;
  }

  /**
   * Get customer location distribution by province
   * @returns {Promise<Array>} Province distribution
   */
  static async getProvinceDistribution() {
    const query = `
      SELECT 
        shipping_province as province,
        COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id ELSE CONCAT('guest_', id) END) as customer_count,
        COUNT(*) as order_count,
        SUM(total_amount) as total_revenue
      FROM orders
      WHERE shipping_province IS NOT NULL
      GROUP BY shipping_province
      ORDER BY customer_count DESC
      LIMIT 20
    `;

    const [results] = await db.pool.query(query);
    return results;
  }

  /**
   * Get customer location distribution by district
   * @param {string} province - Optional province filter
   * @returns {Promise<Array>} District distribution
   */
  static async getDistrictDistribution(province = null) {
    let query = `
      SELECT 
        shipping_province as province,
        shipping_district as district,
        COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id ELSE CONCAT('guest_', id) END) as customer_count,
        COUNT(*) as order_count,
        SUM(total_amount) as total_revenue
      FROM orders
      WHERE shipping_district IS NOT NULL
    `;

    const params = [];
    if (province) {
      query += ' AND shipping_province = ?';
      params.push(province);
    }

    query += `
      GROUP BY shipping_province, shipping_district
      ORDER BY customer_count DESC
      LIMIT 50
    `;

    const [results] = await db.pool.query(query, params);
    return results;
  }

  /**
   * Get customer location distribution by subdistrict
   * @param {string} province - Optional province filter
   * @param {string} district - Optional district filter
   * @returns {Promise<Array>} Subdistrict distribution
   */
  static async getSubdistrictDistribution(province = null, district = null) {
    let query = `
      SELECT 
        shipping_province as province,
        shipping_district as district,
        shipping_subdistrict as subdistrict,
        COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id ELSE CONCAT('guest_', id) END) as customer_count,
        COUNT(*) as order_count,
        SUM(total_amount) as total_revenue
      FROM orders
      WHERE shipping_subdistrict IS NOT NULL
    `;

    const params = [];
    if (province) {
      query += ' AND shipping_province = ?';
      params.push(province);
    }
    if (district) {
      query += ' AND shipping_district = ?';
      params.push(district);
    }

    query += `
      GROUP BY shipping_province, shipping_district, shipping_subdistrict
      ORDER BY customer_count DESC
      LIMIT 100
    `;

    const [results] = await db.pool.query(query, params);
    return results;
  }

  /**
   * Get comprehensive customer analytics dashboard data
   * @returns {Promise<Object>} Complete analytics data
   */
  static async getDashboardData() {
    const [genderData, ageData, provinceData, totalCustomers, totalOrders, totalRevenue] = await Promise.all([
      this.getGenderDistribution(),
      this.getAgeGroupDistribution(),
      this.getProvinceDistribution(),
      this.getTotalCustomerCount(),
      this.getTotalOrderCount(),
      this.getTotalRevenue()
    ]);

    return {
      demographics: {
        gender: genderData,
        ageGroups: ageData
      },
      location: {
        provinces: provinceData
      },
      summary: {
        totalCustomers: totalCustomers,
        totalOrders: totalOrders,
        totalRevenue: totalRevenue
      }
    };
  }

  /**
   * Get total customer count
   * @returns {Promise<number>} Total customers
   */
  static async getTotalCustomerCount() {
    const query = `
      SELECT COUNT(*) as count FROM users WHERE role = 'customer'
    `;
    const [results] = await db.pool.query(query);
    return results[0].count;
  }

  /**
   * Get total order count
   * @returns {Promise<number>} Total orders
   */
  static async getTotalOrderCount() {
    const query = `
      SELECT COUNT(*) as count FROM orders
    `;
    const [results] = await db.pool.query(query);
    return results[0].count;
  }

  /**
   * Get total revenue
   * @returns {Promise<number>} Total revenue
   */
  static async getTotalRevenue() {
    const query = `
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'
    `;
    const [results] = await db.pool.query(query);
    return parseFloat(results[0].total);
  }

  /**
   * Get customer purchasing patterns
   * @returns {Promise<Object>} Purchasing pattern data
   */
  static async getPurchasingPatterns() {
    const query = `
      SELECT 
        CASE
          WHEN order_count = 1 THEN 'One-time buyer'
          WHEN order_count BETWEEN 2 AND 5 THEN 'Occasional buyer'
          WHEN order_count BETWEEN 6 AND 10 THEN 'Regular buyer'
          ELSE 'Frequent buyer'
        END as customer_type,
        COUNT(*) as count,
        AVG(total_spent) as avg_spent,
        AVG(order_count) as avg_orders
      FROM (
        SELECT 
          COALESCE(user_id, CONCAT('guest_', id)) as customer_id,
          COUNT(*) as order_count,
          SUM(total_amount) as total_spent
        FROM orders
        WHERE payment_status = 'paid'
        GROUP BY customer_id
      ) as customer_orders
      GROUP BY customer_type
      ORDER BY 
        CASE customer_type
          WHEN 'One-time buyer' THEN 1
          WHEN 'Occasional buyer' THEN 2
          WHEN 'Regular buyer' THEN 3
          WHEN 'Frequent buyer' THEN 4
        END
    `;

    const [results] = await db.pool.query(query);
    return results;
  }

  /**
   * Get top customers by revenue
   * @param {number} limit - Number of top customers to return
   * @returns {Promise<Array>} Top customers
   */
  static async getTopCustomers(limit = 10) {
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM users u
      INNER JOIN orders o ON u.id = o.user_id
      WHERE o.payment_status = 'paid'
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY total_spent DESC
      LIMIT ?
    `;

    const [results] = await db.pool.query(query, [limit]);
    return results;
  }

  /**
   * Get sales by source platform
   * @returns {Promise<Array>} Platform distribution
   */
  static async getPlatformDistribution() {
    const query = `
      SELECT 
        source_platform,
        COUNT(*) as order_count,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value
      FROM orders
      WHERE payment_status = 'paid'
      GROUP BY source_platform
      ORDER BY total_revenue DESC
    `;

    const [results] = await db.pool.query(query);
    return results;
  }
}

module.exports = AnalyticsService;
