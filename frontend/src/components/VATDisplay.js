import React from 'react';

/**
 * VATDisplay Component - Displays VAT information with consistent highlighting
 * @param {Object} props
 * @param {number} props.priceExcludingVAT - Price without VAT
 * @param {number} props.vatAmount - VAT amount
 * @param {number} props.priceIncludingVAT - Total price with VAT
 * @param {boolean} props.inline - Display inline or as a section
 * @param {boolean} props.detailed - Show detailed breakdown
 */
const VATDisplay = ({ 
  priceExcludingVAT, 
  vatAmount, 
  priceIncludingVAT,
  inline = false,
  detailed = true
}) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
  };

  if (inline) {
    return (
      <span className="vat-highlight" data-tooltip="รวม VAT 7%">
        {formatPrice(priceIncludingVAT)}
      </span>
    );
  }

  if (!detailed) {
    return (
      <div className="flex-between gap-md">
        <span className="text-secondary">ราคารวม VAT:</span>
        <span className="vat-highlight">{formatPrice(priceIncludingVAT)}</span>
      </div>
    );
  }

  return (
    <div className="vat-section fade-in">
      <div className="vat-label mb-sm">รายละเอียดภาษี VAT</div>
      <div className="flex-column gap-sm">
        <div className="flex-between">
          <span className="text-secondary">ราคาไม่รวม VAT:</span>
          <span className="font-semibold">{formatPrice(priceExcludingVAT)}</span>
        </div>
        <div className="flex-between">
          <span className="text-secondary">VAT 7%:</span>
          <span className="vat-highlight">{formatPrice(vatAmount)}</span>
        </div>
        <div className="divider"></div>
        <div className="flex-between">
          <span className="font-semibold">ราคารวม VAT:</span>
          <span className="font-bold text-lg vat-highlight">
            {formatPrice(priceIncludingVAT)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VATDisplay;
