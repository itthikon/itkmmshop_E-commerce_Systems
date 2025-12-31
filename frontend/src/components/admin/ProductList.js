import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import './AdminStyles.css';

const ProductList = ({ onEdit, onDelete }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchLowStockAlerts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      const response = await api.get(`/products?${params.toString()}`);
      setProducts(response.data.data.products || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const response = await api.get('/products/alerts/low-stock');
      setLowStockAlerts(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch low stock alerts:', err);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleDelete = async (productId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?')) {
      try {
        await api.delete(`/products/${productId}`);
        fetchProducts();
        fetchLowStockAlerts();
        if (onDelete) onDelete(productId);
      } catch (err) {
        alert('ไม่สามารถลบสินค้าได้: ' + (err.message || 'เกิดข้อผิดพลาด'));
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
  };

  if (loading && products.length === 0) {
    return <div className="loading">กำลังโหลด...</div>;
  }

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <h2>จัดการสินค้า</h2>
        {lowStockAlerts.length > 0 && (
          <div className="alert alert-warning">
            <strong>⚠️ แจ้งเตือน:</strong> มีสินค้า {lowStockAlerts.length} รายการที่สต็อกต่ำ
          </div>
        )}
      </div>

      <div className="filters-section">
        <input
          type="text"
          placeholder="ค้นหาสินค้า..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="search-input"
        />
        
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="filter-select"
        >
          <option value="">ทุกหมวดหมู่</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="filter-select"
        >
          <option value="">ทุกสถานะ</option>
          <option value="active">ใช้งาน</option>
          <option value="inactive">ไม่ใช้งาน</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="filter-select"
        >
          <option value="created_at">วันที่สร้าง</option>
          <option value="name">ชื่อสินค้า</option>
          <option value="price_including_vat">ราคา</option>
          <option value="stock_quantity">สต็อก</option>
        </select>

        <select
          value={filters.sortOrder}
          onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
          className="filter-select"
        >
          <option value="desc">มากไปน้อย</option>
          <option value="asc">น้อยไปมาก</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>รูปภาพ</th>
              <th>SKU</th>
              <th>ชื่อสินค้า</th>
              <th>หมวดหมู่</th>
              <th>ราคา (ไม่รวม VAT)</th>
              <th>VAT</th>
              <th>ราคา (รวม VAT)</th>
              <th>สต็อก</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">ไม่พบข้อมูลสินค้า</td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product.id} className={product.stock_quantity <= (product.low_stock_threshold || 10) ? 'low-stock-row' : ''}>
                  <td>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="product-thumbnail" />
                    ) : (
                      <div className="no-image">ไม่มีรูป</div>
                    )}
                  </td>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.category_name || '-'}</td>
                  <td className="price-cell">{formatPrice(product.price_excluding_vat)}</td>
                  <td className="vat-cell">{formatPrice(product.vat_amount)}</td>
                  <td className="price-cell total">{formatPrice(product.price_including_vat)}</td>
                  <td className={`stock-cell ${product.stock_quantity <= (product.low_stock_threshold || 10) ? 'low-stock' : ''}`}>
                    {product.stock_quantity}
                    {product.stock_quantity <= (product.low_stock_threshold || 10) && ' ⚠️'}
                  </td>
                  <td>
                    <span className={`status-badge ${product.status}`}>
                      {product.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => onEdit(product)}
                      className="btn btn-edit"
                      title="แก้ไข"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="btn btn-delete"
                      title="ลบ"
                    >
                      🗑️
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

export default ProductList;
