import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import './AdminStyles.css';

const OrderList = ({ onViewDetails }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.payment_status) params.append('payment_status', filters.payment_status);
      if (filters.search) params.append('search', filters.search);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      const response = await api.get(`/orders?${params.toString()}`);
      setOrders(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'pending': 'status-pending',
      'paid': 'status-paid',
      'packing': 'status-packing',
      'packed': 'status-packed',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return statusMap[status] || '';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'รอชำระเงิน',
      'paid': 'ชำระเงินแล้ว',
      'packing': 'กำลังแพ็ค',
      'packed': 'แพ็คเสร็จแล้ว',
      'shipped': 'จัดส่งแล้ว',
      'delivered': 'ส่งถึงแล้ว',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusText = (status) => {
    const statusMap = {
      'pending': 'รอชำระ',
      'paid': 'ชำระแล้ว',
      'failed': 'ล้มเหลว'
    };
    return statusMap[status] || status;
  };

  if (loading && orders.length === 0) {
    return <div className="loading">กำลังโหลด...</div>;
  }

  return (
    <div className="order-list-container">
      <div className="order-list-header">
        <h2>จัดการคำสั่งซื้อ</h2>
      </div>

      <div className="filters-section">
        <input
          type="text"
          placeholder="ค้นหาเลขคำสั่งซื้อ, ชื่อลูกค้า..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="search-input"
        />
        
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="filter-select"
        >
          <option value="">ทุกสถานะ</option>
          <option value="pending">รอชำระเงิน</option>
          <option value="paid">ชำระเงินแล้ว</option>
          <option value="packing">กำลังแพ็ค</option>
          <option value="packed">แพ็คเสร็จแล้ว</option>
          <option value="shipped">จัดส่งแล้ว</option>
          <option value="delivered">ส่งถึงแล้ว</option>
          <option value="cancelled">ยกเลิก</option>
        </select>

        <select
          value={filters.payment_status}
          onChange={(e) => handleFilterChange('payment_status', e.target.value)}
          className="filter-select"
        >
          <option value="">สถานะการชำระทั้งหมด</option>
          <option value="pending">รอชำระ</option>
          <option value="paid">ชำระแล้ว</option>
          <option value="failed">ล้มเหลว</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="filter-select"
        >
          <option value="created_at">วันที่สั่งซื้อ</option>
          <option value="total_amount">ยอดรวม</option>
          <option value="order_number">เลขคำสั่งซื้อ</option>
        </select>

        <select
          value={filters.sortOrder}
          onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
          className="filter-select"
        >
          <option value="desc">ล่าสุด</option>
          <option value="asc">เก่าสุด</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>เลขคำสั่งซื้อ</th>
              <th>วันที่</th>
              <th>ลูกค้า</th>
              <th>แพลตฟอร์ม</th>
              <th>ยอดรวม</th>
              <th>สถานะการชำระ</th>
              <th>สถานะคำสั่งซื้อ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">ไม่พบข้อมูลคำสั่งซื้อ</td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id}>
                  <td className="order-number">{order.order_number}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>
                    {order.user_id ? (
                      <div>
                        <div>{order.user_name || 'สมาชิก'}</div>
                        <div className="customer-email">{order.user_email}</div>
                      </div>
                    ) : (
                      <div>
                        <div>{order.guest_name || 'ลูกค้าทั่วไป'}</div>
                        <div className="customer-email">{order.guest_email || order.guest_phone}</div>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="platform-badge">{order.source_platform || 'website'}</span>
                  </td>
                  <td className="price-cell">{formatPrice(order.total_amount)}</td>
                  <td>
                    <span className={`status-badge payment-${order.payment_status}`}>
                      {getPaymentStatusText(order.payment_status)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => onViewDetails(order)}
                      className="btn btn-primary btn-sm"
                    >
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;
