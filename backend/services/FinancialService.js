const db = require('../config/database');

/**
 * Financial Service
 * Handles revenue tracking, profit calculations, and financial reporting
 */
class FinancialService {
  /**
   * Get revenue data from orders
   * Revenue is automatically tracked through order_items table
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Object>} Revenue summary
   */
  static async getRevenueSummary(startDate, endDate) {
    const query = `
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        SUM(oi.line_total_excluding_vat) as total_revenue_excluding_vat,
        SUM(oi.line_total_vat) as total_output_vat,
        SUM(oi.line_total_including_vat) as total_revenue_including_vat,
        oi.product_id,
        oi.product_name,
        oi.product_sku,
        SUM(oi.quantity) as total_quantity_sold,
        AVG(oi.unit_price_excluding_vat) as avg_unit_price
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.payment_status = 'paid'
        AND o.created_at >= ?
        AND o.created_at <= ?
      GROUP BY oi.product_id, oi.product_name, oi.product_sku
    `;

    const [revenueByProduct] = await db.pool.execute(query, [startDate, endDate]);

    // Get overall totals
    const totalQuery = `
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.subtotal_excluding_vat) as total_revenue_excluding_vat,
        SUM(o.total_vat_amount) as total_output_vat,
        SUM(o.total_amount - o.shipping_cost) as total_revenue_including_vat,
        SUM(o.discount_amount) as total_discounts,
        SUM(o.shipping_cost) as total_shipping
      FROM orders o
      WHERE o.payment_status = 'paid'
        AND o.created_at >= ?
        AND o.created_at <= ?
    `;

    const [totals] = await db.pool.execute(totalQuery, [startDate, endDate]);

    return {
      totals: totals[0],
      revenueByProduct
    };
  }

