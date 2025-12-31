const db = require('../config/database');

class Cart {
  /**
   * Find or create cart for user or session
   */
  static async findOrCreate(userId = null, sessionId = null) {
    if (!userId && !sessionId) {
      throw new Error('Either userId or sessionId is required');
    }

    const [carts] = userId
      ? await db.pool.query('SELECT * FROM carts WHERE user_id = ?', [userId])
      : await db.pool.query('SELECT * FROM carts WHERE session_id = ?', [sessionId]);

    if (carts.length > 0) {
      return carts[0];
    }

    // Create new cart
    const [result] = await db.pool.query(
      'INSERT INTO carts (user_id, session_id) VALUES (?, ?)',
      [userId, sessionId]
    );

    return {
      id: result.insertId,
      user_id: userId,
      session_id: sessionId,
      voucher_code: null,
      subtotal_excluding_vat: 0,
      total_vat_amount: 0,
      discount_amount: 0,
      total_amount: 0
    };
  }

  /**
   * Get cart by ID with items
   */
  static async getById(cartId) {
    const [carts] = await db.pool.query('SELECT * FROM carts WHERE id = ?', [cartId]);
    
    if (carts.length === 0) {
      return null;
    }

    const cart = carts[0];
    
    // Get cart items with product details
    const [items] = await db.pool.query(`
      SELECT 
        ci.*,
        p.name as product_name,
        p.sku as product_sku,
        p.image_path as product_image,
        p.stock_quantity as product_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `, [cartId]);

    cart.items = items;
    return cart;
  }

