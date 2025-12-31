import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import './AdminStyles.css';

const OrderDetails = ({ order, onBack, onUpdate }) => {
  const [orderData, setOrderData] = useState(order);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({
    status: order.status,
    tracking_number: order.tracking_number || ''
  });
  const [packingMedia, setPackingMedia] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [order.id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/orders/${order.id}`);
      setOrderData(response.data.data);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setLoading(true);
      setError(null);

      await api.put(`/orders/${orderData.id}/status`, {
        status: statusUpdate.status
      });

      if (statusUpdate.tracking_number && statusUpdate.tracking_number !== orderData.tracking_number) {
        await api.put(`/orders/${orderData.id}/tracking`, {
          tracking_number: statusUpdate.tracking_number
        });
      }

      await fetchOrderDetails();
      if (onUpdate) onUpdate();
      alert('อัปเดตสถานะสำเร็จ');
    } catch (err) {
      setError(err.message || 'ไม่สามารถอัปเดตสถานะได้');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = async (e) => {
    e.preventDefault();
    if (!packingMedia) return;

    try {
      setUploadingMedia(true);
      const formData = new FormData();
      formData.append('media', packingMedia);

      await api.post(`/orders/${orderData.id}/packing-media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      await fetchOrderDetails();
      setPackingMedia(null);
      alert('อัปโหลดไฟล์สำเร็จ');
    } catch (err) {
      alert('ไม่สามารถอัปโหลดไฟล์ได้: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setUploadingMedia(false);
    }
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="order-details-container">
      <div className="details-header">
        <button onClick={onBack} className="btn btn-secondary">
          ← กลับ
        </button>
        <h2>รายละเอียดคำสั่งซื้อ #{orderData.order_number}</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="details-content">
        <div className="details-section">
          <h3>ข้อมูลคำสั่งซื้อ</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>เลขคำสั่งซื้อ:</label>
              <span>{orderData.order_number}</span>
            </div>
            <div className="info-item">
              <label>วันที่สั่งซื้อ:</label>
              <span>{formatDate(orderData.created_at)}</span>
            </div>
            <div className="info-item">
              <label>แพลตฟอร์ม:</label>
              <span className="platform-badge">{orderData.source_platform || 'website'}</span>
            </div>
            <div className="info-item">
              <label>สถานะปัจจุบัน:</label>
              <span className="status-badge">{getStatusText(orderData.status)}</span>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3>ข้อมูลลูกค้า</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>ชื่อ:</label>
              <span>{orderData.user_id ? orderData.user_name : orderData.guest_name}</span>
            </div>
            <div className="info-item">
              <label>อีเมล:</label>
              <span>{orderData.user_id ? orderData.user_email : orderData.guest_email}</span>
            </div>
            <div className="info-item">
              <label>เบอร์โทร:</label>
              <span>{orderData.user_id ? orderData.user_phone : orderData.guest_phone}</span>
            </div>
            <div className="info-item full-width">
              <label>ที่อยู่จัดส่ง:</label>
              <span>{orderData.shipping_address}</span>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3>รายการสินค้า</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>ราคา/หน่วย (ไม่รวม VAT)</th>
                <th>VAT/หน่วย</th>
                <th>ราคา/หน่วย (รวม VAT)</th>
                <th>จำนวน</th>
                <th>รวม</th>
              </tr>
            </thead>
            <tbody>
              {orderData.items && orderData.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.product_name}</td>
                  <td className="price-cell">{formatPrice(item.unit_price_excluding_vat)}</td>
                  <td className="vat-cell">{formatPrice(item.unit_vat_amount)}</td>
                  <td className="price-cell">{formatPrice(item.unit_price_including_vat)}</td>
                  <td className="quantity-cell">{item.quantity}</td>
                  <td className="price-cell total">{formatPrice(item.line_total_including_vat)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="order-summary">
            <div className="summary-row">
              <span>ยอดรวม (ไม่รวม VAT):</span>
              <strong>{formatPrice(orderData.subtotal_excluding_vat)}</strong>
            </div>
            <div className="summary-row vat-highlight">
              <span>VAT รวม:</span>
              <strong>{formatPrice(orderData.total_vat_amount)}</strong>
            </div>
            {orderData.discount_amount > 0 && (
              <div className="summary-row discount">
                <span>ส่วนลด:</span>
                <strong>-{formatPrice(orderData.discount_amount)}</strong>
              </div>
            )}
            {orderData.shipping_cost > 0 && (
              <div className="summary-row">
                <span>ค่าจัดส่ง:</span>
                <strong>{formatPrice(orderData.shipping_cost)}</strong>
              </div>
            )}
            <div className="summary-row total">
              <span>ยอดรวมทั้งหมด:</span>
              <strong>{formatPrice(orderData.total_amount)}</strong>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3>อัปเดตสถานะคำสั่งซื้อ</h3>
          <div className="status-update-form">
            <div className="form-row">
              <div className="form-group">
                <label>สถานะ:</label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                  className="form-control"
                >
                  <option value="pending">รอชำระเงิน</option>
                  <option value="paid">ชำระเงินแล้ว</option>
                  <option value="packing">กำลังแพ็ค</option>
                  <option value="packed">แพ็คเสร็จแล้ว</option>
                  <option value="shipped">จัดส่งแล้ว</option>
                  <option value="delivered">ส่งถึงแล้ว</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>

              <div className="form-group">
                <label>เลขพัสดุ:</label>
                <input
                  type="text"
                  value={statusUpdate.tracking_number}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, tracking_number: e.target.value }))}
                  placeholder="กรอกเลขพัสดุ"
                  className="form-control"
                />
              </div>
            </div>

            <button
              onClick={handleStatusUpdate}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'กำลังอัปเดต...' : 'อัปเดตสถานะ'}
            </button>
          </div>
        </div>

        <div className="details-section">
          <h3>อัปโหลดรูป/วิดีโอการแพ็ค</h3>
          <form onSubmit={handleMediaUpload} className="media-upload-form">
            <div className="form-group">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setPackingMedia(e.target.files[0])}
                className="form-control"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!packingMedia || uploadingMedia}
            >
              {uploadingMedia ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
            </button>
          </form>

          {orderData.packing_media && orderData.packing_media.length > 0 && (
            <div className="packing-media-list">
              <h4>ไฟล์ที่อัปโหลดแล้ว:</h4>
              <div className="media-grid">
                {orderData.packing_media.map((media, index) => (
                  <div key={index} className="media-item">
                    {media.type === 'image' ? (
                      <img src={media.url} alt={`Packing ${index + 1}`} />
                    ) : (
                      <video src={media.url} controls />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
