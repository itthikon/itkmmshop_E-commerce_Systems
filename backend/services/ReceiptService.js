const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Receipt Service
 * Generates PDF receipts with VAT breakdown
 */
class ReceiptService {
  /**
   * Generate receipt PDF for an order
   * @param {Object} order - Order object with items
   * @param {Object} payment - Payment object
   * @returns {Promise<string>} Path to generated PDF
   */
  static async generateReceipt(order, payment) {
    return new Promise((resolve, reject) => {
      try {
        // Create receipts directory if it doesn't exist
        const receiptsDir = path.join(__dirname, '../uploads/receipts');
        if (!fs.existsSync(receiptsDir)) {
          fs.mkdirSync(receiptsDir, { recursive: true });
        }

        // Generate filename
        const filename = `receipt-${payment.receipt_number}.pdf`;
        const filepath = path.join(receiptsDir, filename);

        // Create PDF document
        const doc = new PDFDocument({ 
          size: 'A4',
          margin: 50,
          info: {
            Title: `Receipt ${payment.receipt_number}`,
            Author: 'itkmmshop'
          }
        });

        // Pipe to file
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Add content
        this._addHeader(doc, order, payment);
        this._addCustomerInfo(doc, order);
        this._addItemsTable(doc, order);
        this._addTotals(doc, order);
        this._addFooter(doc, payment);

        // Finalize PDF
        doc.end();

        // Wait for file to be written
        stream.on('finish', () => {
          resolve(filepath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add header to receipt
   * @private
   */
  static _addHeader(doc, order, payment) {
    // Shop name and logo
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('itkmmshop', 50, 50);

    doc.fontSize(10)
       .font('Helvetica')
       .text('ร้านค้าออนไลน์', 50, 80)
       .text('โทร: ' + (process.env.SHOP_PHONE || '-'), 50, 95)
       .text('อีเมล: ' + (process.env.SHOP_EMAIL || '-'), 50, 110);

    // Receipt title
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('ใบเสร็จรับเงิน / RECEIPT', 350, 50, { align: 'right' });

    // Receipt details
    doc.fontSize(10)
       .font('Helvetica')
       .text(`เลขที่ใบเสร็จ: ${payment.receipt_number}`, 350, 80, { align: 'right' })
       .text(`วันที่: ${this._formatDate(payment.receipt_generated_at)}`, 350, 95, { align: 'right' })
       .text(`เลขที่คำสั่งซื้อ: ${order.order_number}`, 350, 110, { align: 'right' });

    // Line separator
    doc.moveTo(50, 140)
       .lineTo(545, 140)
       .stroke();
  }

  /**
   * Add customer information
   * @private
   */
  static _addCustomerInfo(doc, order) {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('ข้อมูลลูกค้า / Customer Information', 50, 160);

    const customerName = order.user_id ? 
      `${order.guest_name || 'ลูกค้า'}` : 
      order.guest_name;

    doc.fontSize(10)
       .font('Helvetica')
       .text(`ชื่อ: ${customerName}`, 50, 180)
       .text(`โทร: ${order.guest_phone || '-'}`, 50, 195)
       .text(`อีเมล: ${order.guest_email || '-'}`, 50, 210);

    doc.text('ที่อยู่จัดส่ง:', 50, 225)
       .text(order.shipping_address, 50, 240, { width: 495 });
  }

  /**
   * Add items table
   * @private
   */
  static _addItemsTable(doc, order) {
    const tableTop = 290;
    
    // Table header
    doc.fontSize(10)
       .font('Helvetica-Bold');

    doc.text('รายการ', 50, tableTop)
       .text('จำนวน', 250, tableTop, { width: 50, align: 'center' })
       .text('ราคา/หน่วย', 310, tableTop, { width: 70, align: 'right' })
       .text('VAT/หน่วย', 390, tableTop, { width: 60, align: 'right' })
       .text('รวม', 460, tableTop, { width: 85, align: 'right' });

    // Line under header
    doc.moveTo(50, tableTop + 15)
       .lineTo(545, tableTop + 15)
       .stroke();

    // Table rows
    doc.font('Helvetica');
    let yPosition = tableTop + 25;

    order.items.forEach((item, index) => {
      // Check if we need a new page
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      const priceExVAT = parseFloat(item.unit_price_excluding_vat);
      const vatAmount = parseFloat(item.unit_vat_amount);
      const lineTotal = parseFloat(item.line_total_including_vat);

      doc.text(item.product_name, 50, yPosition, { width: 190 })
         .text(item.quantity.toString(), 250, yPosition, { width: 50, align: 'center' })
         .text(priceExVAT.toFixed(2), 310, yPosition, { width: 70, align: 'right' })
         .text(vatAmount.toFixed(2), 390, yPosition, { width: 60, align: 'right' })
         .text(lineTotal.toFixed(2), 460, yPosition, { width: 85, align: 'right' });

      yPosition += 20;
    });

    // Line after items
    doc.moveTo(50, yPosition + 5)
       .lineTo(545, yPosition + 5)
       .stroke();

    return yPosition + 15;
  }

  /**
   * Add totals section
   * @private
   */
  static _addTotals(doc, order) {
    const totalsTop = 500;
    
    doc.fontSize(10)
       .font('Helvetica');

    const subtotal = parseFloat(order.subtotal_excluding_vat);
    const totalVAT = parseFloat(order.total_vat_amount);
    const discount = parseFloat(order.discount_amount);
    const shipping = parseFloat(order.shipping_cost);
    const total = parseFloat(order.total_amount);

    let yPos = totalsTop;

    // Subtotal (excluding VAT)
    doc.text('ยอดรวม (ไม่รวม VAT):', 350, yPos)
       .text(subtotal.toFixed(2), 460, yPos, { width: 85, align: 'right' });
    yPos += 20;

    // VAT
    doc.text('VAT 7%:', 350, yPos)
       .text(totalVAT.toFixed(2), 460, yPos, { width: 85, align: 'right' });
    yPos += 20;

    // Discount (if any)
    if (discount > 0) {
      doc.text('ส่วนลด:', 350, yPos)
         .text(`-${discount.toFixed(2)}`, 460, yPos, { width: 85, align: 'right' });
      yPos += 20;
    }

    // Shipping (if any)
    if (shipping > 0) {
      doc.text('ค่าจัดส่ง:', 350, yPos)
         .text(shipping.toFixed(2), 460, yPos, { width: 85, align: 'right' });
      yPos += 20;
    }

    // Line before total
    doc.moveTo(350, yPos)
       .lineTo(545, yPos)
       .stroke();
    yPos += 10;

    // Grand total
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('ยอดรวมทั้งสิ้น:', 350, yPos)
       .text(`${total.toFixed(2)} บาท`, 460, yPos, { width: 85, align: 'right' });
  }

  /**
   * Add footer
   * @private
   */
  static _addFooter(doc, payment) {
    const footerTop = 680;

    doc.fontSize(10)
       .font('Helvetica')
       .text('วิธีการชำระเงิน: ' + this._getPaymentMethodText(payment.payment_method), 50, footerTop)
       .text('สถานะการชำระเงิน: ชำระเงินแล้ว', 50, footerTop + 15);

    if (payment.transfer_date) {
      doc.text('วันที่โอนเงิน: ' + this._formatDate(payment.transfer_date), 50, footerTop + 30);
    }

    // Thank you message
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('ขอบคุณที่ใช้บริการ', 50, footerTop + 60, { align: 'center' });

    // Footer line
    doc.fontSize(8)
       .font('Helvetica')
       .text('เอกสารนี้สร้างโดยระบบอัตโนมัติ', 50, 770, { align: 'center' });
  }

  /**
   * Format date for display
   * @private
   */
  static _formatDate(date) {
    if (!date) return '-';
    
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear() + 543; // Convert to Buddhist year
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  /**
   * Get payment method text in Thai
   * @private
   */
  static _getPaymentMethodText(method) {
    const methods = {
      'bank_transfer': 'โอนเงินผ่านธนาคาร',
      'promptpay': 'พร้อมเพย์',
      'cash': 'เงินสด',
      'other': 'อื่นๆ'
    };
    
    return methods[method] || method;
  }

  /**
   * Get receipt file path
   * @param {string} receiptNumber - Receipt number
   * @returns {string} File path
   */
  static getReceiptPath(receiptNumber) {
    return path.join(__dirname, '../uploads/receipts', `receipt-${receiptNumber}.pdf`);
  }

  /**
   * Check if receipt exists
   * @param {string} receiptNumber - Receipt number
   * @returns {boolean} Exists or not
   */
  static receiptExists(receiptNumber) {
    const filepath = this.getReceiptPath(receiptNumber);
    return fs.existsSync(filepath);
  }

  /**
   * Delete receipt file
   * @param {string} receiptNumber - Receipt number
   * @returns {boolean} Success status
   */
  static deleteReceipt(receiptNumber) {
    try {
      const filepath = this.getReceiptPath(receiptNumber);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete receipt error:', error);
      return false;
    }
  }
}

module.exports = ReceiptService;
