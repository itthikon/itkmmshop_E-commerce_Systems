import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import './AdminStyles.css';

const InventoryDashboard = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [stockUpdate, setStockUpdate] = useState({
    quantity: '',
    type: 'add',
    reason: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchStockHistory(selectedProduct.id);
    }
  }, [selectedProduct]);

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/alerts/low-stock');
      setLowStockProducts(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockHistory = async (productId) => {
    try {
      const response = await api.get(`/products/${productId}/stock-history`);
      setStockHistory(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch stock history:', err);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct) return;

    try {
      const quantity = parseInt(stockUpdate.quantity);
      const finalQuantity = stockUpdate.type === 'add' ? quantity : -quantity;

      await api.post(`/products/${selectedProduct.id}/stock`, {
        quantity: finalQuantity,
        reason: stockUpdate.reason
      });

      // Refresh data
      await fetchLowStockProducts();
      await fetchStockHistory(selectedProduct.id);
      
      // Update selected product
      const updatedProduct = lowStockProducts.find(p => p.id === selectedProduct.id);
      if (updatedProduct) {
        setSelectedProduct({
          ...selectedProduct,
          stock_quantity: updatedProduct.stock_quantity
        });
      }

      // Reset form
      setStockUpdate({
        quantity: '',
        type: 'add',
        reason: ''
      });

      alert('อัปเดตสต็อกสำเร็จ');
    } catch (err) {
      alert('ไม่สามารถอัปเดตสต็อกได้: ' + (err.message || 'เกิดข้อผิดพลาด'));
    }
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

  if (loading) {
    return <div className="loading">กำลังโหลด...</div>;
  }

  return (
    <div className="inventory-dashboard">
      <div className="dashboard-header">
        <h2>แดชบอร์ดจัดการสต็อก</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        <div className="low-stock-section">
          <h3>สินค้าสต็อกต่ำ ({lowStockProducts.length})</h3>
          
          {lowStockProducts.length === 0 ? (
            <div className="no-data">✓ ไม่มีสินค้าสต็อกต่ำ</div>
          ) : (
            <div className="low-stock-list">
              {lowStockProducts.map(product => (
                <div
                  key={product.id}
                  className={`low-stock-item ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="product-info">
                    <div className="product-name">{product.name}</div>
                    <div className="product-sku">SKU: {product.sku}</div>
                  </div>
                  <div className="stock-info">
                    <div className={`stock-quantity ${product.stock_quantity === 0 ? 'out-of-stock' : 'low'}`}>
                      {product.stock_quantity} {product.stock_quantity === 0 ? '(หมด)' : ''}
                    </div>
                    <div className="stock-threshold">
                      เกณฑ์: {product.low_stock_threshold}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div className="stock-management-section">
            <div className="selected-product-header">
              <h3>{selectedProduct.name}</h3>
              <div className="current-stock">
                สต็อกปัจจุบัน: <strong>{selectedProduct.stock_quantity}</strong>
              </div>
            </div>

            <form onSubmit={handleStockUpdate} className="stock-update-form">
              <h4>อัปเดตสต็อก</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label>ประเภท</label>
                  <select
                    value={stockUpdate.type}
                    onChange={(e) => setStockUpdate(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    <option value="add">เพิ่มสต็อก</option>
                    <option value="remove">ลดสต็อก</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>จำนวน</label>
                  <input
                    type="number"
                    value={stockUpdate.quantity}
                    onChange={(e) => setStockUpdate(prev => ({ ...prev, quantity: e.target.value }))}
                    min="1"
                    required
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>เหตุผล</label>
                <input
                  type="text"
                  value={stockUpdate.reason}
                  onChange={(e) => setStockUpdate(prev => ({ ...prev, reason: e.target.value }))}
                  required
                  placeholder="เช่น รับสินค้าเข้า, สินค้าชำรุด"
                />
              </div>

              <button type="submit" className="btn btn-primary">
                อัปเดตสต็อก
              </button>
            </form>

            <div className="stock-history-section">
              <h4>ประวัติการเปลี่ยนแปลงสต็อก</h4>
              
              {stockHistory.length === 0 ? (
                <div className="no-data">ไม่มีประวัติ</div>
              ) : (
                <div className="history-list">
                  {stockHistory.map((history, index) => (
                    <div key={index} className="history-item">
                      <div className="history-date">{formatDate(history.created_at)}</div>
                      <div className="history-details">
                        <span className={`quantity-change ${history.quantity_change > 0 ? 'positive' : 'negative'}`}>
                          {history.quantity_change > 0 ? '+' : ''}{history.quantity_change}
                        </span>
                        <span className="history-reason">{history.reason}</span>
                      </div>
                      <div className="history-stock">
                        สต็อกก่อน: {history.quantity_before} → หลัง: {history.quantity_after}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryDashboard;
