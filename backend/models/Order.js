const db = require('../config/database');

/**
 * Order Model
 * Handles order creation and management for guest and registered users
 */
class Order {
  /**
   * Generate unique order number
   * Format: ORD-YYYYMMDD-XXXXX-RRR (RRR = random component for uniqueness)
   */
  static async generateOrderNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get count of orders today
    const [result] = await db.pool.query(
      `SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()`
    );
    
    const sequence = (result[0].count + 1).toString().padStart(5, '0');
    // Add random component to ensure uniqueness in concurrent scenarios
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `ORD-${dateStr}-${sequence}-${random}`;
  }

  /**
   * Create order from cart
   * @param {Object} orderData - Order information
   * @returns {Promise<Object>} Created order with items
   */
  static async createFromCart(orderData) {
    const {
      cart_id,
      user_id = null,
      payment_method = 'bank_transfer',
      guest_name = null,
      guest_email = null,
      guest_phone = null,
      shipping_address,
      shipping_subdistrict = null,
      shipping_district = null,
      shipping_province = null,
      shipping_postal_code = null,
      shipping_cost = 0,
      source_platform = 'website',
      notes = null,
      created_by = null
    } = orderData;

    const connection = await db.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get cart with items
      const [carts] = await connection.query(
        'SELECT * FROM carts WHERE id = ?',
        [cart_id]
      );

      if (carts.length === 0) {
        throw new Error('Cart not found');
      }

      const cart = carts[0];

      // Get cart items with product details
      const [cartItems] = await connection.query(`
        SELECT 
          ci.*,
          p.name as product_name,
          p.sku as product_sku,
          p.stock_quantity
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = ?
      `, [cart_id]);

      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Verify stock availability for all items
      for (const item of cartItems) {
        if (item.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${item.product_name}`);
        }
      }

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Calculate totals
      const subtotalExcludingVat = parseFloat(cart.subtotal_excluding_vat);
      const totalVatAmount = parseFloat(cart.total_vat_amount);
      const discountAmount = parseFloat(cart.discount_amount);
      const shippingCostNum = parseFloat(shipping_cost);
      const totalAmount = subtotalExcludingVat + totalVatAmount - discountAmount + shippingCostNum;

      // Create order
      const orderQuery = `
        INSERT INTO orders (
          order_number, user_id, guest_name, guest_email, guest_phone,
          shipping_address, shipping_subdistrict, shipping_district, 
          shipping_province, shipping_postal_code,
          subtotal_excluding_vat, total_vat_amount, discount_amount,
          shipping_cost, total_amount, voucher_code,
          status, payment_status, payment_method, source_platform, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [orderResult] = await connection.execute(orderQuery, [
        orderNumber,
        user_id,
        guest_name,
        guest_email,
        guest_phone,
        shipping_address,
        shipping_subdistrict,
        shipping_district,
        shipping_province,
        shipping_postal_code,
        subtotalExcludingVat.toFixed(2),
        totalVatAmount.toFixed(2),
        discountAmount.toFixed(2),
        shippingCostNum.toFixed(2),
        totalAmount.toFixed(2),
        cart.voucher_code,
        'pending',
        'pending',
        payment_method,
        source_platform,
        notes,
        created_by
      ]);

      const orderId = orderResult.insertId;

      // Create order items and update stock
      for (const item of cartItems) {
        // Insert order item
        const orderItemQuery = `
          INSERT INTO order_items (
            order_id, product_id, product_name, product_sku,
            quantity, unit_price_excluding_vat, vat_rate,
            unit_vat_amount, unit_price_including_vat
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.execute(orderItemQuery, [
          orderId,
          item.product_id,
          item.product_name,
          item.product_sku,
          item.quantity,
          item.unit_price_excluding_vat,
          item.vat_rate,
          item.unit_vat_amount,
          item.unit_price_including_vat
        ]);

        // Update product stock
        await connection.execute(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );

        // Create stock history entry
        const [productData] = await connection.execute(
          'SELECT stock_quantity FROM products WHERE id = ?',
          [item.product_id]
        );

        await connection.execute(`
          INSERT INTO stock_history (
            product_id, quantity_change, quantity_before, quantity_after,
            change_type, reference_id, reference_type, notes, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.product_id,
          -item.quantity,
          productData[0].stock_quantity + item.quantity,
          productData[0].stock_quantity,
          'sale',
          orderId,
          'order',
          `Order ${orderNumber}`,
          created_by
        ]);
      }

      // Record voucher usage if applicable
      if (cart.voucher_code) {
        const [vouchers] = await connection.query(
          'SELECT id FROM vouchers WHERE code = ?',
          [cart.voucher_code]
        );

        if (vouchers.length > 0) {
          await connection.execute(
            'INSERT INTO voucher_usage (voucher_id, user_id, order_id) VALUES (?, ?, ?)',
            [vouchers[0].id, user_id, orderId]
          );

          // Increment voucher usage count
          await connection.execute(
            'UPDATE vouchers SET usage_count = usage_count + 1 WHERE id = ?',
            [vouchers[0].id]
          );
        }
      }

      // Clear cart
      await connection.execute('DELETE FROM cart_items WHERE cart_id = ?', [cart_id]);
      await connection.execute(
        'UPDATE carts SET voucher_code = NULL, subtotal_excluding_vat = 0, total_vat_amount = 0, discount_amount = 0, total_amount = 0 WHERE id = ?',
        [cart_id]
      );

      await connection.commit();
      
      return await this.findById(orderId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Create order directly (for staff creating orders on behalf of customers)
   * @param {Object} orderData - Order information including items
   * @returns {Promise<Object>} Created order
   */
  static async createDirect(orderData) {
    const {
      user_id = null,
      guest_name = null,
      guest_email = null,
      guest_phone = null,
      shipping_address,
      shipping_subdistrict = null,
      shipping_district = null,
      shipping_province = null,
      shipping_postal_code = null,
      shipping_cost = 0,
      voucher_code = null,
      source_platform = 'website',
      notes = null,
      created_by = null,
      items = []
    } = orderData;

    if (!items || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const connection = await db.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verify stock and get product details for all items
      const orderItems = [];
      for (const item of items) {
        const [products] = await connection.query(
          'SELECT * FROM products WHERE id = ? AND status = "active"',
          [item.product_id]
        );

        if (products.length === 0) {
          throw new Error(`Product not found: ${item.product_id}`);
        }

        const product = products[0];

        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`);
        }

        orderItems.push({
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          quantity: item.quantity,
          unit_price_excluding_vat: product.price_excluding_vat,
          vat_rate: product.vat_rate,
          unit_vat_amount: product.vat_amount,
          unit_price_including_vat: product.price_including_vat,
          stock_quantity: product.stock_quantity
        });
      }

      // Calculate totals
      let subtotalExcludingVat = 0;
      let totalVatAmount = 0;

      orderItems.forEach(item => {
        const lineTotal = item.quantity * parseFloat(item.unit_price_excluding_vat);
        const lineVat = item.quantity * parseFloat(item.unit_vat_amount);
        subtotalExcludingVat += lineTotal;
        totalVatAmount += lineVat;
      });

      // Apply voucher if provided
      let discountAmount = 0;
      if (voucher_code) {
        const [vouchers] = await connection.query(
          'SELECT * FROM vouchers WHERE code = ? AND status = "active"',
          [voucher_code]
        );

        if (vouchers.length > 0) {
          const voucher = vouchers[0];
          
          // Validate voucher
          const now = new Date();
          const startDate = new Date(voucher.start_date);
          const endDate = new Date(voucher.end_date);

          if (now >= startDate && now <= endDate && subtotalExcludingVat >= parseFloat(voucher.minimum_order_amount)) {
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
            const avgVATRate = (totalVatAmount / subtotalExcludingVat) * 100;
            totalVatAmount = discountedSubtotal * (avgVATRate / 100);
          }
        }
      }

      const shippingCostNum = parseFloat(shipping_cost);
      const totalAmount = subtotalExcludingVat + totalVatAmount - discountAmount + shippingCostNum;

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Create order
      const orderQuery = `
        INSERT INTO orders (
          order_number, user_id, guest_name, guest_email, guest_phone,
          shipping_address, shipping_subdistrict, shipping_district,
          shipping_province, shipping_postal_code,
          subtotal_excluding_vat, total_vat_amount, discount_amount,
          shipping_cost, total_amount, voucher_code,
          status, payment_status, source_platform, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [orderResult] = await connection.execute(orderQuery, [
        orderNumber,
        user_id,
        guest_name,
        guest_email,
        guest_phone,
        shipping_address,
        shipping_subdistrict,
        shipping_district,
        shipping_province,
        shipping_postal_code,
        subtotalExcludingVat.toFixed(2),
        totalVatAmount.toFixed(2),
        discountAmount.toFixed(2),
        shippingCostNum.toFixed(2),
        totalAmount.toFixed(2),
        voucher_code,
        'pending',
        'pending',
        source_platform,
        notes,
        created_by
      ]);

      const orderId = orderResult.insertId;

      // Create order items and update stock
      for (const item of orderItems) {
        // Insert order item
        const orderItemQuery = `
          INSERT INTO order_items (
            order_id, product_id, product_name, product_sku,
            quantity, unit_price_excluding_vat, vat_rate,
            unit_vat_amount, unit_price_including_vat
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.execute(orderItemQuery, [
          orderId,
          item.product_id,
          item.product_name,
          item.product_sku,
          item.quantity,
          item.unit_price_excluding_vat,
          item.vat_rate,
          item.unit_vat_amount,
          item.unit_price_including_vat
        ]);

        // Update product stock
        await connection.execute(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );

        // Create stock history entry
        await connection.execute(`
          INSERT INTO stock_history (
            product_id, quantity_change, quantity_before, quantity_after,
            change_type, reference_id, reference_type, notes, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.product_id,
          -item.quantity,
          item.stock_quantity,
          item.stock_quantity - item.quantity,
          'sale',
          orderId,
          'order',
          `Order ${orderNumber}`,
          created_by
        ]);
      }

      // Record voucher usage if applicable
      if (voucher_code && discountAmount > 0) {
        const [vouchers] = await connection.query(
          'SELECT id FROM vouchers WHERE code = ?',
          [voucher_code]
        );

        if (vouchers.length > 0) {
          await connection.execute(
            'INSERT INTO voucher_usage (voucher_id, user_id, order_id) VALUES (?, ?, ?)',
            [vouchers[0].id, user_id, orderId]
          );

          // Increment voucher usage count
          await connection.execute(
            'UPDATE vouchers SET usage_count = usage_count + 1 WHERE id = ?',
            [vouchers[0].id]
          );
        }
      }

      await connection.commit();
      
      return await this.findById(orderId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Find order by ID
   * @param {number} id - Order ID
   * @returns {Promise<Object|null>} Order with items
   */
  static async findById(id) {
    const [orders] = await db.pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];

    // Get order items
    const [items] = await db.pool.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [id]
    );

    order.items = items;
    return order;
  }

  /**
   * Find order by order number
   * @param {string} orderNumber - Order number
   * @returns {Promise<Object|null>} Order with items
   */
  static async findByOrderNumber(orderNumber) {
    const [orders] = await db.pool.query(
      'SELECT * FROM orders WHERE order_number = ?',
      [orderNumber]
    );

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];

    // Get order items
    const [items] = await db.pool.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );

    order.items = items;
    return order;
  }

  /**
   * Find guest order by order number and contact info
   * @param {string} orderNumber - Order number
   * @param {string} contact - Phone or email
   * @returns {Promise<Object|null>} Order with items
   */
  static async findGuestOrder(orderNumber, contact) {
    const [orders] = await db.pool.query(
      'SELECT * FROM orders WHERE order_number = ? AND (guest_phone = ? OR guest_email = ?)',
      [orderNumber, contact, contact]
    );

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];

    // Get order items
    const [items] = await db.pool.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );

    order.items = items;
    return order;
  }

  /**
   * Get all orders with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Orders and pagination info
   */
  static async findAll(options = {}) {
    const {
      user_id = null,
      status = null,
      payment_status = null,
      source_platform = null,
      search = '',
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = 1,
      limit = 20
    } = options;

    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    // Filters
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (payment_status) {
      query += ' AND payment_status = ?';
      params.push(payment_status);
    }

    if (source_platform) {
      query += ' AND source_platform = ?';
      params.push(source_platform);
    }

    if (search) {
      query += ' AND (order_number LIKE ? OR guest_name LIKE ? OR guest_email LIKE ? OR guest_phone LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Sorting
    const allowedSortFields = ['order_number', 'total_amount', 'status', 'payment_status', 'created_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortDirection}`;

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [orders] = await db.pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const countParams = [];

    if (user_id) {
      countQuery += ' AND user_id = ?';
      countParams.push(user_id);
    }

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (payment_status) {
      countQuery += ' AND payment_status = ?';
      countParams.push(payment_status);
    }

    if (source_platform) {
      countQuery += ' AND source_platform = ?';
      countParams.push(source_platform);
    }

    if (search) {
      countQuery += ' AND (order_number LIKE ? OR guest_name LIKE ? OR guest_email LIKE ? OR guest_phone LIKE ?)';
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const [countResult] = await db.pool.query(countQuery, countParams);
    const total = countResult[0].total;

    return {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update order status
   * @param {number} id - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated order
   */
  static async updateStatus(id, status) {
    const validStatuses = ['pending', 'paid', 'packing', 'packed', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }

    await db.pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );

    return await this.findById(id);
  }

  /**
   * Update payment status
   * @param {number} id - Order ID
   * @param {string} paymentStatus - New payment status
   * @returns {Promise<Object>} Updated order
   */
  static async updatePaymentStatus(id, paymentStatus) {
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    
    if (!validStatuses.includes(paymentStatus)) {
      throw new Error('Invalid payment status');
    }

    await db.pool.execute(
      'UPDATE orders SET payment_status = ? WHERE id = ?',
      [paymentStatus, id]
    );

    // If payment is confirmed, update order status to paid
    if (paymentStatus === 'paid') {
      await db.pool.execute(
        'UPDATE orders SET status = ? WHERE id = ? AND status = ?',
        ['paid', id, 'pending']
      );
    }

    return await this.findById(id);
  }

  /**
   * Update tracking number
   * @param {number} id - Order ID
   * @param {string} trackingNumber - Tracking number
   * @returns {Promise<Object>} Updated order
   */
  static async updateTrackingNumber(id, trackingNumber) {
    await db.pool.execute(
      'UPDATE orders SET tracking_number = ? WHERE id = ?',
      [trackingNumber, id]
    );

    return await this.findById(id);
  }

  /**
   * Update packing media path
   * @param {number} id - Order ID
   * @param {string} mediaPath - Path to packing media
   * @returns {Promise<Object>} Updated order
   */
  static async updatePackingMedia(id, mediaPath) {
    await db.pool.execute(
      'UPDATE orders SET packing_media_path = ? WHERE id = ?',
      [mediaPath, id]
    );

    return await this.findById(id);
  }

  /**
   * Cancel order and restore stock
   * @param {number} id - Order ID
   * @param {number} cancelledBy - User ID who cancelled
   * @returns {Promise<Object>} Updated order
   */
  static async cancel(id, cancelledBy = null) {
    const connection = await db.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get order
      const [orders] = await connection.query(
        'SELECT * FROM orders WHERE id = ?',
        [id]
      );

      if (orders.length === 0) {
        throw new Error('Order not found');
      }

      const order = orders[0];

      // Only allow cancellation if order is pending or paid
      if (!['pending', 'paid'].includes(order.status)) {
        throw new Error('Order cannot be cancelled at this stage');
      }

      // Get order items
      const [items] = await connection.query(
        'SELECT * FROM order_items WHERE order_id = ?',
        [id]
      );

      // Restore stock for each item
      for (const item of items) {
        await connection.execute(
          'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );

        // Create stock history entry
        const [productData] = await connection.execute(
          'SELECT stock_quantity FROM products WHERE id = ?',
          [item.product_id]
        );

        await connection.execute(`
          INSERT INTO stock_history (
            product_id, quantity_change, quantity_before, quantity_after,
            change_type, reference_id, reference_type, notes, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.product_id,
          item.quantity,
          productData[0].stock_quantity - item.quantity,
          productData[0].stock_quantity,
          'return',
          id,
          'order_cancellation',
          `Order ${order.order_number} cancelled`,
          cancelledBy
        ]);
      }

      // Update order status
      await connection.execute(
        'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?',
        ['cancelled', 'refunded', id]
      );

      await connection.commit();
      
      return await this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Order;