  /**
   * Add item to cart
   */
  static async addItem(cartId, productId, quantity = 1) {
    // Get product details
    const [products] = await db.pool.query(
      'SELECT * FROM products WHERE id = ? AND status = "active"',
      [productId]
    );

    if (products.length === 0) {
      throw new Error('Product not found or inactive');
    }

    const product = products[0];

    // Check stock
    if (product.stock_quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    // Check if item already exists in cart
    const [existingItems] = await db.pool.query(
      'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, productId]
    );

    if (existingItems.length > 0) {
      // Update quantity
      const newQuantity = existingItems[0].quantity + quantity;
      
      if (product.stock_quantity < newQuantity) {
        throw new Error('Insufficient stock');
      }

      await db.pool.query(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );
    } else {
      // Insert new item
      await db.pool.query(`
        INSERT INTO cart_items (
          cart_id, product_id, quantity,
          unit_price_excluding_vat, vat_rate, unit_vat_amount, unit_price_including_vat
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        cartId,
        productId,
        quantity,
        product.price_excluding_vat,
        product.vat_rate,
        product.vat_amount,
        product.price_including_vat
      ]);
    }

    // Recalculate cart totals
    await this.recalculateTotals(cartId);

    return await this.getById(cartId);
  }

  /**
   * Update item quantity
   */
  static async updateItemQuantity(cartId, productId, quantity) {
    if (quantity <= 0) {
      return await this.removeItem(cartId, productId);
    }

    // Get product to check stock
    const [products] = await db.pool.query(
      'SELECT stock_quantity FROM products WHERE id = ?',
      [productId]
    );

    if (products.length === 0) {
      throw new Error('Product not found');
    }

    if (products[0].stock_quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    await db.pool.query(
      'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?',
      [quantity, cartId, productId]
    );

    // Recalculate cart totals
    await this.recalculateTotals(cartId);

    return await this.getById(cartId);
  }

  /**
   * Remove item from cart
   */
  static async removeItem(cartId, productId) {
    await db.pool.query(
      'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, productId]
    );

    // Recalculate cart totals
    await this.recalculateTotals(cartId);

    return await this.getById(cartId);
  }

  /**
   * Clear all items from cart
   */
  static async clearCart(cartId) {
    await db.pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    await db.pool.query(
      'UPDATE carts SET voucher_code = NULL, subtotal_excluding_vat = 0, total_vat_amount = 0, discount_amount = 0, total_amount = 0 WHERE id = ?',
      [cartId]
    );

    return await this.getById(cartId);
  }

  /**
   * Recalculate cart totals
   */
  static async recalculateTotals(cartId) {
    // Get cart items
    const [items] = await db.pool.query(`
      SELECT 
        line_total_excluding_vat,
        line_total_vat,
        line_total_including_vat
      FROM cart_items
      WHERE cart_id = ?
    `, [cartId]);

    let subtotalExcludingVat = 0;
    let totalVat = 0;
    let totalIncludingVat = 0;

    items.forEach(item => {
      subtotalExcludingVat += parseFloat(item.line_total_excluding_vat);
      totalVat += parseFloat(item.line_total_vat);
      totalIncludingVat += parseFloat(item.line_total_including_vat);
    });

    // Get cart to check for voucher
    const [carts] = await db.pool.query('SELECT * FROM carts WHERE id = ?', [cartId]);
    const cart = carts[0];

    let discountAmount = 0;

    // Apply voucher if exists
    if (cart.voucher_code) {
      const [vouchers] = await db.pool.query(
        'SELECT * FROM vouchers WHERE code = ? AND status = "active"',
        [cart.voucher_code]
      );

      if (vouchers.length > 0) {
        const voucher = vouchers[0];
        
        // Check if voucher is still valid
        const now = new Date();
        const startDate = new Date(voucher.start_date);
        const endDate = new Date(voucher.end_date);

        if (now >= startDate && now <= endDate && subtotalExcludingVat >= voucher.minimum_order_amount) {
          if (voucher.discount_type === 'percentage') {
            discountAmount = subtotalExcludingVat * (parseFloat(voucher.discount_value) / 100);
            if (voucher.max_discount_amount && discountAmount > parseFloat(voucher.max_discount_amount)) {
              discountAmount = parseFloat(voucher.max_discount_amount);
            }
          } else {
            discountAmount = parseFloat(voucher.discount_value);
          }

          // Recalculate VAT after discount
          const discountedSubtotal = subtotalExcludingVat - discountAmount;
          
          // Calculate weighted average VAT rate from all items
          const avgVATRate = items.length > 0 ? (totalVat / subtotalExcludingVat) * 100 : 7;
          
          totalVat = discountedSubtotal * (avgVATRate / 100);
          totalIncludingVat = discountedSubtotal + totalVat;
        } else {
          // Voucher no longer valid, remove it
          await db.pool.query('UPDATE carts SET voucher_code = NULL WHERE id = ?', [cartId]);
        }
      }
    }

    // Update cart totals
    await db.pool.query(`
      UPDATE carts 
      SET 
        subtotal_excluding_vat = ?,
        total_vat_amount = ?,
        discount_amount = ?,
        total_amount = ?
      WHERE id = ?
    `, [
      subtotalExcludingVat.toFixed(2),
      totalVat.toFixed(2),
      discountAmount.toFixed(2),
      totalIncludingVat.toFixed(2),
      cartId
    ]);
  }

  /**
   * Apply voucher to cart
   */
  static async applyVoucher(cartId, voucherCode, userId = null) {
    // Get voucher
    const [vouchers] = await db.pool.query(
      'SELECT * FROM vouchers WHERE code = ? AND status = "active"',
      [voucherCode]
    );

    if (vouchers.length === 0) {
      throw new Error('Invalid voucher code');
    }

    const voucher = vouchers[0];

    // Check dates
    const now = new Date();
    const startDate = new Date(voucher.start_date);
    const endDate = new Date(voucher.end_date);

    if (now < startDate) {
      throw new Error('Voucher not yet active');
    }

    if (now > endDate) {
      throw new Error('Voucher has expired');
    }

    // Check usage limits
    if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
      throw new Error('Voucher usage limit reached');
    }

    // Check per-customer usage limit
    if (userId && voucher.usage_limit_per_customer) {
      const [usageRecords] = await db.pool.query(
        'SELECT COUNT(*) as count FROM voucher_usage WHERE voucher_id = ? AND user_id = ?',
        [voucher.id, userId]
      );

      if (usageRecords[0].count >= voucher.usage_limit_per_customer) {
        throw new Error('You have reached the usage limit for this voucher');
      }
    }

    // Get cart to check minimum order amount
    const cart = await this.getById(cartId);
    
    if (cart.subtotal_excluding_vat < voucher.minimum_order_amount) {
      throw new Error(`Minimum order amount of ${voucher.minimum_order_amount} required`);
    }

    // Apply voucher
    await db.pool.query('UPDATE carts SET voucher_code = ? WHERE id = ?', [voucherCode, cartId]);

    // Recalculate totals
    await this.recalculateTotals(cartId);

    return await this.getById(cartId);
  }

  /**
   * Remove voucher from cart
   */
  static async removeVoucher(cartId) {
    await db.pool.query('UPDATE carts SET voucher_code = NULL WHERE id = ?', [cartId]);
    await this.recalculateTotals(cartId);
    return await this.getById(cartId);
  }

  /**
   * Delete cart
   */
  static async delete(cartId) {
    await db.pool.query('DELETE FROM carts WHERE id = ?', [cartId]);
  }

  /**
   * Merge guest cart with user cart on login
   */
  static async mergeGuestCart(guestSessionId, userId) {
    // Get guest cart
    const [guestCarts] = await db.pool.query(
      'SELECT * FROM carts WHERE session_id = ?',
      [guestSessionId]
    );

    if (guestCarts.length === 0) {
      return null;
    }

    const guestCart = guestCarts[0];

    // Get or create user cart
    const userCart = await this.findOrCreate(userId, null);

    // Get guest cart items
    const [guestItems] = await db.pool.query(
      'SELECT * FROM cart_items WHERE cart_id = ?',
      [guestCart.id]
    );

    // Merge items
    for (const item of guestItems) {
      await this.addItem(userCart.id, item.product_id, item.quantity);
    }

    // Delete guest cart
    await this.delete(guestCart.id);

    return await this.getById(userCart.id);
  }
}

module.exports = Cart;
