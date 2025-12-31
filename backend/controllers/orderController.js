const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Joi = require('joi');

/**
 * Order Controller
 * Handles order creation and management
 */

/**
 * Create order from cart (for customers)
 */
exports.createOrderFromCart = async (req, res) => {
  try {
    // Validation schema
    const schema = Joi.object({
      cart_id: Joi.number().integer().positive().required(),
      guest_name: Joi.string().max(100).when('user_id', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required()
      }),
      guest_email: Joi.string().email().max(255).when('user_id', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required()
      }),
      guest_phone: Joi.string().max(20).when('user_id', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required()
      }),
      shipping_address: Joi.string().required(),
      shipping_subdistrict: Joi.string().max(100).optional(),
      shipping_district: Joi.string().max(100).optional(),
      shipping_province: Joi.string().max(100).optional(),
      shipping_postal_code: Joi.string().max(10).optional(),
      shipping_cost: Joi.number().min(0).default(0),
      notes: Joi.string().optional()
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

    // Add user_id if authenticated
    const orderData = {
      ...value,
      user_id: req.user ? req.user.id : null,
      source_platform: 'website'
    };

    const order = await Order.createFromCart(orderData);

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ORDER_CREATION_ERROR',
        message: error.message || 'Failed to create order'
      }
    });
  }
};

/**
 * Create order directly (for staff)
 */
exports.createOrderDirect = async (req, res) => {
  try {
    // Check if user is staff or admin
    if (!req.user || !['staff', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only staff and admin can create orders directly'
        }
      });
    }

    // Validation schema
    const schema = Joi.object({
      user_id: Joi.number().integer().positive().optional(),
      guest_name: Joi.string().max(100).when('user_id', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required()
      }),
      guest_email: Joi.string().email().max(255).when('user_id', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required()
      }),
      guest_phone: Joi.string().max(20).when('user_id', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required()
      }),
      shipping_address: Joi.string().required(),
      shipping_subdistrict: Joi.string().max(100).optional(),
      shipping_district: Joi.string().max(100).optional(),
      shipping_province: Joi.string().max(100).optional(),
      shipping_postal_code: Joi.string().max(10).optional(),
      shipping_cost: Joi.number().min(0).default(0),
      voucher_code: Joi.string().max(50).optional(),
      source_platform: Joi.string().max(50).default('staff'),
      notes: Joi.string().optional(),
      items: Joi.array().items(
        Joi.object({
          product_id: Joi.number().integer().positive().required(),
          quantity: Joi.number().integer().positive().required()
        })
      ).min(1).required()
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

    // Add created_by
    const orderData = {
      ...value,
      created_by: req.user.id
    };

    const order = await Order.createDirect(orderData);

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Create direct order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ORDER_CREATION_ERROR',
        message: error.message || 'Failed to create order'
      }
    });
  }
};

/**
 * Get order by ID
 */
exports.getOrderById = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Invalid order ID'
        }
      });
    }

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

    // Check authorization
    if (req.user) {
      // Staff and admin can view all orders
      if (!['staff', 'admin'].includes(req.user.role)) {
        // Regular users can only view their own orders
        if (order.user_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have permission to view this order'
            }
          });
        }
      }
    } else {
      // Guest users cannot access orders by ID directly
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Please use order lookup with order number and contact information'
        }
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve order'
      }
    });
  }
};

/**
 * Get order by order number (for authenticated users)
 */
exports.getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findByOrderNumber(orderNumber);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    // Check authorization
    if (req.user) {
      // Staff and admin can view all orders
      if (!['staff', 'admin'].includes(req.user.role)) {
        // Regular users can only view their own orders
        if (order.user_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have permission to view this order'
            }
          });
        }
      }
    } else {
      // Guest users should use the guest lookup endpoint
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Please use guest order lookup endpoint'
        }
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by number error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve order'
      }
    });
  }
};

/**
 * Guest order lookup
 */
exports.guestOrderLookup = async (req, res) => {
  try {
    const schema = Joi.object({
      order_number: Joi.string().required(),
      contact: Joi.string().required()
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

    const order = await Order.findGuestOrder(value.order_number, value.contact);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found. Please check your order number and contact information.'
        }
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Guest order lookup error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve order'
      }
    });
  }
};

/**
 * Get all orders (with filtering and pagination)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const options = {
      status: req.query.status,
      payment_status: req.query.payment_status,
      source_platform: req.query.source_platform,
      search: req.query.search || '',
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'DESC',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    // If regular user, only show their orders
    if (req.user && !['staff', 'admin'].includes(req.user.role)) {
      options.user_id = req.user.id;
    }

    const result = await Order.findAll(options);

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve orders'
      }
    });
  }
};

/**
 * Update order status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    // Check if user is staff or admin
    if (!req.user || !['staff', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only staff and admin can update order status'
        }
      });
    }

    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Invalid order ID'
        }
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status is required'
        }
      });
    }

    const order = await Order.updateStatus(orderId, status);

    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error.message || 'Failed to update order status'
      }
    });
  }
};

/**
 * Update payment status
 */
exports.updatePaymentStatus = async (req, res) => {
  try {
    // Check if user is staff or admin
    if (!req.user || !['staff', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only staff and admin can update payment status'
        }
      });
    }

    const orderId = parseInt(req.params.id);
    const { payment_status } = req.body;

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Invalid order ID'
        }
      });
    }

    if (!payment_status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Payment status is required'
        }
      });
    }

    const order = await Order.updatePaymentStatus(orderId, payment_status);

    res.json({
      success: true,
      data: order,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error.message || 'Failed to update payment status'
      }
    });
  }
};

/**
 * Update tracking number
 */
exports.updateTrackingNumber = async (req, res) => {
  try {
    // Check if user is staff or admin
    if (!req.user || !['staff', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only staff and admin can update tracking number'
        }
      });
    }

    const orderId = parseInt(req.params.id);
    const { tracking_number } = req.body;

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Invalid order ID'
        }
      });
    }

    if (!tracking_number) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Tracking number is required'
        }
      });
    }

    const order = await Order.updateTrackingNumber(orderId, tracking_number);

    res.json({
      success: true,
      data: order,
      message: 'Tracking number updated successfully'
    });
  } catch (error) {
    console.error('Update tracking number error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update tracking number'
      }
    });
  }
};

/**
 * Upload packing media
 */
exports.uploadPackingMedia = async (req, res) => {
  try {
    // Check if user is staff or admin
    if (!req.user || !['staff', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only staff and admin can upload packing media'
        }
      });
    }

    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Invalid order ID'
        }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Packing media file is required'
        }
      });
    }

    const mediaPath = req.file.path;
    const order = await Order.updatePackingMedia(orderId, mediaPath);

    res.json({
      success: true,
      data: order,
      message: 'Packing media uploaded successfully'
    });
  } catch (error) {
    console.error('Upload packing media error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: 'Failed to upload packing media'
      }
    });
  }
};

/**
 * Cancel order
 */
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Invalid order ID'
        }
      });
    }

    // Get order to check authorization
    const existingOrder = await Order.findById(orderId);

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    // Check authorization
    if (req.user) {
      // Staff and admin can cancel any order
      if (!['staff', 'admin'].includes(req.user.role)) {
        // Regular users can only cancel their own orders
        if (existingOrder.user_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have permission to cancel this order'
            }
          });
        }
      }
    } else {
      // Guest users cannot cancel orders
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Please contact support to cancel your order'
        }
      });
    }

    const order = await Order.cancel(orderId, req.user ? req.user.id : null);

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_ERROR',
        message: error.message || 'Failed to cancel order'
      }
    });
  }
};
