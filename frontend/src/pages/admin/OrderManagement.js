import React, { useState } from 'react';
import OrderList from '../../components/admin/OrderList';
import OrderDetails from '../../components/admin/OrderDetails';
import '../../components/admin/AdminStyles.css';

const OrderManagement = () => {
  const [view, setView] = useState('list'); // 'list', 'details'
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setView('details');
  };

  const handleBack = () => {
    setView('list');
    setSelectedOrder(null);
  };

  const handleUpdate = () => {
    // Refresh will be handled by OrderDetails component
  };

  return (
    <div className="order-management-page">
      <div className="page-header">
        <h1>จัดการคำสั่งซื้อ</h1>
      </div>

      <div className="page-content">
        {view === 'list' && (
          <OrderList onViewDetails={handleViewDetails} />
        )}

        {view === 'details' && selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onBack={handleBack}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
