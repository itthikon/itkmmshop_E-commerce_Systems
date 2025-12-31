import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {currentYear} itkmmshop. สงวนลิขสิทธิ์.</p>
        <p className="text-sm mt-sm">
          ระบบสั่งซื้อสินค้าออนไลน์แบบครบวงจร พร้อมระบบคำนวณ VAT อัตโนมัติ
        </p>
      </div>
    </footer>
  );
};

export default Footer;
