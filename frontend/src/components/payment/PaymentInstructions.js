import React from 'react';
import './PaymentInstructions.css';

const PaymentInstructions = ({ paymentMethod, orderAmount }) => {
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  return (
    <div className="payment-instructions">
      <h3 className="payment-instructions-title">
        📋 ข้อมูลการชำระเงิน
      </h3>
      
      <div className="payment-amount">
        <span className="amount-label">ยอดที่ต้องชำระ:</span>
        <span className="amount-value">{formatAmount(orderAmount)}</span>
      </div>

      {paymentMethod === 'bank_transfer' && (
        <div className="payment-method-details">
          <h4 className="method-title">🏦 โอนเงินผ่านธนาคาร</h4>
          <div className="bank-details">
            <div className="detail-row">
              <span className="detail-label">ธนาคาร:</span>
              <span className="detail-value">ธนาคารกสิกรไทย (KBANK)</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">เลขที่บัญชี:</span>
              <span className="detail-value account-number">123-4-56789-0</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">ชื่อบัญชี:</span>
              <span className="detail-value">itkmmshop22</span>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === 'promptpay' && (
        <div className="payment-method-details">
          <h4 className="method-title">💳 พร้อมเพย์ (PromptPay)</h4>
          <div className="promptpay-details">
            <div className="detail-row">
              <span className="detail-label">เบอร์โทรศัพท์:</span>
              <span className="detail-value phone-number">0XX-XXX-XXXX</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">ชื่อบัญชี:</span>
              <span className="detail-value">itkmmshop22</span>
            </div>
          </div>
        </div>
      )}

      <div className="payment-instructions-note">
        <p className="note-icon">💡</p>
        <div className="note-content">
          <p className="note-title">หมายเหตุ:</p>
          <ul className="note-list">
            <li>กรุณาโอนเงินตามยอดที่ระบุด้านบน</li>
            <li>หลังจากโอนเงินแล้ว กรุณาอัปโหลดสลิปการโอนเงิน</li>
            <li>ระบบจะตรวจสอบการชำระเงินภายใน 24 ชั่วโมง</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentInstructions;
