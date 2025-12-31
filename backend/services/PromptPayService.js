/**
 * PromptPay QR Code Service
 * Generates PromptPay QR code data for bank transfers
 */
class PromptPayService {
  /**
   * Generate PromptPay QR code payload
   * @param {string} phoneOrId - Phone number (with country code) or Tax ID
   * @param {number} amount - Payment amount (optional)
   * @returns {string} QR code payload string
   */
  static generateQRPayload(phoneOrId, amount = null) {
    // Remove any non-digit characters
    const cleanId = phoneOrId.replace(/\D/g, '');
    
    // Determine if it's a phone number or tax ID
    let accountType;
    let accountId;
    
    if (cleanId.length === 13) {
      // Tax ID (13 digits)
      accountType = '0213';
      accountId = cleanId;
    } else if (cleanId.length === 10 || cleanId.length === 12) {
      // Phone number (10 digits or 12 with country code)
      accountType = '0113';
      // Add country code if not present
      accountId = cleanId.length === 10 ? `66${cleanId.substring(1)}` : cleanId;
    } else {
      throw new Error('Invalid phone number or tax ID format');
    }
    
    // Build EMV QR code payload
    let payload = '';
    
    // Payload Format Indicator
    payload += '000201';
    
    // Point of Initiation Method (static QR)
    payload += amount ? '010212' : '010211';
    
    // Merchant Account Information
    const merchantInfo = this._buildMerchantInfo(accountType, accountId);
    payload += `29${merchantInfo.length.toString().padStart(2, '0')}${merchantInfo}`;
    
    // Transaction Currency (THB = 764)
    payload += '5303764';
    
    // Transaction Amount (if specified)
    if (amount) {
      const amountStr = amount.toFixed(2);
      payload += `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
    }
    
    // Country Code (TH)
    payload += '5802TH';
    
    // CRC (will be calculated)
    payload += '6304';
    
    // Calculate and append CRC
    const crc = this._calculateCRC(payload);
    payload += crc;
    
    return payload;
  }

  /**
   * Build merchant account information section
   * @private
   */
  static _buildMerchantInfo(accountType, accountId) {
    // Application ID for PromptPay
    const appId = '0016A000000677010111';
    
    // Account type and ID
    const account = `${accountType}${accountId}`;
    
    return `${appId}01${account.length.toString().padStart(2, '0')}${account}`;
  }

  /**
   * Calculate CRC-16/CCITT-FALSE checksum
   * @private
   */
  static _calculateCRC(payload) {
    let crc = 0xFFFF;
    const polynomial = 0x1021;
    
    for (let i = 0; i < payload.length; i++) {
      const byte = payload.charCodeAt(i);
      crc ^= (byte << 8);
      
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ polynomial) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Generate QR code data URL (base64 encoded)
   * Note: In production, you would use a QR code library like 'qrcode'
   * This is a placeholder that returns the payload
   * @param {string} phoneOrId - Phone number or Tax ID
   * @param {number} amount - Payment amount
   * @returns {Object} QR code data
   */
  static generateQRCode(phoneOrId, amount = null) {
    const payload = this.generateQRPayload(phoneOrId, amount);
    
    return {
      payload,
      format: 'EMV',
      // In production, generate actual QR code image here
      // For now, return the payload that can be used with a QR code generator
      qrData: payload
    };
  }

  /**
   * Validate PromptPay ID format
   * @param {string} phoneOrId - Phone number or Tax ID
   * @returns {boolean} Valid or not
   */
  static validatePromptPayId(phoneOrId) {
    const cleanId = phoneOrId.replace(/\D/g, '');
    
    // Valid formats: 10-digit phone, 12-digit phone with country code, or 13-digit tax ID
    return cleanId.length === 10 || cleanId.length === 12 || cleanId.length === 13;
  }

  /**
   * Format phone number for display
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone number
   */
  static formatPhoneNumber(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 10) {
      return `${cleanPhone.substring(0, 3)}-${cleanPhone.substring(3, 6)}-${cleanPhone.substring(6)}`;
    } else if (cleanPhone.length === 12) {
      return `+${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 5)}-${cleanPhone.substring(5, 8)}-${cleanPhone.substring(8)}`;
    }
    
    return phone;
  }
}

module.exports = PromptPayService;
