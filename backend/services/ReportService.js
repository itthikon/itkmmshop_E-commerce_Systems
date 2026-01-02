const Transaction = require('../models/Transaction');
const TransactionCategory = require('../models/TransactionCategory');
const db = require('../config/database');

/**
 * ReportService
 * Business logic for generating financial reports
 */
class ReportService {
  /**
   * Generate Profit & Loss report
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Profit & Loss report data
   */
  static async generateProfitLoss(startDate, endDate) {
    // Get all income transactions
    const incomeTransactions = await Transaction.getIncomeByPeriod(startDate, endDate);
    
    // Get all expense transactions
    const expenseTransactions = await Transaction.getExpenseByPeriod(startDate, endDate);

    // Group income by category
    const incomeByCategory = {};
    let totalIncome = 0;

    incomeTransactions.forEach(transaction => {
      const categoryName = transaction.category_name || 'Uncategorized';
      const amount = parseFloat(transaction.amount);
      
      if (!incomeByCategory[categoryName]) {
        incomeByCategory[categoryName] = {
          category_id: transaction.category_id,
          category_name: categoryName,
          total: 0,
          transactions: []
        };
      }
      
      incomeByCategory[categoryName].total += amount;
      incomeByCategory[categoryName].transactions.push(transaction);
      totalIncome += amount;
    });

    // Group expenses by category
    const expensesByCategory = {};
    let totalExpenses = 0;

    expenseTransactions.forEach(transaction => {
      const categoryName = transaction.category_name || 'Uncategorized';
      const amount = parseFloat(transaction.amount);
      
      if (!expensesByCategory[categoryName]) {
        expensesByCategory[categoryName] = {
          category_id: transaction.category_id,
          category_name: categoryName,
          total: 0,
          transactions: []
        };
      }
      
      expensesByCategory[categoryName].total += Math.abs(amount); // Use absolute value
      expensesByCategory[categoryName].transactions.push(transaction);
      totalExpenses += Math.abs(amount);
    });

    // Calculate net profit
    const netProfit = totalIncome - totalExpenses;

    return {
      period: {
        start_date: startDate,
        end_date: endDate
      },
      income: {
        by_category: Object.values(incomeByCategory),
        total: totalIncome
      },
      expenses: {
        by_category: Object.values(expensesByCategory),
        total: totalExpenses
      },
      net_profit: netProfit,
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Generate Cash Flow report
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {string} groupBy - Grouping period: 'daily', 'weekly', 'monthly'
   * @returns {Promise<Object>} Cash flow report data
   */
  static async generateCashFlow(startDate, endDate, groupBy = 'daily') {
    // Get opening balance from settings
    const AccountingSettings = require('../models/AccountingSettings');
    let openingBalance = 0;
    try {
      const openingBalanceSetting = await AccountingSettings.get('opening_balance');
      if (openingBalanceSetting && openingBalanceSetting.setting_value) {
        openingBalance = parseFloat(openingBalanceSetting.setting_value);
        if (isNaN(openingBalance)) {
          openingBalance = 0;
        }
      }
    } catch (error) {
      // If setting doesn't exist, default to 0
      openingBalance = 0;
    }

    // Get all transactions in period
    const incomeTransactions = await Transaction.getIncomeByPeriod(startDate, endDate);
    const expenseTransactions = await Transaction.getExpenseByPeriod(startDate, endDate);

    // Calculate totals
    const totalInflows = incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalOutflows = expenseTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    const closingBalance = openingBalance + totalInflows - totalOutflows;

    // Group transactions by date
    const cashFlowByPeriod = this._groupTransactionsByPeriod(
      [...incomeTransactions, ...expenseTransactions],
      groupBy
    );

    // Calculate running balance
    let runningBalance = openingBalance;
    const cashFlowData = cashFlowByPeriod.map(period => {
      const periodInflows = period.transactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const periodOutflows = period.transactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
      
      const periodNetChange = periodInflows - periodOutflows;
      runningBalance += periodNetChange;

      return {
        period: period.period,
        opening_balance: runningBalance - periodNetChange,
        inflows: periodInflows,
        outflows: periodOutflows,
        net_change: periodNetChange,
        closing_balance: runningBalance
      };
    });

    return {
      period: {
        start_date: startDate,
        end_date: endDate,
        group_by: groupBy
      },
      opening_balance: openingBalance,
      total_inflows: totalInflows,
      total_outflows: totalOutflows,
      closing_balance: closingBalance,
      cash_flow_by_period: cashFlowData,
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Get dashboard summary
   * @param {number} month - Month (1-12)
   * @param {number} year - Year (YYYY)
   * @returns {Promise<Object>} Dashboard summary data
   */
  static async getDashboardSummary(month, year) {
    // Calculate date range for current month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    // Calculate previous month for comparison
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
    const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${prevLastDay}`;

    // Get current month data
    const totalIncome = await Transaction.getTotalIncome(startDate, endDate);
    const totalExpenses = await Transaction.getTotalExpenses(startDate, endDate);
    const netProfit = totalIncome - totalExpenses;

    // Get previous month data for comparison
    const prevTotalIncome = await Transaction.getTotalIncome(prevStartDate, prevEndDate);
    const prevTotalExpenses = await Transaction.getTotalExpenses(prevStartDate, prevEndDate);
    const prevNetProfit = prevTotalIncome - prevTotalExpenses;

    // Calculate growth percentages
    const incomeGrowth = prevTotalIncome > 0 
      ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 
      : 0;
    const expensesGrowth = prevTotalExpenses > 0 
      ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 
      : 0;
    const profitGrowth = prevNetProfit !== 0 
      ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100 
      : 0;

    // Get income and expense breakdown
    const incomeBreakdown = await this.getIncomeBreakdown(startDate, endDate);
    const expenseBreakdown = await this.getExpenseBreakdown(startDate, endDate);

    // Get recent transactions
    const recentTransactions = await Transaction.findAll({
      start_date: startDate,
      end_date: endDate,
      sort_by: 'transaction_date',
      sort_order: 'DESC',
      limit: 10,
      page: 1
    });

    return {
      period: {
        month,
        year,
        start_date: startDate,
        end_date: endDate
      },
      current_month: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_profit: netProfit
      },
      previous_month: {
        total_income: prevTotalIncome,
        total_expenses: prevTotalExpenses,
        net_profit: prevNetProfit
      },
      growth: {
        income_growth_percentage: parseFloat(incomeGrowth.toFixed(2)),
        expenses_growth_percentage: parseFloat(expensesGrowth.toFixed(2)),
        profit_growth_percentage: parseFloat(profitGrowth.toFixed(2))
      },
      top_expense_categories: expenseBreakdown.slice(0, 5),
      income_breakdown: incomeBreakdown,
      recent_transactions: recentTransactions.transactions,
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Get income breakdown by category
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Income breakdown by category
   */
  static async getIncomeBreakdown(startDate, endDate) {
    const query = `
      SELECT 
        tc.id as category_id,
        tc.name as category_name,
        COUNT(t.id) as transaction_count,
        SUM(t.amount) as total_amount
      FROM transactions t
      JOIN transaction_categories tc ON t.category_id = tc.id
      WHERE t.transaction_type = 'income'
        AND t.transaction_date >= ?
        AND t.transaction_date <= ?
        AND t.deleted_at IS NULL
      GROUP BY tc.id, tc.name
      ORDER BY total_amount DESC
    `;

    const [rows] = await db.pool.execute(query, [startDate, endDate]);
    
    return rows.map(row => ({
      category_id: row.category_id,
      category_name: row.category_name,
      transaction_count: row.transaction_count,
      total_amount: parseFloat(row.total_amount)
    }));
  }

  /**
   * Get expense breakdown by category
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Expense breakdown by category
   */
  static async getExpenseBreakdown(startDate, endDate) {
    const query = `
      SELECT 
        tc.id as category_id,
        tc.name as category_name,
        COUNT(t.id) as transaction_count,
        SUM(ABS(t.amount)) as total_amount
      FROM transactions t
      JOIN transaction_categories tc ON t.category_id = tc.id
      WHERE t.transaction_type = 'expense'
        AND t.transaction_date >= ?
        AND t.transaction_date <= ?
        AND t.deleted_at IS NULL
      GROUP BY tc.id, tc.name
      ORDER BY total_amount DESC
    `;

    const [rows] = await db.pool.execute(query, [startDate, endDate]);
    
    return rows.map(row => ({
      category_id: row.category_id,
      category_name: row.category_name,
      transaction_count: row.transaction_count,
      total_amount: parseFloat(row.total_amount)
    }));
  }

  /**
   * Helper: Group transactions by period
   * @private
   */
  static _groupTransactionsByPeriod(transactions, groupBy) {
    const groups = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
      let periodKey;

      switch (groupBy) {
        case 'daily':
          periodKey = transaction.transaction_date;
          break;
        case 'weekly':
          // Get week number
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          periodKey = transaction.transaction_date;
      }

      if (!groups[periodKey]) {
        groups[periodKey] = {
          period: periodKey,
          transactions: []
        };
      }

      groups[periodKey].transactions.push(transaction);
    });

    // Sort by period
    return Object.values(groups).sort((a, b) => {
      const periodA = String(a.period);
      const periodB = String(b.period);
      return periodA.localeCompare(periodB);
    });
  }
}

module.exports = ReportService;
