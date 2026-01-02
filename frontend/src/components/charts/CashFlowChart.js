import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './CashFlowChart.css';

const CashFlowChart = ({ data }) => {
  // Transform data for the chart
  const chartData = data && data.cashFlowByPeriod ? data.cashFlowByPeriod.map(period => ({
    period: period.period_label,
    เงินเข้า: period.total_inflow || 0,
    เงินออก: period.total_outflow || 0,
    สุทธิ: (period.total_inflow || 0) - (period.total_outflow || 0)
  })) : [];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item">
              <span className="tooltip-name" style={{ color: entry.color }}>
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
    <div className="cash-flow-chart">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="period" 
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={{ stroke: '#ccc' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fill: '#666' }}
            axisLine={{ stroke: '#ccc' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="เงินเข้า" 
            stroke="#4caf50" 
            strokeWidth={2}
            dot={{ fill: '#4caf50', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="เงินออก" 
            stroke="#f44336" 
            strokeWidth={2}
            dot={{ fill: '#f44336', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="สุทธิ" 
            stroke="#2196f3" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#2196f3', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;
