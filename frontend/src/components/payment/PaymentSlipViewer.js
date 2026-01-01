import React, { useState, useCallback, useMemo } from 'react';
import './PaymentSlipViewer.css';

const PaymentSlipViewer = React.memo(({ 
  payment, 
  order, 
  onClose, 
  onVerify, 
  onReject, 
  isStaff = false 
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  // Mouse wheel zoom support
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (!onVerify) return;
    setIsProcessing(true);
    try {
      await onVerify(payment.id);
    } finally {
      setIsProcessing(false);
    }
  }, [onVerify, payment.id]);

  const handleRejectClick = useCallback(() => {
    setShowRejectModal(true);
  }, []);

  const handleRejectConfirm = useCallback(async () => {
    if (!rejectionReason.trim()) {
      alert('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }
    if (!onReject) return;
    
    setIsProcessing(true);
    try {
      await onReject(payment.id, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
    } finally {
      setIsProcessing(false);
    }
  }, [onReject, payment.id, rejectionReason]);

  const handleRejectCancel = useCallback(() => {
    setShowRejectModal(false);
    setRejectionReason('');
  }, []);

  const formatAmount = useCallback((amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const statusBadge = useMemo(() => {
    const badges = {
      pending: { text: 'รอตรวจสอบ', className: 'status-pending' },
      verified: { text: 'ยืนยันแล้ว', className: 'status-verified' },
      rejected: { text: 'ปฏิเสธ', className: 'status-rejected' }
    };
    return badges[payment.status] || badges.pending;
  }, [payment.status]);

  return (
    <div 
      className="payment-slip-viewer-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewer-title"
    >
      <div className="payment-slip-viewer" onClick={(e) => e.stopPropagation()}>
        <button 
          className="viewer-close-btn" 
          onClick={onClose}
          aria-label="ปิดหน้าต่างดูสลิป"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose();
            }
          }}
        >
          ✕
        </button>

        <div className="viewer-content">
          {/* Left side - Slip Image */}
          <div className="viewer-image-section">
            <div className="viewer-zoom-controls">
              <button 
                onClick={handleZoomOut} 
                disabled={zoomLevel <= 0.5}
                aria-label="ซูมออก"
                title="ซูมออก (Ctrl + Scroll Down)"
              >
                🔍−
              </button>
              <button 
                onClick={handleResetZoom}
                aria-label={`ระดับการซูม ${Math.round(zoomLevel * 100)} เปอร์เซ็นต์`}
                title="รีเซ็ตการซูม"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button 
                onClick={handleZoomIn} 
                disabled={zoomLevel >= 3}
                aria-label="ซูมเข้า"
                title="ซูมเข้า (Ctrl + Scroll Up)"
              >
                🔍+
              </button>
            </div>

            <div 
              className="viewer-image-container"
              onWheel={handleWheel}
            >
              <img
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${payment.slip_image_path}`}
                alt="สลิปการชำระเงิน"
                className="viewer-slip-image"
                style={{ transform: `scale(${zoomLevel})` }}
                role="img"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right side - Order Details */}
          <div className="viewer-details-section">
            <h2 className="viewer-title" id="viewer-title">รายละเอียดการชำระเงิน</h2>

            <div className="viewer-status">
              <span className={`status-badge ${statusBadge.className}`}>
                {statusBadge.text}
              </span>
            </div>

            <div className="viewer-info-group">
              <h3 className="info-group-title">ข้อมูลคำสั่งซื้อ</h3>
              <div className="info-row">
                <span className="info-label">เลขที่คำสั่งซื้อ:</span>
                <span className="info-value">{order.order_number}</span>
              </div>
              <div className="info-row">
                <span className="info-label">ชื่อลูกค้า:</span>
                <span className="info-value">{order.customer_name || payment.customer_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">ยอดชำระ:</span>
                <span className="info-value amount">{formatAmount(payment.amount)}</span>
              </div>
            </div>

            <div className="viewer-info-group">
              <h3 className="info-group-title">ข้อมูลการชำระเงิน</h3>
              <div className="info-row">
                <span className="info-label">วิธีการชำระ:</span>
                <span className="info-value">
                  {payment.payment_method === 'bank_transfer' ? 'โอนเงินผ่านธนาคาร' : 'พร้อมเพย์'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">วันที่อัปโหลด:</span>
                <span className="info-value">{formatDate(payment.created_at)}</span>
              </div>
              {payment.verified_at && (
                <div className="info-row">
                  <span className="info-label">วันที่ตรวจสอบ:</span>
                  <span className="info-value">{formatDate(payment.verified_at)}</span>
                </div>
              )}
              {payment.verifier_name && (
                <div className="info-row">
                  <span className="info-label">ตรวจสอบโดย:</span>
                  <span className="info-value">{payment.verifier_name}</span>
                </div>
              )}
            </div>

            {payment.rejection_reason && (
              <div className="viewer-info-group rejection-info">
                <h3 className="info-group-title">เหตุผลในการปฏิเสธ</h3>
                <p className="rejection-reason">{payment.rejection_reason}</p>
              </div>
            )}

            {payment.notes && (
              <div className="viewer-info-group">
                <h3 className="info-group-title">หมายเหตุ</h3>
                <p className="notes-text">{payment.notes}</p>
              </div>
            )}

            {/* Action Buttons for Staff */}
            {isStaff && payment.status === 'pending' && (
              <div className="viewer-actions">
                <button
                  className="btn-verify"
                  onClick={handleVerify}
                  disabled={isProcessing}
                  aria-label="ยืนยันการชำระเงิน"
                >
                  {isProcessing ? 'กำลังดำเนินการ...' : '✓ ยืนยันการชำระเงิน'}
                </button>
                <button
                  className="btn-reject"
                  onClick={handleRejectClick}
                  disabled={isProcessing}
                  aria-label="ปฏิเสธการชำระเงิน"
                >
                  ✕ ปฏิเสธ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rejection Modal */}
        {showRejectModal && (
          <div 
            className="reject-modal-overlay" 
            onClick={handleRejectCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-modal-title"
          >
            <div className="reject-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="reject-modal-title" id="reject-modal-title">ปฏิเสธการชำระเงิน</h3>
              <p className="reject-modal-description">
                กรุณาระบุเหตุผลในการปฏิเสธสลิปการชำระเงิน
              </p>
              <textarea
                className="reject-reason-input"
                placeholder="เช่น: ยอดเงินไม่ตรง, สลิปไม่ชัดเจน, ข้อมูลไม่ครบถ้วน..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                autoFocus
                aria-label="เหตุผลในการปฏิเสธ"
                aria-required="true"
              />
              <div className="reject-modal-actions">
                <button
                  className="btn-cancel"
                  onClick={handleRejectCancel}
                  disabled={isProcessing}
                  aria-label="ยกเลิกการปฏิเสธ"
                >
                  ยกเลิก
                </button>
                <button
                  className="btn-confirm-reject"
                  onClick={handleRejectConfirm}
                  disabled={isProcessing}
                  aria-label="ยืนยันการปฏิเสธการชำระเงิน"
                >
                  {isProcessing ? 'กำลังดำเนินการ...' : 'ยืนยันการปฏิเสธ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

PaymentSlipViewer.displayName = 'PaymentSlipViewer';

export default PaymentSlipViewer;
