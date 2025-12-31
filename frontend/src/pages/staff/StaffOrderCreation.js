import React, { useState } from 'react';
import StaffOrderForm from '../../components/staff/StaffOrderForm';
import '../../components/admin/AdminStyles.css';

const StaffOrderCreation = () => {
  const [orderCreated, setOrderCreated] = useState(null);

  const handleSuccess = (order) => {
    setOrderCreated(order);
  };

  const handleCreateAnother = () => {
    setOrderCreated(null);
  };

  return (
    <div className="staff-order-creation-page">
      <div className="page-header">
        <h1>สร้างคำสั่งซื้อให้ลูกค้า</h1>
      </div>

      <div className="page-content">
        {orderCreated ? (
          <div className="order-success-container">
            <div className="success-icon">✓</div>
            <h2>สร้างคำสั่งซื้อสำเร็จ!</h2>
            <div className="order-details">
              <p>เลขคำสั่งซื้อ: <strong>{orderCreated.order_number}</strong></p>
              <p>ลูกค้า: <strong>{orderCreated.customer_name}</strong></p>
              <p>ยอดรวม: <strong>
                {new Intl.NumberFormat('th-TH', {
                  style: 'currency',
                  currency: 'THB'
                }).format(orderCreated.total_amount)}
              </strong></p>
            </div>
            <div className="success-actions">
              <button
                onClick={handleCreateAnother}
                className="btn btn-primary"
              >
                สร้างคำสั่งซื้อใหม่
              </button>
              <button
                onClick={() => window.location.href = '/admin/orders'}
                className="btn btn-secondary"
              >
                ดูรายการคำสั่งซื้อ
              </button>
            </div>
          </div>
        ) : (
          <StaffOrderForm
            onSuccess={handleSuccess}
            onCancel={() => window.history.back()}
          />
        )}
      </div>
    </div>
  );
};

export default StaffOrderCreation;
