import React from 'react';
import './CheckoutStepper.css';

const CheckoutStepper = ({ currentStep }) => {
  const steps = [
    { id: 1, label: 'ตะกร้าสินค้า', icon: '🛒' },
    { id: 2, label: 'ที่อยู่จัดส่ง', icon: '📍' },
    { id: 3, label: 'ตรวจสอบคำสั่งซื้อ', icon: '📋' },
    { id: 4, label: 'ชำระเงิน', icon: '💳' },
    { id: 5, label: 'เสร็จสิ้น', icon: '✓' }
  ];

  return (
    <div className="checkout-stepper">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className={`step ${currentStep >= step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
            <div className="step-icon">
              {currentStep > step.id ? '✓' : step.icon}
            </div>
            <div className="step-label">{step.label}</div>
          </div>
          
          {index < steps.length - 1 && (
            <div className={`step-connector ${currentStep > step.id ? 'completed' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CheckoutStepper;
