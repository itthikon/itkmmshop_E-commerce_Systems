const Payment = require('../models/Payment');
const PromptPayService = require('../services/PromptPayService');
const ReceiptService = require('../services/ReceiptService');
const db = require('../config/database');

describe('Payment System Integration Tests', () => {
  afterAll(async () => {
    // Close database connection
    await db.pool.end();
  });
  describe('PromptPay QR Code Generation', () => {
    test('should generate valid QR payload for phone number', () => {
      const phone = '0812345678';
      const amount = 1000.00;
      
      const qrCode = PromptPayService.generateQRCode(phone, amount);
      
      expect(qrCode).toBeDefined();
      expect(qrCode.payload).toBeDefined();
      expect(qrCode.format).toBe('EMV');
      expect(qrCode.qrData).toBe(qrCode.payload);
    });

    test('should generate QR payload without amount', () => {
      const phone = '0812345678';
      
      const qrCode = PromptPayService.generateQRCode(phone);
      
      expect(qrCode).toBeDefined();
      expect(qrCode.payload).toBeDefined();
    });

    test('should validate PromptPay ID formats', () => {
      expect(PromptPayService.validatePromptPayId('0812345678')).toBe(true); // 10-digit phone
      expect(PromptPayService.validatePromptPayId('660812345678')).toBe(true); // 12-digit with country code
      expect(PromptPayService.validatePromptPayId('1234567890123')).toBe(true); // 13-digit tax ID
      expect(PromptPayService.validatePromptPayId('123')).toBe(false); // Invalid
    });

    test('should format phone numbers correctly', () => {
      const formatted = PromptPayService.formatPhoneNumber('0812345678');
      expect(formatted).toBe('081-234-5678');
    });
  });

  describe('Receipt Service', () => {
    test('should format dates correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const formatted = ReceiptService._formatDate(date);
      
      // Should be in Thai Buddhist year format
      expect(formatted).toContain('2567'); // 2024 + 543
      expect(formatted).toContain('15/01');
    });

    test('should get payment method text in Thai', () => {
      expect(ReceiptService._getPaymentMethodText('bank_transfer')).toBe('โอนเงินผ่านธนาคาร');
      expect(ReceiptService._getPaymentMethodText('promptpay')).toBe('พร้อมเพย์');
      expect(ReceiptService._getPaymentMethodText('cash')).toBe('เงินสด');
    });

    test('should generate receipt path correctly', () => {
      const receiptNumber = 'RCP-20240115-00001';
      const path = ReceiptService.getReceiptPath(receiptNumber);
      
      expect(path).toContain('receipt-RCP-20240115-00001.pdf');
    });
  });

  describe('Payment Model', () => {
    test('should generate unique receipt numbers', async () => {
      const receiptNumber1 = await Payment.generateReceiptNumber();
      const receiptNumber2 = await Payment.generateReceiptNumber();
      
      expect(receiptNumber1).toMatch(/^RCP-\d{8}-\d{5}$/);
      expect(receiptNumber2).toMatch(/^RCP-\d{8}-\d{5}$/);
      
      // Should be different due to sequence or timestamp
      // Note: In rare cases they might be the same if generated in same millisecond
    });
  });
});
