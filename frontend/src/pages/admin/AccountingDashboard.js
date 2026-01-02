import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AccountingDashboard.css';
import IncomeExpenseChart from '../../components/charts/IncomeExpenseChart';
import CategoryBreakdownChart from '../../components/charts/CategoryBreakdownChart';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

const AccountingDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/accounting/reports/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.error || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionTypeLabel = (type) => {
    return type === 'income' ? 'รายรับ' : 'รายจ่าย';
  };

  const getTransactionTypeClass = (type) => {
    return type === 'income' ? 'income' : 'expense';
  };

  const calculateGrowthPercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  if (loading) {
    return <div className="loading">กำลังโหลดข้อมูล...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchDashboardData} className="btn btn-primary">
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="error-message">ไม่พบข้อมูล</div>;
  }

  // Map backend structure to frontend expectations
  const summary = {
    totalIncome: dashboardData.current_month?.total_income || 0,
    totalExpenses: dashboardData.current_month?.total_expenses || 0,
    netProfit: dashboardData.current_month?.net_profit || 0
  };

  const comparison = dashboardData.growth ? {
    incomeGrowth: dashboardData.growth.income_growth_percentage || 0,
    expenseGrowth: dashboardData.growth.expenses_growth_percentage || 0,
    profitGrowth: dashboardData.growth.profit_growth_percentage || 0
  } : null;

  const topExpenseCategories = dashboardData.top_expense_categories || [];
  const recentTransactions = dashboardData.recent_transactions || [];

  return (
    <div className="accounting-dashboard">
      <div className="dashboard-header">
        <h1>ภาพรวมบัญชีร้านค้า</h1>
        <p className="dashboard-subtitle">ข้อมูลประจำเดือน {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card income-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>รายรับรวม</h3>
            <p className="card-value">{formatCurrency(summary.totalIncome || 0)}</p>
            {comparison && (
              <p className={`card-growth ${comparison.incomeGrowth >= 0 ? 'positive' : 'negative'}`}>
                {comparison.incomeGrowth >= 0 ? '↑' : '↓'} {Math.abs(comparison.incomeGrowth)}% จากเดือนที่แล้ว
              </p>
            )}
          </div>
        </div>

        <div className="summary-card expense-card">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <h3>รายจ่ายรวม</h3>
            <p className="card-value">{formatCurrency(summary.totalExpenses || 0)}</p>
            {comparison && (
              <p className={`card-growth ${comparison.expenseGrowth >= 0 ? 'negative' : 'positive'}`}>
                {comparison.expenseGrowth >= 0 ? '↑' : '↓'} {Math.abs(comparison.expenseGrowth)}% จากเดือนที่แล้ว
              </p>
            )}
          </div>
        </div>

        <div className="summary-card profit-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>กำไรสุทธิ</h3>
            <p className={`card-value ${(summary.netProfit || 0) >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(summary.netProfit || 0)}
            </p>
            {comparison && (
              <p className={`card-growth ${comparison.profitGrowth >= 0 ? 'positive' : 'negative'}`}>
                {comparison.profitGrowth >= 0 ? '↑' : '↓'} {Math.abs(comparison.profitGrowth)}% จากเดือนที่แล้ว
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Income vs Expense Chart */}
      <div className="dashboard-section">
        <h2>เปรียบเทียบรายรับ-รายจ่าย</h2>
        <IncomeExpenseChart data={summary} />
      </div>

      {/* Top Expense Categories */}
      {topExpenseCategories && topExpenseCategories.length > 0 && (
        <div className="dashboard-section">
          <h2>รายจ่ายสูงสุด 5 อันดับ</h2>
          <div className="dashboard-charts-row">
            <div className="expense-categories">
              {topExpenseCategories.map((category, index) => (
                <div key={index} className="category-item">
                  <div className="category-info">
                    <span className="category-rank">#{index + 1}</span>
                    <span className="category-name">{category.category_name}</span>
                  </div>
                  <div className="category-amount">
                    {formatCurrency(category.total_amount)}
                  </div>
                </div>
              ))}
            </div>
            <div className="expense-chart">
              <CategoryBreakdownChart 
                data={topExpenseCategories} 
                title="สัดส่วนรายจ่าย"
              />
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recentTransactions && recentTransactions.length > 0 && (
        <div className="dashboard-section">
          <h2>รายการล่าสุด</h2>
          <div className="transactions-table-container">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>ประเภท</th>
                  <th>หมวดหมู่</th>
                  <th>รายละเอียด</th>
                  <th className="text-right">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDate(transaction.transaction_date)}</td>
                    <td>
                      <span className={`transaction-type ${getTransactionTypeClass(transaction.transaction_type)}`}>
                        {getTransactionTypeLabel(transaction.transaction_type)}
                      </span>
                    </td>
                    <td>{transaction.category_name}</td>
                    <td className="transaction-description">
                      {transaction.description || '-'}
                    </td>
                    <td className={`text-right ${getTransactionTypeClass(transaction.transaction_type)}`}>
                      {transaction.transaction_type === 'income' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!recentTransactions || recentTransactions.length === 0) && (
        <div className="dashboard-section">
          <div className="empty-state">
            <p>ยังไม่มีรายการธุรกรรม</p>
            <p className="empty-state-subtitle">เริ่มต้นบันทึกรายรับ-รายจ่ายของคุณได้เลย</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingDashboard;
