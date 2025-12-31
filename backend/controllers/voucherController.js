const Voucher = require('../models/Voucher');

/**
 * Get all vouchers (Admin only)
 */
exports.getAllVouchers = async (req, res) => {
  try {
    const { status, active_only } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (active_only === 'true') filters.active_only = true;

    const vouchers = await Voucher.getAll(filters);

    res.json({
      success: true,
      data: vouchers
    });
  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get voucher by ID (Admin only)
 */
exports.getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;

    const voucher = await Voucher.getById(id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        error: 'Voucher not found'
      });
    }

    res.json({
      success: true,
      data: voucher
    });
  } catch (error) {
    console.error('Get voucher error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create voucher (Admin only)
 */
exports.createVoucher = async (req, res) => {
  try {
    const voucherData = req.body;

    // Validate required fields
    const requiredFields = ['code', 'name', 'discount_type', 'discount_value', 'start_date', 'end_date'];
    for (const field of requiredFields) {
      if (!voucherData[field]) {
        return res.status(400).json({
          success: false,
          error: `${field} is required`
        });
      }
    }

    // Validate discount type
    if (!['percentage', 'fixed_amount'].includes(voucherData.discount_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid discount type'
      });
    }

    // Validate discount value
    if (voucherData.discount_value <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Discount value must be greater than 0'
      });
    }

    // Validate percentage
    if (voucherData.discount_type === 'percentage' && voucherData.discount_value > 100) {
      return res.status(400).json({
        success: false,
        error: 'Percentage discount cannot exceed 100%'
      });
    }

    const voucher = await Voucher.create(voucherData);

    res.status(201).json({
      success: true,
      message: 'Voucher created successfully',
      data: voucher
    });
  } catch (error) {
    console.error('Create voucher error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Voucher code already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update voucher (Admin only)
 */
exports.updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const voucherData = req.body;

    // Check if voucher exists
    const existingVoucher = await Voucher.getById(id);
    if (!existingVoucher) {
      return res.status(404).json({
        success: false,
        error: 'Voucher not found'
      });
    }

    // Validate discount type if provided
    if (voucherData.discount_type && !['percentage', 'fixed_amount'].includes(voucherData.discount_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid discount type'
      });
    }

    // Validate discount value if provided
    if (voucherData.discount_value !== undefined) {
      if (voucherData.discount_value <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Discount value must be greater than 0'
        });
      }

      const discountType = voucherData.discount_type || existingVoucher.discount_type;
      if (discountType === 'percentage' && voucherData.discount_value > 100) {
        return res.status(400).json({
          success: false,
          error: 'Percentage discount cannot exceed 100%'
        });
      }
    }

    const updatedVoucher = await Voucher.update(id, voucherData);

    res.json({
      success: true,
      message: 'Voucher updated successfully',
      data: updatedVoucher
    });
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete voucher (Admin only)
 */
exports.deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if voucher exists
    const voucher = await Voucher.getById(id);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        error: 'Voucher not found'
      });
    }

    await Voucher.delete(id);

    res.json({
      success: true,
      message: 'Voucher deleted successfully'
    });
  } catch (error) {
    console.error('Delete voucher error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get voucher usage history (Admin only)
 */
exports.getVoucherUsage = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if voucher exists
    const voucher = await Voucher.getById(id);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        error: 'Voucher not found'
      });
    }

    const usageHistory = await Voucher.getUsageHistory(id);

    res.json({
      success: true,
      data: {
        voucher: voucher,
        usage_history: usageHistory
      }
    });
  } catch (error) {
    console.error('Get voucher usage error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
