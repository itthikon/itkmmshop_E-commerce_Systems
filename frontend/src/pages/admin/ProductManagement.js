import React, { useState } from 'react';
import ProductList from '../../components/admin/ProductList';
import ProductForm from '../../components/admin/ProductForm';
import InventoryDashboard from '../../components/admin/InventoryDashboard';
import '../../components/admin/AdminStyles.css';

const ProductManagement = () => {
  const [view, setView] = useState('list'); // 'list', 'form', 'inventory'
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleAddNew = () => {
    setSelectedProduct(null);
    setView('form');
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setView('form');
  };

  const handleSave = () => {
    setView('list');
    setSelectedProduct(null);
  };

  const handleCancel = () => {
    setView('list');
    setSelectedProduct(null);
  };

  const handleDelete = () => {
    // Refresh handled by ProductList component
  };

  return (
    <div className="product-management-page">
      <div className="page-header">
        <h1>จัดการสินค้า</h1>
        <div className="header-actions">
          <button
            onClick={() => setView('list')}
            className={`btn ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          >
            รายการสินค้า
          </button>
          <button
            onClick={() => setView('inventory')}
            className={`btn ${view === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
          >
            จัดการสต็อก
          </button>
          {view === 'list' && (
            <button
              onClick={handleAddNew}
              className="btn btn-success"
            >
              + เพิ่มสินค้าใหม่
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {view === 'list' && (
          <ProductList
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {view === 'form' && (
          <ProductForm
            product={selectedProduct}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {view === 'inventory' && (
          <InventoryDashboard />
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
