/**
 * Property-Based Tests for Guest Order Lookup Accuracy
 * Feature: itkmmshop-ecommerce, Property 3: Guest Order Lookup Accuracy
 * Validates: Requirements 1.3
 * 
 * For any valid order number and matching contact information, the system 
 * should return the correct order status and tracking information
 */

const fc = require('fast-check');
const { pool } = require('../config/database');

// Mock the database module
jest.mock('../config/database', () => {
  const actualDb = jest.requireActual('../config/database');
  return {
    ...actualDb,
    query: (...args) => actualDb.pool.query(...args),
    execute: (...args) => actualDb.pool.execute(...args),
    end: () => actualDb.pool.end()
  };
});

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

describe('Guest Order Lookup Accuracy - Property-Based Tests', () => {
  let testCategory;

  beforeAll(async () => {
    testCategory = await ProductCategory.create({
      name: 'Test Category for Guest Lookup',
      description: 'Category for guest order lookup tests'
    });
  });

  afterAll(async () => {
    if (testCategory) {
      await pool.query('DELETE FROM product_categories WHERE id = ?', [testCategory.id]);
    }
    await pool.end();
  });

  afterEach(async () => {
    // Clean up test data in correct order to avoid foreign key constraints
    // 1. Delete order items first
    await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE "ORD-%-TEST%")');
    // 2. Delete orders
    await pool.query('DELETE FROM orders WHERE order_number LIKE "ORD-%-TEST%"');
    // 3. Delete cart items
    await pool.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE session_id LIKE "test-lookup-%")');
    // 4. Delete carts
    await pool.query('DELETE FROM carts WHERE session_id LIKE "test-lookup-%"');
    // 5. Finally delete products (no longer referenced)
    await pool.query('DELETE FROM products WHERE sku LIKE "TEST-LOOKUP-%"');
  });

  /**
   * Property 3: Guest Order Lookup Accuracy
   * Validates: Requirements 1.3
   * 
   * For any valid order number and matching contact information, the system 
   * should return the correct order status and tracking information
   */
  describe('Property 3: Guest Order Lookup Accuracy', () => {
    test('should find order with correct phone number', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 10, max: 500, noNaN: true }),
          fc.integer({ min: 1, max: 10 }),
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 20 }),
          fc.string({ minLength: 10, maxLength: 255 }),
          async (price, quantity, guestName, guestEmail, guestPhone, shippingAddress) => {
            const roundedPrice = Math.round(price * 100) / 100;
            const sku = `TEST-LOOKUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Product for lookup test',
              category_id: testCategory.id,
              price_excluding_vat: roundedPrice,
              vat_rate: 7.00,
              stock_quantity: quantity + 10
            });

            const sessionId = `test-lookup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, quantity);

            const orderData = {
              cart_id: cart.id,
              user_id: null,
              guest_name: guestName,
              guest_email: guestEmail,
              guest_phone: guestPhone,
              shipping_address: shippingAddress,
              shipping_cost: 0,
              source_platform: 'website'
            };

            const createdOrder = await Order.createFromCart(orderData);

            // Property: Should find order with order number and phone
            const foundOrder = await Order.findGuestOrder(createdOrder.order_number, guestPhone);

            expect(foundOrder).toBeDefined();
            expect(foundOrder.id).toBe(createdOrder.id);
            expect(foundOrder.order_number).toBe(createdOrder.order_number);
            expect(foundOrder.guest_phone).toBe(guestPhone);
            expect(foundOrder.guest_email).toBe(guestEmail);
            expect(foundOrder.guest_name).toBe(guestName);
            expect(foundOrder.status).toBe('pending');
            expect(foundOrder.items).toBeDefined();
            expect(foundOrder.items.length).toBeGreaterThan(0);

            // Clean up
            await pool.query('DELETE FROM order_items WHERE order_id = ?', [createdOrder.id]);
            await pool.query('DELETE FROM orders WHERE id = ?', [createdOrder.id]);
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 100 }
      );
    }, 30000); // 30 second timeout for property-based test

    test('should find order with correct email', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 10, max: 500, noNaN: true }),
          fc.integer({ min: 1, max: 10 }),
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 20 }),
          fc.string({ minLength: 10, maxLength: 255 }),
          async (price, quantity, guestName, guestEmail, guestPhone, shippingAddress) => {
            const roundedPrice = Math.round(price * 100) / 100;
            const sku = `TEST-LOOKUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Product for email lookup test',
              category_id: testCategory.id,
              price_excluding_vat: roundedPrice,
              vat_rate: 7.00,
              stock_quantity: quantity + 10
            });

            const sessionId = `test-lookup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, quantity);

            const orderData = {
              cart_id: cart.id,
              user_id: null,
              guest_name: guestName,
              guest_email: guestEmail,
              guest_phone: guestPhone,
              shipping_address: shippingAddress,
              shipping_cost: 0,
              source_platform: 'website'
            };

            const createdOrder = await Order.createFromCart(orderData);

            // Property: Should find order with order number and email
            const foundOrder = await Order.findGuestOrder(createdOrder.order_number, guestEmail);

            expect(foundOrder).toBeDefined();
            expect(foundOrder.id).toBe(createdOrder.id);
            expect(foundOrder.order_number).toBe(createdOrder.order_number);
            expect(foundOrder.guest_email).toBe(guestEmail);
            expect(foundOrder.guest_phone).toBe(guestPhone);
            expect(foundOrder.status).toBe('pending');

            // Clean up
            await pool.query('DELETE FROM order_items WHERE order_id = ?', [createdOrder.id]);
            await pool.query('DELETE FROM orders WHERE id = ?', [createdOrder.id]);
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should not find order with incorrect contact information', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 10, max: 500, noNaN: true }),
          fc.integer({ min: 1, max: 10 }),
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 20 }),
          fc.emailAddress(), // different email
          fc.string({ minLength: 10, maxLength: 20 }), // different phone
          fc.string({ minLength: 10, maxLength: 255 }),
          async (price, quantity, guestName, guestEmail, guestPhone, wrongEmail, wrongPhone, shippingAddress) => {
            // Ensure wrong contact info is different
            if (wrongEmail === guestEmail || wrongPhone === guestPhone) {
              return; // Skip this test case
            }

            const roundedPrice = Math.round(price * 100) / 100;
            const sku = `TEST-LOOKUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Product for negative lookup test',
              category_id: testCategory.id,
              price_excluding_vat: roundedPrice,
              vat_rate: 7.00,
              stock_quantity: quantity + 10
            });

            const sessionId = `test-lookup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, quantity);

            const orderData = {
              cart_id: cart.id,
              user_id: null,
              guest_name: guestName,
              guest_email: guestEmail,
              guest_phone: guestPhone,
              shipping_address: shippingAddress,
              shipping_cost: 0,
              source_platform: 'website'
            };

            const createdOrder = await Order.createFromCart(orderData);

            // Property: Should NOT find order with wrong contact info
            const foundWithWrongEmail = await Order.findGuestOrder(createdOrder.order_number, wrongEmail);
            const foundWithWrongPhone = await Order.findGuestOrder(createdOrder.order_number, wrongPhone);

            expect(foundWithWrongEmail).toBeNull();
            expect(foundWithWrongPhone).toBeNull();

            // Clean up
            await pool.query('DELETE FROM order_items WHERE order_id = ?', [createdOrder.id]);
            await pool.query('DELETE FROM orders WHERE id = ?', [createdOrder.id]);
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return order with current status and tracking info', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 10, max: 500, noNaN: true }),
          fc.integer({ min: 1, max: 5 }),
          fc.constantFrom('pending', 'paid', 'packing', 'packed', 'shipped'),
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 20 }),
          fc.string({ minLength: 10, maxLength: 255 }),
          async (price, quantity, orderStatus, guestName, guestEmail, guestPhone, shippingAddress) => {
            const roundedPrice = Math.round(price * 100) / 100;
            const sku = `TEST-LOOKUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Product for status lookup test',
              category_id: testCategory.id,
              price_excluding_vat: roundedPrice,
              vat_rate: 7.00,
              stock_quantity: quantity + 10
            });

            const sessionId = `test-lookup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, quantity);

            const orderData = {
              cart_id: cart.id,
              user_id: null,
              guest_name: guestName,
              guest_email: guestEmail,
              guest_phone: guestPhone,
              shipping_address: shippingAddress,
              shipping_cost: 0,
              source_platform: 'website'
            };

            const createdOrder = await Order.createFromCart(orderData);

            // Update order status
            await Order.updateStatus(createdOrder.id, orderStatus);

            // Add tracking number if shipped
            if (orderStatus === 'shipped') {
              const trackingNumber = `TRACK-${Date.now()}`;
              await Order.updateTrackingNumber(createdOrder.id, trackingNumber);
            }

            // Property: Lookup should return current status and tracking info
            const foundOrder = await Order.findGuestOrder(createdOrder.order_number, guestPhone);

            expect(foundOrder).toBeDefined();
            expect(foundOrder.status).toBe(orderStatus);

            if (orderStatus === 'shipped') {
              expect(foundOrder.tracking_number).toBeDefined();
              expect(foundOrder.tracking_number).toMatch(/^TRACK-/);
            }

            // Clean up
            await pool.query('DELETE FROM order_items WHERE order_id = ?', [createdOrder.id]);
            await pool.query('DELETE FROM orders WHERE id = ?', [createdOrder.id]);
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return complete order information including items', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              price: fc.double({ min: 10, max: 500, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 5 })
            }),
            { minLength: 1, maxLength: 3 }
          ),
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 20 }),
          fc.string({ minLength: 10, maxLength: 255 }),
          async (productSpecs, guestName, guestEmail, guestPhone, shippingAddress) => {
            const sessionId = `test-lookup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            const createdProducts = [];

            try {
              // Create products and add to cart
              for (const spec of productSpecs) {
                const price = Math.round(spec.price * 100) / 100;
                const sku = `TEST-LOOKUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                const product = await Product.create({
                  sku,
                  name: `Test Product ${sku}`,
                  description: 'Product for multi-item lookup',
                  category_id: testCategory.id,
                  price_excluding_vat: price,
                  vat_rate: 7.00,
                  stock_quantity: spec.quantity + 10
                });

                createdProducts.push(product);
                await Cart.addItem(cart.id, product.id, spec.quantity);
              }

              const orderData = {
                cart_id: cart.id,
                user_id: null,
                guest_name: guestName,
                guest_email: guestEmail,
                guest_phone: guestPhone,
                shipping_address: shippingAddress,
                shipping_cost: 0,
                source_platform: 'website'
              };

              const createdOrder = await Order.createFromCart(orderData);

              // Property: Lookup should return complete order with all items
              const foundOrder = await Order.findGuestOrder(createdOrder.order_number, guestEmail);

              expect(foundOrder).toBeDefined();
              expect(foundOrder.items).toBeDefined();
              expect(foundOrder.items.length).toBe(productSpecs.length);

              // Verify all items are included
              for (const item of foundOrder.items) {
                expect(item.product_name).toBeDefined();
                expect(item.quantity).toBeGreaterThan(0);
                expect(item.unit_price_excluding_vat).toBeDefined();
                expect(item.unit_vat_amount).toBeDefined();
              }

              // Clean up
              await pool.query('DELETE FROM order_items WHERE order_id = ?', [createdOrder.id]);
              await pool.query('DELETE FROM orders WHERE id = ?', [createdOrder.id]);
            } finally {
              for (const product of createdProducts) {
                await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Unit tests for specific examples
  describe('Unit Tests - Specific Examples', () => {
    test('should find order with phone number', async () => {
      const sku = `TEST-LOOKUP-${Date.now()}-UNIT`;
      const product = await Product.create({
        sku,
        name: 'Lookup Test Product',
        description: 'Product for unit test',
        category_id: testCategory.id,
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 50
      });

      const sessionId = `test-lookup-${Date.now()}-unit`;
      const cart = await Cart.findOrCreate(null, sessionId);
      await Cart.addItem(cart.id, product.id, 2);

      const orderData = {
        cart_id: cart.id,
        user_id: null,
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        guest_phone: '0812345678',
        shipping_address: '123 Test Street',
        shipping_cost: 0,
        source_platform: 'website'
      };

      const createdOrder = await Order.createFromCart(orderData);
      const foundOrder = await Order.findGuestOrder(createdOrder.order_number, '0812345678');

      expect(foundOrder).toBeDefined();
      expect(foundOrder.id).toBe(createdOrder.id);
      expect(foundOrder.guest_phone).toBe('0812345678');

      await pool.query('DELETE FROM order_items WHERE order_id = ?', [createdOrder.id]);
      await pool.query('DELETE FROM orders WHERE id = ?', [createdOrder.id]);
      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    });

    test('should find order with email', async () => {
      const sku = `TEST-LOOKUP-${Date.now()}-EMAIL`;
      const product = await Product.create({
        sku,
        name: 'Email Lookup Product',
        description: 'Product for email lookup',
        category_id: testCategory.id,
        price_excluding_vat: 75.00,
        vat_rate: 7.00,
        stock_quantity: 30
      });

      const sessionId = `test-lookup-${Date.now()}-email`;
      const cart = await Cart.findOrCreate(null, sessionId);
      await Cart.addItem(cart.id, product.id, 1);

      const orderData = {
        cart_id: cart.id,
        user_id: null,
        guest_name: 'Jane Smith',
        guest_email: 'jane@example.com',
        guest_phone: '0898765432',
        shipping_address: '456 Test Avenue',
        shipping_cost: 0,
        source_platform: 'website'
      };

      const createdOrder = await Order.createFromCart(orderData);
      const foundOrder = await Order.findGuestOrder(createdOrder.order_number, 'jane@example.com');

      expect(foundOrder).toBeDefined();
      expect(foundOrder.id).toBe(createdOrder.id);
      expect(foundOrder.guest_email).toBe('jane@example.com');

      await pool.query('DELETE FROM order_items WHERE order_id = ?', [createdOrder.id]);
      await pool.query('DELETE FROM orders WHERE id = ?', [createdOrder.id]);
      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    });

    test('should not find order with wrong contact info', async () => {
      const sku = `TEST-LOOKUP-${Date.now()}-WRONG`;
      const product = await Product.create({
        sku,
        name: 'Wrong Contact Product',
        description: 'Product for wrong contact test',
        category_id: testCategory.id,
        price_excluding_vat: 50.00,
        vat_rate: 7.00,
        stock_quantity: 20
      });

      const sessionId = `test-lookup-${Date.now()}-wrong`;
      const cart = await Cart.findOrCreate(null, sessionId);
      await Cart.addItem(cart.id, product.id, 1);

      const orderData = {
        cart_id: cart.id,
        user_id: null,
        guest_name: 'Test User',
        guest_email: 'test@example.com',
        guest_phone: '0811111111',
        shipping_address: 'Test Address',
        shipping_cost: 0,
        source_platform: 'website'
      };

      const createdOrder = await Order.createFromCart(orderData);
      const foundOrder = await Order.findGuestOrder(createdOrder.order_number, 'wrong@example.com');

      expect(foundOrder).toBeNull();

      await pool.query('DELETE FROM order_items WHERE order_id = ?', [createdOrder.id]);
      await pool.query('DELETE FROM orders WHERE id = ?', [createdOrder.id]);
      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    });
  });
});
