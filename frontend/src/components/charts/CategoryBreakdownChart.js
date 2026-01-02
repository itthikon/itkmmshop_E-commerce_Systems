import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './CategoryBreakdownChart.css';

const CategoryBreakdownChart = ({ data, title = 'รายจ่ายตามหมวดหมู่' }) => {
  // Color palette for categories
  const COLORS = [
    '#f44336', // Red
    '#e91e63', // Pink
    '#9c27b0', // Purple
    '#673ab7', // Deep Purple
    '#3f51b5', // Indigo
    '#2196f3', // Blue
    '#03a9f4', // Light Blue
    '#00bcd4', // Cyan
    '#009688', // Teal
    '#4caf50', // Green
    '#8bc34a', // Light Green
    '#cddc39', // Lime
    '#ffeb3b', // Yellow
    '#ffc107', // Amber
    '#ff9800', // Orange
    '#ff5722', // Deep Orange
  ];

  // Transform data for the chart
  const chartData = data && Array.isArray(data) ? data.map(item => ({
    name: item.category_name || item.name,
    value: parseFloat(item.total_amount || item.value || 0)
  })).filter(item => item.value > 0) : [];

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
      const data = payload[0];
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <div className="tooltip-item">
            <span className="tooltip-name">จำนวนเงิน:</span>
            <span className="tooltip-value">{formatCurrency(data.value)}</span>
          </div>
          <div className="tooltip-item">
            <span className="tooltip-name">สัดส่วน:</span>
            <span className="tooltip-value">{percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is greater than 5%
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="category-breakdown-chart">
        <h3 className="chart-title">{title}</h3>
        <div className="empty-state">
          <p>ไม่มีข้อมูลในช่วงเวลานี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="category-breakdown-chart">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => {
              const total = chartData.reduce((sum, item) => sum + item.value, 0);
              const percentage = total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : 0;
              return `${value} (${percentage}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryBreakdownChart;
