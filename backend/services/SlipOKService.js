const axios = require('axios');
const fs = require('fs').promises;
const FormData = require('form-data');

/**
 * SlipOK API Service
 * Handles payment slip verification through SlipOK API
 */
class SlipOKService {
  constructor() {
    this.apiKey = process.env.SLIPOK_API_KEY;
    this.apiUrl = process.env.SLIPOK_API_URL || 'https://api.slipok.com/api/v1';
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Verify payment slip
   * @param {string} slipImagePath - Path to slip image file
   * @param {number} expectedAmount - Expected payment amount
   * @returns {Promise<Object>} Verification result
   */
  async verifySlip(slipImagePath, expectedAmount = null) {
    try {
      if (!this.apiKey) {
        throw new Error('SlipOK API key is not configured');
      }

      // Read the image file
      const imageBuffer = await fs.readFile(slipImagePath);
      
      // Create form data
      const formData = new FormData();
      formData.append('files', imageBuffer, {
        filename: 'slip.jpg',
        contentType: 'image/jpeg'
      });

      if (expectedAmount) {
        formData.append('amount', expectedAmount.toString());
      }

      // Make API request
      const response = await axios.post(
        `${this.apiUrl}/verify`,
        formData,
        {
          headers: {
            'x-authorization': this.apiKey,
            ...formData.getHeaders()
          },
          timeout: this.timeout
        }
      );

      // Parse response
      const result = this._parseResponse(response.data, expectedAmount);
      
      return result;
    } catch (error) {
      console.error('SlipOK verification error:', error);
      
      // Handle different error types
      if (error.response) {
        // API returned an error response
        return {
          success: false,
          verified: false,
          error: {
            code: error.response.status,
            message: error.response.data?.message || 'Verification failed',
            details: error.response.data
          },
          raw_response: error.response.data
        };
      } else if (error.request) {
        // Request was made but no response received
        return {
          success: false,
          verified: false,
          error: {
            code: 'NO_RESPONSE',
            message: 'No response from SlipOK API',
            details: error.message
          }
        };
      } else {
        // Error in setting up the request
        return {
          success: false,
          verified: false,
          error: {
            code: 'REQUEST_ERROR',
            message: error.message
          }
        };
      }
    }
  }

  /**
   * Parse SlipOK API response
   * @private
   */
  _parseResponse(data, expectedAmount) {
    // SlipOK API response structure may vary
    // This is a generic parser that should be adjusted based on actual API response
    
    const result = {
      success: true,
      verified: false,
      data: {},
      raw_response: data
    };

    // Check if verification was successful
    if (data.success || data.verified) {
      result.verified = true;
      
      // Extract slip data
      result.data = {
        amount: data.amount || data.transferAmount || null,
        transfer_date: data.transDate || data.transferDate || data.date || null,
        sender_account: data.sender?.account || data.senderAccount || null,
        sender_name: data.sender?.name || data.senderName || null,
        sender_bank: data.sender?.bank || data.senderBank || null,
        receiver_account: data.receiver?.account || data.receiverAccount || null,
        receiver_name: data.receiver?.name || data.receiverName || null,
        receiver_bank: data.receiver?.bank || data.receiverBank || null,
        reference: data.ref || data.reference || null
      };

      // Verify amount if expected amount was provided
      if (expectedAmount && result.data.amount) {
        const slipAmount = parseFloat(result.data.amount);
        const expected = parseFloat(expectedAmount);
        
        // Allow small difference due to floating point precision
        const difference = Math.abs(slipAmount - expected);
        result.amount_match = difference < 0.01;
        
        if (!result.amount_match) {
          result.verified = false;
          result.error = {
            code: 'AMOUNT_MISMATCH',
            message: `Amount mismatch: expected ${expected}, got ${slipAmount}`
          };
        }
      }
    } else {
      result.error = {
        code: data.code || 'VERIFICATION_FAILED',
        message: data.message || 'Slip verification failed',
        details: data.error || data.details || null
      };
    }

    return result;
  }

  /**
   * Check API status
   * @returns {Promise<Object>} API status
   */
  async checkStatus() {
    try {
      if (!this.apiKey) {
        return {
          available: false,
          error: 'API key not configured'
        };
      }

      const response = await axios.get(
        `${this.apiUrl}/status`,
        {
          headers: {
            'x-authorization': this.apiKey
          },
          timeout: 5000
        }
      );

      return {
        available: true,
        status: response.data
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Validate slip image before sending to API
   * @param {string} slipImagePath - Path to slip image
   * @returns {Promise<Object>} Validation result
   */
  async validateSlipImage(slipImagePath) {
    try {
      // Check if file exists
      const stats = await fs.stat(slipImagePath);
      
      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (stats.size > maxSize) {
        return {
          valid: false,
          error: 'File size exceeds 5MB limit'
        };
      }

      // Check file extension
      const validExtensions = ['.jpg', '.jpeg', '.png'];
      const extension = slipImagePath.toLowerCase().slice(slipImagePath.lastIndexOf('.'));
      
      if (!validExtensions.includes(extension)) {
        return {
          valid: false,
          error: 'Invalid file format. Only JPG and PNG are supported'
        };
      }

      return {
        valid: true,
        size: stats.size,
        extension
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Format verification result for storage
   * @param {Object} verificationResult - Result from verifySlip
   * @returns {Object} Formatted data for database
   */
  formatForStorage(verificationResult) {
    return {
      verified: verificationResult.verified,
      slipok_response: verificationResult,
      verified_amount: verificationResult.data?.amount || null,
      transfer_date: verificationResult.data?.transfer_date || null
    };
  }
}

module.exports = new SlipOKService();
