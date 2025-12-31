const Cart = require('../models/Cart');
const Voucher = require('../models/Voucher');

/**
 * Get or create cart for current user/session
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID || req.headers['x-session-id'];

    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required for guest users'
      });
    }

    const cart = await Cart.findOrCreate(userId, sessionId);
    const cartWithItems = await Cart.getById(cart.id);

    res.json({
      success: true,
      data: cartWithItems
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Add item to cart
 */
exports.addItem = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    const qty = parseInt(quantity) || 1;

    if (qty <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be greater than 0'
      });
    }

    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID || req.headers['x-session-id'];

    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required for guest users'
      });
    }

    const cart = await Cart.findOrCreate(userId, sessionId);
    const updatedCart = await Cart.addItem(cart.id, product_id, qty);

    res.json({
      success: true,
      message: 'Item added to cart',
      data: updatedCart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update item quantity
 */
exports.updateItem = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    const qty = parseInt(quantity);

    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity'
      });
    }

    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID || req.headers['x-session-id'];

    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required for guest users'
      });
    }

    const cart = await Cart.findOrCreate(userId, sessionId);
    const updatedCart = await Cart.updateItemQuantity(cart.id, product_id, qty);

    res.json({
      success: true,
      message: 'Cart updated',
      data: updatedCart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Remove item from cart
 */
exports.removeItem = async (req, res) => {
  try {
    const { product_id } = req.params;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID || req.headers['x-session-id'];

    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required for guest users'
      });
    }

    const cart = await Cart.findOrCreate(userId, sessionId);
    const updatedCart = await Cart.removeItem(cart.id, product_id);

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: updatedCart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Clear cart
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID || req.headers['x-session-id'];

    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required for guest users'
      });
    }

    const cart = await Cart.findOrCreate(userId, sessionId);
    const clearedCart = await Cart.clearCart(cart.id);

    res.json({
      success: true,
      message: 'Cart cleared',
      data: clearedCart
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Apply voucher to cart
 */
exports.applyVoucher = async (req, res) => {
  try {
    const { voucher_code } = req.body;

    if (!voucher_code) {
      return res.status(400).json({
        success: false,
        error: 'Voucher code is required'
      });
    }

    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID || req.headers['x-session-id'];

    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required for guest users'
      });
    }

    const cart = await Cart.findOrCreate(userId, sessionId);
    const updatedCart = await Cart.applyVoucher(cart.id, voucher_code, userId);

    res.json({
      success: true,
      message: 'Voucher applied successfully',
      data: updatedCart
    });
  } catch (error) {
    console.error('Apply voucher error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Remove voucher from cart
 */
exports.removeVoucher = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID || req.headers['x-session-id'];

    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required for guest users'
      });
    }

    const cart = await Cart.findOrCreate(userId, sessionId);
    const updatedCart = await Cart.removeVoucher(cart.id);

    res.json({
      success: true,
      message: 'Voucher removed',
      data: updatedCart
    });
  } catch (error) {
    console.error('Remove voucher error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Validate voucher
 */
exports.validateVoucher = async (req, res) => {
  try {
    const { voucher_code } = req.body;

    if (!voucher_code) {
      return res.status(400).json({
        success: false,
        error: 'Voucher code is required'
      });
    }

    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID || req.headers['x-session-id'];

    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required for guest users'
      });
    }

    // Get cart to check order amount
    const cart = await Cart.findOrCreate(userId, sessionId);
    const cartWithItems = await Cart.getById(cart.id);

    const validation = await Voucher.validate(
      voucher_code,
      cartWithItems.subtotal_excluding_vat,
      userId
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Calculate discount preview
    const discountAmount = Voucher.calculateDiscount(
      validation.voucher,
      cartWithItems.subtotal_excluding_vat
    );

    res.json({
      success: true,
      data: {
        voucher: validation.voucher,
        discount_amount: discountAmount,
        new_total: cartWithItems.subtotal_excluding_vat - discountAmount
      }
    });
  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Merge guest cart with user cart on login
 */
exports.mergeCart = async (req, res) => {
  try {
    const { guest_session_id } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!guest_session_id) {
      return res.status(400).json({
        success: false,
        error: 'Guest session ID is required'
      });
    }

    const mergedCart = await Cart.mergeGuestCart(guest_session_id, req.user.id);

    res.json({
      success: true,
      message: 'Carts merged successfully',
      data: mergedCart
    });
  } catch (error) {
    console.error('Merge cart error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
