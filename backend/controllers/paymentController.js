const Payment = require('../models/Payment');
const Order = require('../models/Order');
const PromptPayService = require('../services/PromptPayService');
const SlipOKService = require('../services/SlipOKService');
const ReceiptService = require('../services/ReceiptService');
const Joi = require('joi');

/**
 * Payment Controller
 * Handles payment processing, slip uploads, and QR code generation
 */

/**
 * Get payment information for an order
 * GET /api/payments/order/:orderId
 */
exports.getPaymentByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    // Get payment
    const payment = await Payment.findByOrderId(orderId);

    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          order_number: order.order_number,
          total_amount: order.total_amount,
          payment_status: order.payment_status
        },
        payment: payment || null
      }
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PAYMENT_ERROR',
        message: 'Failed to retrieve payment information'
      }
    });
  }
};

/**
 * Generate PromptPay QR code for order
 * GET /api/payments/promptpay/:orderId
 */
exports.generatePromptPayQR = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    // Get PromptPay ID from environment
    const promptPayId = process.env.PROMPTPAY_ID || process.env.SHOP_PHONE;
    
    if (!promptPayId) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'PROMPTPAY_NOT_CONFIGURED',
          message: 'PromptPay is not configured'
        }
      });
    }

    // Validate PromptPay ID
    if (!PromptPayService.validatePromptPayId(promptPayId)) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INVALID_PROMPTPAY_ID',
          message: 'Invalid PromptPay ID configuration'
        }
      });
    }

    // Generate QR code
    const qrCode = PromptPayService.generateQRCode(
      promptPayId,
      parseFloat(order.total_amount)
    );

    res.json({
      success: true,
      data: {
        order_number: order.order_number,
        amount: order.total_amount,
        promptpay_id: PromptPayService.formatPhoneNumber(promptPayId),
        qr_code: qrCode,
        bank_account: {
          bank_name: process.env.BANK_NAME || 'ธนาคาร',
          account_number: process.env.BANK_ACCOUNT_NUMBER || '',
          account_name: process.env.BANK_ACCOUNT_NAME || ''
        }
      }
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'QR_GENERATION_ERROR',
        message: 'Failed to generate QR code'
      }
    });
  }
};

/**
 * Upload payment slip
 * POST /api/payments/upload-slip
 */
exports.uploadSlip = async (req, res) => {
  try {
    // Validation schema
    const schema = Joi.object({
      order_id: Joi.number().integer().positive().required(),
      notes: Joi.string().max(500).optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const { order_id, notes } = value;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE_UPLOADED',
          message: 'Payment slip image is required'
        }
      });
    }

    // Get order
    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    // Check if payment already exists
    let payment = await Payment.findByOrderId(order_id);

    if (payment) {
      // Update existing payment with new slip
      payment = await Payment.updateSlipImage(payment.id, req.file.path);
    } else {
      // Create new payment record
      payment = await Payment.create({
        order_id,
        payment_method: 'bank_transfer',
        amount: order.total_amount,
        slip_image_path: req.file.path,
        notes
      });
    }

    res.json({
      success: true,
      message: 'Payment slip uploaded successfully',
      data: {
        payment_id: payment.id,
        slip_path: payment.slip_image_path,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('Upload slip error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: 'Failed to upload payment slip'
      }
    });
  }
};

/**
 * Create payment record (for manual payment entry by staff)
 * POST /api/payments
 */
exports.createPayment = async (req, res) => {
  try {
    // Validation schema
    const schema = Joi.object({
      order_id: Joi.number().integer().positive().required(),
      payment_method: Joi.string().valid('bank_transfer', 'promptpay', 'cash', 'other').required(),
      amount: Joi.number().positive().required(),
      notes: Joi.string().max(500).optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const { order_id, payment_method, amount, notes } = value;

    // Get order
    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findByOrderId(order_id);
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_EXISTS',
          message: 'Payment already exists for this order'
        }
      });
    }

    // Create payment
    const payment = await Payment.create({
      order_id,
      payment_method,
      amount,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_PAYMENT_ERROR',
        message: 'Failed to create payment'
      }
    });
  }
};

/**
 * Confirm payment manually (staff/admin)
 * POST /api/payments/:id/confirm
 */
exports.confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;

    // Get payment
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        }
      });
    }

    // Confirm payment
    const updatedPayment = await Payment.confirmPayment(id);

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: updatedPayment
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONFIRM_PAYMENT_ERROR',
        message: 'Failed to confirm payment'
      }
    });
  }
};

/**
 * Get all payments (admin)
 * GET /api/payments
 */
exports.getAllPayments = async (req, res) => {
  try {
    const {
      order_id,
      status,
      payment_method,
      verified,
      page = 1,
      limit = 20
    } = req.query;

    const payments = await Payment.findAll({
      order_id: order_id ? parseInt(order_id) : null,
      status,
      payment_method,
      verified: verified !== undefined ? verified === 'true' : null,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PAYMENTS_ERROR',
        message: 'Failed to retrieve payments'
      }
    });
  }
};

