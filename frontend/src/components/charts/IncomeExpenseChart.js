import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './IncomeExpenseChart.css';

const IncomeExpenseChart = ({ data }) => {
  // Transform data for the chart
  const chartData = data ? [
    {
      name: 'รายรับ-รายจ่าย',
      รายรับ: data.totalIncome || 0,
      รายจ่าย: data.totalExpenses || 0
    }
  ] : [];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item">
              <span className="tooltip-label" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="tooltip-value">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="income-expense-chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#666' }}
            axisLine={{ stroke: '#ccc' }}
          />
          <YAxis 
            tick={{ fill: '#666' }}
            axisLine={{ stroke: '#ccc' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="square"
          />
          <Bar 
            dataKey="รายรับ" 
            fill="#4caf50" 
            radius={[8, 8, 0, 0]}
            maxBarSize={100}
          />
          <Bar 
            dataKey="รายจ่าย" 
            fill="#f44336" 
            radius={[8, 8, 0, 0]}
            maxBarSize={100}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeExpenseChart;
