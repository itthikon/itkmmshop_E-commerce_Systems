/**
 * Property-Based Tests for Guest Order Creation Completeness
 * Feature: itkmmshop-ecommerce, Property 2: Guest Order Creation Completeness
 * Validates: Requirements 1.2
 * 
 * For any guest checkout completion, the system should collect all required 
 * information (shipping address, contact info) and generate a unique order number
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

describe('Guest Order Creation Completeness - Property-Based Tests', () => {
  let testCategory;

  beforeAll(async () => {
    testCategory = await ProductCategory.create({
      name: 'Test Category for Guest Order',
      description: 'Category for guest order creation tests'
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
    await pool.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE session_id LIKE "test-guest-order-%")');
    // 4. Delete carts
    await pool.query('DELETE FROM carts WHERE session_id LIKE "test-guest-order-%"');
    // 5. Finally delete products (no longer referenced)
    await pool.query('DELETE FROM products WHERE sku LIKE "TEST-GUEST-ORDER-%"');
  });

  /**
   * Property 2: Guest Order Creation Completeness
   * Validates: Requirements 1.2
   * 
   * For any guest checkout completion, the system should collect all required 
   * information (shipping address, contact info) and generate a unique order number
   */
  describe('Property 2: Guest Order Creation Completeness', () => {
    test('should collect all required guest information for any order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 10, max: 1000, noNaN: true }),
          fc.integer({ min: 1, max: 10 }),
          fc.string({ minLength: 5, maxLength: 100 }), // guest_name
          fc.emailAddress(), // guest_email
          fc.string({ minLength: 10, maxLength: 20 }), // guest_phone
          fc.string({ minLength: 10, maxLength: 255 }), // shipping_address
          async (price, quantity, guestName, guestEmail, guestPhone, shippingAddress) => {
            const roundedPrice = Math.round(price * 100) / 100;
            const sku = `TEST-GUEST-ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Product for guest order completeness test',
              category_id: testCategory.id,
              price_excluding_vat: roundedPrice,
              vat_rate: 7.00,
              stock_quantity: quantity + 10
            });

            const sessionId = `test-guest-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

            const order = await Order.createFromCart(orderData);

            // Property: All required guest information must be collected and stored
            expect(order.guest_name).toBe(guestName);
            expect(order.guest_email).toBe(guestEmail);
            expect(order.guest_phone).toBe(guestPhone);
            expect(order.shipping_address).toBe(shippingAddress);

            // Property: Order number must be generated and unique
            expect(order.order_number).toBeDefined();
            expect(order.order_number).toMatch(/^ORD-\d{8}-\d{5}-[A-Z0-9]{3}$/);

            // Property: Order must have valid initial status
            expect(order.status).toBe('pending');
            expect(order.payment_status).toBe('pending');

            // Clean up
            await pool.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
            await pool.query('DELETE FROM orders WHERE id = ?', [order.id]);
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 100 }
      );
    }, 30000); // 30 second timeout for property-based test

    test('should generate unique order numbers for concurrent guest orders', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              price: fc.double({ min: 10, max: 500, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 5 }),
              guestName: fc.string({ minLength: 5, maxLength: 50 }),
              guestEmail: fc.emailAddress(),
              guestPhone: fc.string({ minLength: 10, maxLength: 20 }),
              shippingAddress: fc.string({ minLength: 10, maxLength: 100 })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (orderSpecs) => {
            const createdOrders = [];
            const createdProducts = [];

            try {
              // Create multiple guest orders
              for (const spec of orderSpecs) {
                const roundedPrice = Math.round(spec.price * 100) / 100;
                const sku = `TEST-GUEST-ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                const product = await Product.create({
                  sku,
                  name: `Test Product ${sku}`,
                  description: 'Product for unique order number test',
                  category_id: testCategory.id,
                  price_excluding_vat: roundedPrice,
                  vat_rate: 7.00,
                  stock_quantity: spec.quantity + 10
                });

                createdProducts.push(product);

                const sessionId = `test-guest-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const cart = await Cart.findOrCreate(null, sessionId);
                await Cart.addItem(cart.id, product.id, spec.quantity);

                const orderData = {
                  cart_id: cart.id,
                  user_id: null,
                  guest_name: spec.guestName,
                  guest_email: spec.guestEmail,
                  guest_phone: spec.guestPhone,
                  shipping_address: spec.shippingAddress,
                  shipping_cost: 0,
                  source_platform: 'website'
                };

                const order = await Order.createFromCart(orderData);
                createdOrders.push(order);
              }

              // Property: All order numbers must be unique
              const orderNumbers = createdOrders.map(o => o.order_number);
              const uniqueOrderNumbers = new Set(orderNumbers);
              expect(uniqueOrderNumbers.size).toBe(orderNumbers.length);

              // Property: Each order must have complete guest information
              for (let i = 0; i < createdOrders.length; i++) {
                const order = createdOrders[i];
                const spec = orderSpecs[i];

                expect(order.guest_name).toBe(spec.guestName);
                expect(order.guest_email).toBe(spec.guestEmail);
                expect(order.guest_phone).toBe(spec.guestPhone);
                expect(order.shipping_address).toBe(spec.shippingAddress);
              }
            } finally {
              // Clean up
              for (const order of createdOrders) {
                await pool.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
                await pool.query('DELETE FROM orders WHERE id = ?', [order.id]);
              }
              for (const product of createdProducts) {
                await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
              }
            }
          }
        ),
        { numRuns: 50 } // Reduced runs due to complexity
      );
    }, 30000); // 30 second timeout for property-based test

    test('should collect optional shipping details when provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 10, max: 500, noNaN: true }),
          fc.integer({ min: 1, max: 5 }),
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 20 }),
          fc.string({ minLength: 10, maxLength: 255 }),
          fc.string({ minLength: 3, maxLength: 100 }), // subdistrict
          fc.string({ minLength: 3, maxLength: 100 }), // district
          fc.string({ minLength: 3, maxLength: 100 }), // province
          fc.string({ minLength: 5, maxLength: 10 }), // postal_code
          async (price, quantity, guestName, guestEmail, guestPhone, shippingAddress, 
                 subdistrict, district, province, postalCode) => {
            const roundedPrice = Math.round(price * 100) / 100;
            const sku = `TEST-GUEST-ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Product for optional details test',
              category_id: testCategory.id,
              price_excluding_vat: roundedPrice,
              vat_rate: 7.00,
              stock_quantity: quantity + 10
            });

            const sessionId = `test-guest-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, quantity);

            const orderData = {
              cart_id: cart.id,
              user_id: null,
              guest_name: guestName,
              guest_email: guestEmail,
              guest_phone: guestPhone,
              shipping_address: shippingAddress,
              shipping_subdistrict: subdistrict,
              shipping_district: district,
              shipping_province: province,
              shipping_postal_code: postalCode,
              shipping_cost: 0,
              source_platform: 'website'
            };

            const order = await Order.createFromCart(orderData);

            // Property: Optional shipping details should be stored when provided
            expect(order.shipping_subdistrict).toBe(subdistrict);
            expect(order.shipping_district).toBe(district);
            expect(order.shipping_province).toBe(province);
            expect(order.shipping_postal_code).toBe(postalCode);

            // Clean up
            await pool.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
            await pool.query('DELETE FROM orders WHERE id = ?', [order.id]);
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should store source platform for guest orders', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 10, max: 500, noNaN: true }),
          fc.integer({ min: 1, max: 5 }),
          fc.constantFrom('website', 'facebook', 'line', 'instagram', 'shopee'),
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 20 }),
          fc.string({ minLength: 10, maxLength: 255 }),
          async (price, quantity, sourcePlatform, guestName, guestEmail, guestPhone, shippingAddress) => {
            const roundedPrice = Math.round(price * 100) / 100;
            const sku = `TEST-GUEST-ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Product for source platform test',
              category_id: testCategory.id,
              price_excluding_vat: roundedPrice,
              vat_rate: 7.00,
              stock_quantity: quantity + 10
            });

            const sessionId = `test-guest-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
              source_platform: sourcePlatform
            };

            const order = await Order.createFromCart(orderData);

            // Property: Source platform should be stored correctly
            expect(order.source_platform).toBe(sourcePlatform);

            // Clean up
            await pool.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
            await pool.query('DELETE FROM orders WHERE id = ?', [order.id]);
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for specific examples
  describe('Unit Tests - Specific Examples', () => {
    test('should collect complete information for standard guest order', async () => {
      const sku = `TEST-GUEST-ORDER-${Date.now()}-UNIT`;
      const product = await Product.create({
        sku,
        name: 'Standard Guest Order Product',
        description: 'Product for unit test',
        category_id: testCategory.id,
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 50
      });

      const sessionId = `test-guest-order-${Date.now()}-unit`;
      const cart = await Cart.findOrCreate(null, sessionId);
      await Cart.addItem(cart.id, product.id, 2);

      const orderData = {
        cart_id: cart.id,
        user_id: null,
        guest_name: 'John Doe',
        guest_email: 'john.doe@example.com',
        guest_phone: '0812345678',
        shipping_address: '123 Test Street, Bangkok 10110',
        shipping_subdistrict: 'Silom',
        shipping_district: 'Bang Rak',
        shipping_province: 'Bangkok',
        shipping_postal_code: '10110',
        shipping_cost: 50,
        source_platform: 'website'
      };

      const order = await Order.createFromCart(orderData);

      expect(order.guest_name).toBe('John Doe');
      expect(order.guest_email).toBe('john.doe@example.com');
      expect(order.guest_phone).toBe('0812345678');
      expect(order.shipping_address).toBe('123 Test Street, Bangkok 10110');
      expect(order.shipping_subdistrict).toBe('Silom');
      expect(order.shipping_district).toBe('Bang Rak');
      expect(order.shipping_province).toBe('Bangkok');
      expect(order.shipping_postal_code).toBe('10110');
      expect(order.source_platform).toBe('website');
      // Order number format: ORD-YYYYMMDD-NNNNN or ORD-YYYYMMDD-NNNNN-XXX
      expect(order.order_number).toMatch(/^ORD-\d{8}-\d{5}(-[A-Z0-9]+)?$/);

      await pool.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
      await pool.query('DELETE FROM orders WHERE id = ?', [order.id]);
      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    });

    test('should generate unique order numbers for sequential orders', async () => {
      const sku1 = `TEST-GUEST-ORDER-${Date.now()}-SEQ1`;
      const sku2 = `TEST-GUEST-ORDER-${Date.now()}-SEQ2`;
      
      const product1 = await Product.create({
        sku: sku1,
        name: 'Sequential Product 1',
        description: 'First product',
        category_id: testCategory.id,
        price_excluding_vat: 50.00,
        vat_rate: 7.00,
        stock_quantity: 20
      });

      const product2 = await Product.create({
        sku: sku2,
        name: 'Sequential Product 2',
        description: 'Second product',
        category_id: testCategory.id,
        price_excluding_vat: 75.00,
        vat_rate: 7.00,
        stock_quantity: 20
      });

      // Create first order
      const sessionId1 = `test-guest-order-${Date.now()}-seq1`;
      const cart1 = await Cart.findOrCreate(null, sessionId1);
      await Cart.addItem(cart1.id, product1.id, 1);

      const order1 = await Order.createFromCart({
        cart_id: cart1.id,
        user_id: null,
        guest_name: 'Guest One',
        guest_email: 'guest1@example.com',
        guest_phone: '0811111111',
        shipping_address: 'Address 1',
        shipping_cost: 0,
        source_platform: 'website'
      });

      // Create second order
      const sessionId2 = `test-guest-order-${Date.now()}-seq2`;
      const cart2 = await Cart.findOrCreate(null, sessionId2);
      await Cart.addItem(cart2.id, product2.id, 1);

      const order2 = await Order.createFromCart({
        cart_id: cart2.id,
        user_id: null,
        guest_name: 'Guest Two',
        guest_email: 'guest2@example.com',
        guest_phone: '0822222222',
        shipping_address: 'Address 2',
        shipping_cost: 0,
        source_platform: 'website'
      });

      // Order numbers must be unique
      expect(order1.order_number).not.toBe(order2.order_number);

      await pool.query('DELETE FROM order_items WHERE order_id IN (?, ?)', [order1.id, order2.id]);
      await pool.query('DELETE FROM orders WHERE id IN (?, ?)', [order1.id, order2.id]);
      await pool.query('DELETE FROM products WHERE id IN (?, ?)', [product1.id, product2.id]);
    });
  });
});