  /**
   * Calculate profit margins per product
   * Profit = (Selling Price - Cost Price) excluding VAT
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} Profit data per product
   */
  static async getProfitByProduct(startDate, endDate) {
    const query = `
      SELECT 
        oi.product_id,
        oi.product_name,
        oi.product_sku,
        p.cost_price_excluding_vat,
        SUM(oi.quantity) as total_quantity_sold,
        AVG(oi.unit_price_excluding_vat) as avg_selling_price_excluding_vat,
        SUM(oi.line_total_excluding_vat) as total_revenue_excluding_vat,
        SUM(oi.quantity * COALESCE(p.cost_price_excluding_vat, 0)) as total_cost_excluding_vat,
        SUM(oi.line_total_excluding_vat - (oi.quantity * COALESCE(p.cost_price_excluding_vat, 0))) as total_profit_excluding_vat,
        CASE 
          WHEN SUM(oi.line_total_excluding_vat) > 0 
          THEN ((SUM(oi.line_total_excluding_vat - (oi.quantity * COALESCE(p.cost_price_excluding_vat, 0))) / SUM(oi.line_total_excluding_vat)) * 100)
          ELSE 0 
        END as profit_margin_percentage
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.payment_status = 'paid'
        AND o.created_at >= ?
        AND o.created_at <= ?
      GROUP BY oi.product_id, oi.product_name, oi.product_sku, p.cost_price_excluding_vat
      ORDER BY total_profit_excluding_vat DESC
    `;

    const [profitData] = await db.pool.execute(query, [startDate, endDate]);

    // Calculate overall profit
    const totalQuery = `
      SELECT 
        SUM(oi.line_total_excluding_vat) as total_revenue_excluding_vat,
        SUM(oi.quantity * COALESCE(p.cost_price_excluding_vat, 0)) as total_cost_excluding_vat,
        SUM(oi.line_total_excluding_vat - (oi.quantity * COALESCE(p.cost_price_excluding_vat, 0))) as total_profit_excluding_vat
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.payment_status = 'paid'
        AND o.created_at >= ?
        AND o.created_at <= ?
    `;

    const [totals] = await db.pool.execute(totalQuery, [startDate, endDate]);

    const totalRevenue = parseFloat(totals[0].total_revenue_excluding_vat) || 0;
    const totalCost = parseFloat(totals[0].total_cost_excluding_vat) || 0;
    const totalProfit = parseFloat(totals[0].total_profit_excluding_vat) || 0;
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      profitByProduct: profitData,
      totals: {
        total_revenue_excluding_vat: totalRevenue.toFixed(2),
        total_cost_excluding_vat: totalCost.toFixed(2),
        total_profit_excluding_vat: totalProfit.toFixed(2),
        profit_margin_percentage: overallMargin.toFixed(2)
      }
    };
  }

  /**
   * Get comprehensive financial report
   * Combines revenue, expenses, and profit data
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Object>} Complete financial report
   */
  static async getFinancialReport(startDate, endDate) {
    // Get revenue data
    const revenue = await this.getRevenueSummary(startDate, endDate);

    // Get expense data
    const expenseQuery = `
      SELECT 
        COUNT(*) as total_expense_count,
        SUM(amount_excluding_vat) as total_expenses_excluding_vat,
        SUM(input_vat_amount) as total_input_vat,
        SUM(total_amount) as total_expenses_including_vat,
        category,
        SUM(amount_excluding_vat) as category_total
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ?
      GROUP BY category
    `;

    const [expensesByCategory] = await db.pool.execute(expenseQuery, [startDate, endDate]);

    // Get expense totals
    const expenseTotalQuery = `
      SELECT 
        COUNT(*) as total_expense_count,
        SUM(amount_excluding_vat) as total_expenses_excluding_vat,
        SUM(input_vat_amount) as total_input_vat,
        SUM(total_amount) as total_expenses_including_vat
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ?
    `;

    const [expenseTotals] = await db.pool.execute(expenseTotalQuery, [startDate, endDate]);

    // Get profit data
    const profit = await this.getProfitByProduct(startDate, endDate);

    // Calculate net VAT (Output VAT - Input VAT)
    const outputVAT = parseFloat(revenue.totals.total_output_vat) || 0;
    const inputVAT = parseFloat(expenseTotals[0].total_input_vat) || 0;
    const netVAT = outputVAT - inputVAT;

    // Calculate net profit (Gross Profit - Expenses)
    const grossProfit = parseFloat(profit.totals.total_profit_excluding_vat) || 0;
    const totalExpenses = parseFloat(expenseTotals[0].total_expenses_excluding_vat) || 0;
    const netProfit = grossProfit - totalExpenses;

    return {
      period: {
        start_date: startDate,
        end_date: endDate
      },
      revenue: {
        totals: revenue.totals,
        by_product: revenue.revenueByProduct
      },
      expenses: {
        totals: expenseTotals[0],
        by_category: expensesByCategory
      },
      profit: {
        gross_profit: profit.totals,
        by_product: profit.profitByProduct,
        net_profit: {
          gross_profit_excluding_vat: grossProfit.toFixed(2),
          total_expenses_excluding_vat: totalExpenses.toFixed(2),
          net_profit_excluding_vat: netProfit.toFixed(2)
        }
      },
      vat: {
        output_vat: outputVAT.toFixed(2),
        input_vat: inputVAT.toFixed(2),
        net_vat_payable: netVAT.toFixed(2)
      }
    };
  }

  /**
   * Get revenue by time period (daily, monthly, yearly)
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {string} groupBy - 'day', 'month', or 'year'
   * @returns {Promise<Array>} Revenue grouped by time period
   */
  static async getRevenueByPeriod(startDate, endDate, groupBy = 'month') {
    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'year':
        dateFormat = '%Y';
        break;
      case 'month':
      default:
        dateFormat = '%Y-%m';
        break;
    }

    const query = `
      SELECT 
        DATE_FORMAT(o.created_at, ?) as period,
        COUNT(DISTINCT o.id) as order_count,
        SUM(o.subtotal_excluding_vat) as revenue_excluding_vat,
        SUM(o.total_vat_amount) as output_vat,
        SUM(o.total_amount - o.shipping_cost) as revenue_including_vat,
        SUM(o.discount_amount) as total_discounts
      FROM orders o
      WHERE o.payment_status = 'paid'
        AND o.created_at >= ?
        AND o.created_at <= ?
      GROUP BY period
      ORDER BY period ASC
    `;

    const [results] = await db.pool.execute(query, [dateFormat, startDate, endDate]);
    return results;
  }

  /**
   * Get top selling products by revenue
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {number} limit - Number of products to return
   * @returns {Promise<Array>} Top products
   */
  static async getTopProducts(startDate, endDate, limit = 10) {
    const query = `
      SELECT 
        oi.product_id,
        oi.product_name,
        oi.product_sku,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.line_total_excluding_vat) as total_revenue_excluding_vat,
        SUM(oi.line_total_vat) as total_vat,
        SUM(oi.line_total_including_vat) as total_revenue_including_vat,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.payment_status = 'paid'
        AND o.created_at >= ?
        AND o.created_at <= ?
      GROUP BY oi.product_id, oi.product_name, oi.product_sku
      ORDER BY total_revenue_excluding_vat DESC
      LIMIT ?
    `;

    const [results] = await db.pool.execute(query, [startDate, endDate, limit]);
    return results;
  }

  /**
   * Export financial report to CSV format
   * @param {Object} report - Financial report data
   * @returns {string} CSV content
   */
  static exportToCSV(report) {
    let csv = '';

    // Header
    csv += `Financial Report\n`;
    csv += `Period: ${report.period.start_date} to ${report.period.end_date}\n\n`;

    // Revenue Summary
    csv += `Revenue Summary\n`;
    csv += `Total Orders,Revenue Excluding VAT,Output VAT,Revenue Including VAT,Discounts,Shipping\n`;
    csv += `${report.revenue.totals.total_orders},`;
    csv += `${report.revenue.totals.total_revenue_excluding_vat},`;
    csv += `${report.revenue.totals.total_output_vat},`;
    csv += `${report.revenue.totals.total_revenue_including_vat},`;
    csv += `${report.revenue.totals.total_discounts},`;
    csv += `${report.revenue.totals.total_shipping}\n\n`;

    // Revenue by Product
    csv += `Revenue by Product\n`;
    csv += `Product ID,Product Name,SKU,Quantity Sold,Revenue Excluding VAT,VAT,Revenue Including VAT\n`;
    report.revenue.by_product.forEach(product => {
      csv += `${product.product_id},`;
      csv += `"${product.product_name}",`;
      csv += `${product.product_sku},`;
      csv += `${product.total_quantity_sold},`;
      csv += `${product.total_revenue_excluding_vat},`;
      csv += `${product.total_output_vat},`;
      csv += `${product.total_revenue_including_vat}\n`;
    });

    csv += `\n`;

    // Expense Summary
    csv += `Expense Summary\n`;
    csv += `Total Expenses,Expenses Excluding VAT,Input VAT,Expenses Including VAT\n`;
    csv += `${report.expenses.totals.total_expense_count},`;
    csv += `${report.expenses.totals.total_expenses_excluding_vat},`;
    csv += `${report.expenses.totals.total_input_vat},`;
    csv += `${report.expenses.totals.total_expenses_including_vat}\n\n`;

    // Expenses by Category
    csv += `Expenses by Category\n`;
    csv += `Category,Amount Excluding VAT\n`;
    report.expenses.by_category.forEach(category => {
      csv += `${category.category || 'Uncategorized'},${category.category_total}\n`;
    });

    csv += `\n`;

    // Profit Summary
    csv += `Profit Summary\n`;
    csv += `Gross Profit Excluding VAT,Total Expenses Excluding VAT,Net Profit Excluding VAT\n`;
    csv += `${report.profit.net_profit.gross_profit_excluding_vat},`;
    csv += `${report.profit.net_profit.total_expenses_excluding_vat},`;
    csv += `${report.profit.net_profit.net_profit_excluding_vat}\n\n`;

    // VAT Summary
    csv += `VAT Summary\n`;
    csv += `Output VAT,Input VAT,Net VAT Payable\n`;
    csv += `${report.vat.output_vat},${report.vat.input_vat},${report.vat.net_vat_payable}\n`;

    return csv;
  }

  /**
   * Export financial report to JSON format
   * @param {Object} report - Financial report data
   * @returns {string} JSON content
   */
  static exportToJSON(report) {
    return JSON.stringify(report, null, 2);
  }
}

module.exports = FinancialService;
