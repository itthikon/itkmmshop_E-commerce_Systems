import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import '../admin/AdminStyles.css';

const StaffOrderForm = ({ onSuccess, onCancel }) => {
  const [products, setProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    source_platform: 'website'
  });
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?status=active');
      setProducts(response.data.data.products || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleAddProduct = (product) => {
    const existing = selectedProducts.find(p => p.id === product.id);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p =>
        p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    } else {
      setSelectedProducts(selectedProducts.map(p =>
        p.id === productId ? { ...p, quantity: parseInt(quantity) } : p
      ));
    }
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode) return;

    try {
      const response = await api.post('/vouchers/validate', {
        code: voucherCode,
        subtotal: calculateSubtotal()
      });

      if (response.data.success) {
        setAppliedVoucher(response.data.data);
        setError(null);
      }
    } catch (err) {
      setError('โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ');
      setAppliedVoucher(null);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
  };

  const calculateSubtotal = () => {
    return selectedProducts.reduce((sum, product) => {
      return sum + (parseFloat(product.price_excluding_vat) * product.quantity);
    }, 0);
  };

  const calculateTotalVAT = () => {
    return selectedProducts.reduce((sum, product) => {
      return sum + (parseFloat(product.vat_amount) * product.quantity);
    }, 0);
  };

  const calculateDiscount = () => {
    if (!appliedVoucher) return 0;

    const subtotal = calculateSubtotal();
    if (appliedVoucher.discount_type === 'percentage') {
      const discount = (subtotal * appliedVoucher.discount_value) / 100;
      return appliedVoucher.max_discount_amount
        ? Math.min(discount, appliedVoucher.max_discount_amount)
        : discount;
    } else {
      return appliedVoucher.discount_value;
    }
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const vat = calculateTotalVAT();
    const discount = calculateDiscount();
    const shipping = parseFloat(shippingCost) || 0;
    return subtotal + vat - discount + shipping;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      setError('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const orderData = {
        customer_info: customerInfo,
        items: selectedProducts.map(p => ({
          product_id: p.id,
          quantity: p.quantity,
          unit_price_excluding_vat: p.price_excluding_vat,
          vat_rate: p.vat_rate,
          unit_vat_amount: p.vat_amount,
          unit_price_including_vat: p.price_including_vat
        })),
        voucher_code: appliedVoucher ? voucherCode : null,
        shipping_cost: parseFloat(shippingCost) || 0,
        source_platform: customerInfo.source_platform
      };

      const response = await api.post('/orders/direct', orderData);
      
      if (onSuccess) {
        onSuccess(response.data.data);
      }
    } catch (err) {
      setError(err.message || 'ไม่สามารถสร้างคำสั่งซื้อได้');
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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="staff-order-form-container">
      <div className="form-header">
        <h2>สร้างคำสั่งซื้อให้ลูกค้า</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="staff-order-form">
        <div className="form-section">
          <h3>ข้อมูลลูกค้า</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">ชื่อ-นามสกุล *</label>
              <input
                type="text"
                id="name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                required
                placeholder="ชื่อ-นามสกุลลูกค้า"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">เบอร์โทร *</label>
              <input
                type="tel"
                id="phone"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                required
                placeholder="0812345678"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">อีเมล</label>
              <input
                type="email"
                id="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="source_platform">แพลตฟอร์ม *</label>
              <select
                id="source_platform"
                value={customerInfo.source_platform}
                onChange={(e) => setCustomerInfo({ ...customerInfo, source_platform: e.target.value })}
                required
              >
                <option value="website">เว็บไซต์</option>
                <option value="facebook">Facebook</option>
                <option value="line">LINE</option>
                <option value="instagram">Instagram</option>
                <option value="shopee">Shopee</option>
                <option value="lazada">Lazada</option>
                <option value="phone">โทรศัพท์</option>
                <option value="walk-in">หน้าร้าน</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">ที่อยู่จัดส่ง *</label>
            <textarea
              id="address"
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
              required
              rows="3"
              placeholder="ที่อยู่สำหรับจัดส่งสินค้า"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>เลือกสินค้า</h3>
          
          <div className="product-search">
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="product-selection-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-card-image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} />
                  ) : (
                    <div className="no-image">ไม่มีรูป</div>
                  )}
                </div>
                <div className="product-card-info">
                  <div className="product-card-name">{product.name}</div>
                  <div className="product-card-sku">SKU: {product.sku}</div>
                  <div className="product-card-price">
                    {formatPrice(product.price_including_vat)}
                  </div>
                  <div className="product-card-stock">
                    สต็อก: {product.stock_quantity}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddProduct(product)}
                  className="btn btn-primary btn-sm"
                  disabled={product.stock_quantity <= 0}
                >
                  เพิ่ม
                </button>
              </div>
            ))}
          </div>
        </div>

        {selectedProducts.length > 0 && (
          <div className="form-section">
            <h3>สินค้าที่เลือก</h3>
            <table className="selected-products-table">
              <thead>
                <tr>
                  <th>สินค้า</th>
                  <th>ราคา/หน่วย</th>
                  <th>VAT/หน่วย</th>
                  <th>จำนวน</th>
                  <th>รวม</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map(product => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td className="price-cell">{formatPrice(product.price_excluding_vat)}</td>
                    <td className="vat-cell">{formatPrice(product.vat_amount)}</td>
                    <td>
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => handleUpdateQuantity(product.id, e.target.value)}
                        min="1"
                        max={product.stock_quantity}
                        className="quantity-input"
                      />
                    </td>
                    <td className="price-cell total">
                      {formatPrice((parseFloat(product.price_excluding_vat) + parseFloat(product.vat_amount)) * product.quantity)}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product.id)}
                        className="btn btn-delete btn-sm"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="form-section">
          <h3>ส่วนลดและค่าจัดส่ง</h3>
          
          <div className="voucher-section">
            <label>โค้ดส่วนลด:</label>
            <div className="voucher-input-group">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="กรอกโค้ดส่วนลด"
                disabled={!!appliedVoucher}
              />
              {appliedVoucher ? (
                <button
                  type="button"
                  onClick={handleRemoveVoucher}
                  className="btn btn-secondary"
                >
                  ยกเลิก
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  className="btn btn-primary"
                >
                  ใช้
                </button>
              )}
            </div>
            {appliedVoucher && (
              <div className="voucher-applied">
                ✓ ใช้ส่วนลด: {appliedVoucher.name} (-{formatPrice(calculateDiscount())})
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="shipping_cost">ค่าจัดส่ง:</label>
            <input
              type="number"
              id="shipping_cost"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>

        {selectedProducts.length > 0 && (
          <div className="order-summary-section">
            <h3>สรุปคำสั่งซื้อ</h3>
            <div className="order-summary">
              <div className="summary-row">
                <span>ยอดรวม (ไม่รวม VAT):</span>
                <strong>{formatPrice(calculateSubtotal())}</strong>
              </div>
              <div className="summary-row vat-highlight">
                <span>VAT รวม:</span>
                <strong>{formatPrice(calculateTotalVAT())}</strong>
              </div>
              {appliedVoucher && (
                <div className="summary-row discount">
                  <span>ส่วนลด:</span>
                  <strong>-{formatPrice(calculateDiscount())}</strong>
                </div>
              )}
              {shippingCost > 0 && (
                <div className="summary-row">
                  <span>ค่าจัดส่ง:</span>
                  <strong>{formatPrice(shippingCost)}</strong>
                </div>
              )}
              <div className="summary-row total">
                <span>ยอดรวมทั้งหมด:</span>
                <strong>{formatPrice(calculateTotal())}</strong>
              </div>
            </div>
          </div>
        )}

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
            className="btn btn-success"
            disabled={loading || selectedProducts.length === 0}
          >
            {loading ? 'กำลังสร้างคำสั่งซื้อ...' : 'สร้างคำสั่งซื้อ'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StaffOrderForm;