/**
 * Get payment by ID
 * GET /api/payments/:id
 */
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        }
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PAYMENT_ERROR',
        message: 'Failed to retrieve payment'
      }
    });
  }
};

/**
 * Delete payment (admin only)
 * DELETE /api/payments/:id
 */
exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        }
      });
    }

    await Payment.delete(id);

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_PAYMENT_ERROR',
        message: 'Failed to delete payment'
      }
    });
  }
};

/**
 * Verify payment slip using SlipOK API
 * POST /api/payments/:id/verify-slip
 */
exports.verifySlip = async (req, res) => {
  try {
    const { id } = req.params;

    // Get payment
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        }
      });
    }

    // Check if slip image exists
    if (!payment.slip_image_path) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_SLIP_IMAGE',
          message: 'No payment slip image found'
        }
      });
    }

    // Validate slip image
    const validation = await SlipOKService.validateSlipImage(payment.slip_image_path);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SLIP_IMAGE',
          message: validation.error
        }
      });
    }

    // Verify slip with SlipOK
    const verificationResult = await SlipOKService.verifySlip(
      payment.slip_image_path,
      parseFloat(payment.amount)
    );

    // Format data for storage
    const storageData = SlipOKService.formatForStorage(verificationResult);

    // Update payment with verification result
    const updatedPayment = await Payment.updateVerification(id, storageData);

    // If verified, confirm payment
    if (verificationResult.verified) {
      await Payment.confirmPayment(id);
    }

    res.json({
      success: true,
      message: verificationResult.verified ? 'Payment verified successfully' : 'Payment verification failed',
      data: {
        payment_id: id,
        verified: verificationResult.verified,
        verification_details: verificationResult.data,
        payment_status: updatedPayment.status
      }
    });
  } catch (error) {
    console.error('Verify slip error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VERIFY_SLIP_ERROR',
        message: 'Failed to verify payment slip'
      }
    });
  }
};

/**
 * Check SlipOK API status
 * GET /api/payments/slipok/status
 */
exports.checkSlipOKStatus = async (req, res) => {
  try {
    const status = await SlipOKService.checkStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Check SlipOK status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_CHECK_ERROR',
        message: 'Failed to check SlipOK API status'
      }
    });
  }
};

/**
 * Generate receipt for payment
 * POST /api/payments/:id/generate-receipt
 */
exports.generateReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    // Get payment
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        }
      });
    }

    // Check if payment is verified
    if (payment.status !== 'verified') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_VERIFIED',
          message: 'Payment must be verified before generating receipt'
        }
      });
    }

    // Check if receipt already exists
    if (payment.receipt_number && ReceiptService.receiptExists(payment.receipt_number)) {
      const receiptPath = ReceiptService.getReceiptPath(payment.receipt_number);
      
      return res.json({
        success: true,
        message: 'Receipt already exists',
        data: {
          receipt_number: payment.receipt_number,
          receipt_path: receiptPath
        }
      });
    }

    // Get order with items
    const order = await Order.findById(payment.order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    // Generate receipt
    const receiptPath = await ReceiptService.generateReceipt(order, payment);

    res.json({
      success: true,
      message: 'Receipt generated successfully',
      data: {
        receipt_number: payment.receipt_number,
        receipt_path: receiptPath
      }
    });
  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATE_RECEIPT_ERROR',
        message: 'Failed to generate receipt'
      }
    });
  }
};

/**
 * Download receipt
 * GET /api/payments/receipt/:receiptNumber
 */
exports.downloadReceipt = async (req, res) => {
  try {
    const { receiptNumber } = req.params;

    // Check if receipt exists
    if (!ReceiptService.receiptExists(receiptNumber)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RECEIPT_NOT_FOUND',
          message: 'Receipt not found'
        }
      });
    }

    const receiptPath = ReceiptService.getReceiptPath(receiptNumber);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${receiptNumber}.pdf"`);

    // Stream the file
    const fileStream = require('fs').createReadStream(receiptPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DOWNLOAD_RECEIPT_ERROR',
        message: 'Failed to download receipt'
      }
    });
  }
};

/**
 * View receipt (inline)
 * GET /api/payments/receipt/:receiptNumber/view
 */
exports.viewReceipt = async (req, res) => {
  try {
    const { receiptNumber } = req.params;

    // Check if receipt exists
    if (!ReceiptService.receiptExists(receiptNumber)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RECEIPT_NOT_FOUND',
          message: 'Receipt not found'
        }
      });
    }

    const receiptPath = ReceiptService.getReceiptPath(receiptNumber);

    // Set headers for PDF viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${receiptNumber}.pdf"`);

    // Stream the file
    const fileStream = require('fs').createReadStream(receiptPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('View receipt error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VIEW_RECEIPT_ERROR',
        message: 'Failed to view receipt'
      }
    });
  }
};
