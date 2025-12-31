import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import './AdminStyles.css';

const ProductForm = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category_id: '',
    price_excluding_vat: '',
    vat_rate: '7.00',
    cost_price_excluding_vat: '',
    cost_vat_amount: '',
    stock_quantity: '0',
    low_stock_threshold: '10',
    status: 'active'
  });
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calculatedVAT, setCalculatedVAT] = useState({
    vat_amount: 0,
    price_including_vat: 0
  });

  useEffect(() => {
    fetchCategories();
    if (product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        description: product.description || '',
        category_id: product.category_id || '',
        price_excluding_vat: product.price_excluding_vat || '',
        vat_rate: product.vat_rate || '7.00',
        cost_price_excluding_vat: product.cost_price_excluding_vat || '',
        cost_vat_amount: product.cost_vat_amount || '',
        stock_quantity: product.stock_quantity || '0',
        low_stock_threshold: product.low_stock_threshold || '10',
        status: product.status || 'active'
      });
      if (product.image_url) {
        setImagePreview(product.image_url);
      }
    }
  }, [product]);

  useEffect(() => {
    // Auto-calculate VAT when price or rate changes
    if (formData.price_excluding_vat && formData.vat_rate) {
      const price = parseFloat(formData.price_excluding_vat);
      const rate = parseFloat(formData.vat_rate);
      const vatAmount = (price * rate) / 100;
      const priceIncludingVat = price + vatAmount;
      
      setCalculatedVAT({
        vat_amount: vatAmount.toFixed(2),
        price_including_vat: priceIncludingVat.toFixed(2)
      });
    }
  }, [formData.price_excluding_vat, formData.vat_rate]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let savedProduct;
      
      if (product) {
        // Update existing product
        const response = await api.put(`/products/${product.id}`, formData);
        savedProduct = response.data.data;
      } else {
        // Create new product
        const response = await api.post('/products', formData);
        savedProduct = response.data.data;
      }

      // Upload image if selected
      if (imageFile && savedProduct) {
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);
        await api.post(`/products/${savedProduct.id}/image`, imageFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      if (onSave) {
        onSave(savedProduct);
      }
    } catch (err) {
      setError(err.message || 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
  };

  return (
    <div className="product-form-container">
      <div className="form-header">
        <h2>{product ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="sku">SKU *</label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              disabled={!!product}
              placeholder="เช่น PROD-001"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">ชื่อสินค้า *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="ชื่อสินค้า"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">รายละเอียด</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="รายละเอียดสินค้า"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category_id">หมวดหมู่ *</label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">สถานะ</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">ใช้งาน</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select>
          </div>
        </div>

        <div className="pricing-section">
          <h3>ข้อมูลราคา</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price_excluding_vat">ราคาขาย (ไม่รวม VAT) *</label>
              <input
                type="number"
                id="price_excluding_vat"
                name="price_excluding_vat"
                value={formData.price_excluding_vat}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="vat_rate">อัตรา VAT (%)</label>
              <input
                type="number"
                id="vat_rate"
                name="vat_rate"
                value={formData.vat_rate}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="100"
                placeholder="7.00"
              />
            </div>
          </div>

          {formData.price_excluding_vat && (
            <div className="vat-calculation-display">
              <div className="calc-row">
                <span>ราคาไม่รวม VAT:</span>
                <strong>{formatPrice(formData.price_excluding_vat)}</strong>
              </div>
              <div className="calc-row vat-highlight">
                <span>VAT ({formData.vat_rate}%):</span>
                <strong>{formatPrice(calculatedVAT.vat_amount)}</strong>
              </div>
              <div className="calc-row total">
                <span>ราคารวม VAT:</span>
                <strong>{formatPrice(calculatedVAT.price_including_vat)}</strong>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cost_price_excluding_vat">ราคาทุน (ไม่รวม VAT)</label>
              <input
                type="number"
                id="cost_price_excluding_vat"
                name="cost_price_excluding_vat"
                value={formData.cost_price_excluding_vat}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cost_vat_amount">VAT ต้นทุน</label>
              <input
                type="number"
                id="cost_vat_amount"
                name="cost_vat_amount"
                value={formData.cost_vat_amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="inventory-section">
          <h3>ข้อมูลสต็อก</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stock_quantity">จำนวนสต็อก *</label>
              <input
                type="number"
                id="stock_quantity"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                min="0"
                required
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="low_stock_threshold">แจ้งเตือนสต็อกต่ำ</label>
              <input
                type="number"
                id="low_stock_threshold"
                name="low_stock_threshold"
                value={formData.low_stock_threshold}
                onChange={handleChange}
                min="0"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        <div className="image-section">
          <h3>รูปภาพสินค้า</h3>
          
          <div className="form-group">
            <label htmlFor="image">เลือกรูปภาพ</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-cancel"
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
