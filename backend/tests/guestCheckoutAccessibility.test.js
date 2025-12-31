/**
 * Property-Based Tests for Guest Checkout Accessibility
 * Feature: itkmmshop-ecommerce, Property 1: Guest Checkout Accessibility
 * Validates: Requirements 1.1
 * 
 * For any valid shopping cart with products, the system should allow 
 * checkout completion without requiring user authentication
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

describe('Guest Checkout Accessibility - Property-Based Tests', () => {
  let testCategory;

  beforeAll(async () => {
    // Create a test category
    testCategory = await ProductCategory.create({
      name: 'Test Category for Guest Checkout',
      description: 'Category for guest checkout tests'
    });
  });

  afterAll(async () => {
    // Clean up test category
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
    await pool.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE session_id LIKE "test-guest-%")');
    // 4. Delete carts
    await pool.query('DELETE FROM carts WHERE session_id LIKE "test-guest-%"');
    // 5. Finally delete products (no longer referenced)
    await pool.query('DELETE FROM products WHERE sku LIKE "TEST-GUEST-%"');
  });

  /**
   * Property 1: Guest Checkout Accessibility
   * Validates: Requirements 1.1
   * 
   * For any valid shopping cart with products, the system should allow 
   * checkout completion without requiring user authentication
   */
  describe('Property 1: Guest Checkout Accessibility', () => {
    test('should allow guest checkout for any valid cart with products', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              price: fc.double({ min: 1, max: 1000, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 10 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.string({ minLength: 5, maxLength: 100 }), // guest_name
          fc.emailAddress(), // guest_email
          fc.string({ minLength: 10, maxLength: 20 }), // guest_phone
          fc.string({ minLength: 10, maxLength: 255 }), // shipping_address
          async (productSpecs, guestName, guestEmail, guestPhone, shippingAddress) => {
            const sessionId = `test-guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            const createdProducts = [];

            try {
              // Create products and add to cart
              for (const spec of productSpecs) {
                const price = Math.round(spec.price * 100) / 100;
                const sku = `TEST-GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                const product = await Product.create({
                  sku,
                  name: `Test Product ${sku}`,
                  description: 'Test product for guest checkout',
                  category_id: testCategory.id,
                  price_excluding_vat: price,
                  vat_rate: 7.00,
                  stock_quantity: spec.quantity + 10
                });

                createdProducts.push(product);
                await Cart.addItem(cart.id, product.id, spec.quantity);
              }

              // Property: Guest should be able to create order without user_id (authentication)
              const orderData = {
                cart_id: cart.id,
                user_id: null, // No authentication
                guest_name: guestName,
                guest_email: guestEmail,
                guest_phone: guestPhone,
                shipping_address: shippingAddress,
                shipping_cost: 0,
                source_platform: 'website'
              };

              const order = await Order.createFromCart(orderData);

              // Verify order was created successfully without authentication
              expect(order).toBeDefined();
              expect(order.id).toBeDefined();
              expect(order.order_number).toBeDefined();
              
              // Property: Order should be created as guest order (no user_id)
              expect(order.user_id).toBeNull();
              
              // Property: Guest information should be stored
              expect(order.guest_name).toBe(guestName);
              expect(order.guest_email).toBe(guestEmail);
              expect(order.guest_phone).toBe(guestPhone);
              expect(order.shipping_address).toBe(shippingAddress);
              
              // Property: Order should have items from cart
              expect(order.items).toBeDefined();
              expect(order.items.length).toBe(productSpecs.length);
              
              // Property: Order should have valid status
              expect(order.status).toBe('pending');
              expect(order.payment_status).toBe('pending');

              // Clean up order
              await pool.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
              await pool.query('DELETE FROM orders WHERE id = ?', [order.id]);
            } finally {
              // Clean up products
              for (const product of createdProducts) {
                await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should allow guest checkout with single product', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 1, max: 5000, noNaN: true }),
          fc.integer({ min: 1, max: 50 }),
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 20 }),
          fc.string({ minLength: 10, maxLength: 255 }),
          async (price, quantity, guestName, guestEmail, guestPhone, shippingAddress) => {
            const roundedPrice = Math.round(price * 100) / 100;
            const sku = `TEST-GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Single product for guest checkout',
              category_id: testCategory.id,
              price_excluding_vat: roundedPrice,
              vat_rate: 7.00,
              stock_quantity: quantity + 10
            });

            const sessionId = `test-guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, quantity);

            // Create order without authentication
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

            // Property: Guest checkout should succeed for single product
            expect(order).toBeDefined();
            expect(order.user_id).toBeNull();
            expect(order.items.length).toBe(1);
            expect(order.items[0].quantity).toBe(quantity);

            // Clean up
            await pool.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
            await pool.query('DELETE FROM orders WHERE id = ?', [order.id]);
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should allow guest checkout with varying shipping costs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 10, max: 500, noNaN: true }),
          fc.integer({ min: 1, max: 5 }),
          fc.double({ min: 0, max: 200, noNaN: true }), // shipping cost
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 20 }),
          fc.string({ minLength: 10, maxLength: 255 }),
          async (price, quantity, shippingCost, guestName, guestEmail, guestPhone, shippingAddress) => {
            const roundedPrice = Math.round(price * 100) / 100;
            const roundedShipping = Math.round(shippingCost * 100) / 100;
            const sku = `TEST-GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Product for shipping cost test',
              category_id: testCategory.id,
              price_excluding_vat: roundedPrice,
              vat_rate: 7.00,
              stock_quantity: quantity + 10
            });

            const sessionId = `test-guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, quantity);

            const orderData = {
              cart_id: cart.id,
              user_id: null,
              guest_name: guestName,
              guest_email: guestEmail,
              guest_phone: guestPhone,
              shipping_address: shippingAddress,
              shipping_cost: roundedShipping,
              source_platform: 'website'
            };

            const order = await Order.createFromCart(orderData);

            // Property: Guest checkout should work with any valid shipping cost
            expect(order).toBeDefined();
            expect(order.user_id).toBeNull();
            expect(parseFloat(order.shipping_cost)).toBe(roundedShipping);
            
            // Verify total includes shipping
            const expectedSubtotal = roundedPrice * quantity;
            const expectedVAT = Math.round((expectedSubtotal * 0.07) * 100) / 100;
            const expectedTotal = expectedSubtotal + expectedVAT + roundedShipping;
            
            expect(Math.abs(parseFloat(order.total_amount) - expectedTotal)).toBeLessThan(0.5);

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
    test('should allow guest checkout with standard product', async () => {
      const sku = `TEST-GUEST-${Date.now()}-UNIT`;
      const product = await Product.create({
        sku,
        name: 'Standard Guest Product',
        description: 'Product for guest checkout',
        category_id: testCategory.id,
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 50
      });

      const sessionId = `test-guest-${Date.now()}-unit`;
      const cart = await Cart.findOrCreate(null, sessionId);
      await Cart.addItem(cart.id, product.id, 2);

      const orderData = {
        cart_id: cart.id,
        user_id: null,
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        guest_phone: '0812345678',
        shipping_address: '123 Test Street, Bangkok',
        shipping_cost: 50,
        source_platform: 'website'
      };

      const order = await Order.createFromCart(orderData);

      expect(order).toBeDefined();
      expect(order.user_id).toBeNull();
      expect(order.guest_name).toBe('John Doe');
      expect(order.guest_email).toBe('john@example.com');
      expect(order.items.length).toBe(1);
      expect(parseFloat(order.total_amount)).toBe(264.00); // (100*2) + (14 VAT) + 50 shipping

      await pool.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
      await pool.query('DELETE FROM orders WHERE id = ?', [order.id]);
      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    });

    test('should allow guest checkout with multiple products', async () => {
      const sku1 = `TEST-GUEST-${Date.now()}-MULTI1`;
      const sku2 = `TEST-GUEST-${Date.now()}-MULTI2`;
      
      const product1 = await Product.create({
        sku: sku1,
        name: 'Product 1',
        description: 'First product',
        category_id: testCategory.id,
        price_excluding_vat: 50.00,
        vat_rate: 7.00,
        stock_quantity: 20
      });

      const product2 = await Product.create({
        sku: sku2,
        name: 'Product 2',
        description: 'Second product',
        category_id: testCategory.id,
        price_excluding_vat: 75.00,
        vat_rate: 7.00,
        stock_quantity: 20
      });

      const sessionId = `test-guest-${Date.now()}-multi`;
      const cart = await Cart.findOrCreate(null, sessionId);
      await Cart.addItem(cart.id, product1.id, 1);
      await Cart.addItem(cart.id, product2.id, 2);

      const orderData = {
        cart_id: cart.id,
        user_id: null,
        guest_name: 'Jane Smith',
        guest_email: 'jane@example.com',
        guest_phone: '0898765432',
        shipping_address: '456 Test Avenue, Bangkok',
        shipping_cost: 0,
        source_platform: 'website'
      };

      const order = await Order.createFromCart(orderData);

      expect(order).toBeDefined();
      expect(order.user_id).toBeNull();
      expect(order.items.length).toBe(2);
      expect(parseFloat(order.subtotal_excluding_vat)).toBe(200.00); // 50 + (75*2)

      await pool.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
      await pool.query('DELETE FROM orders WHERE id = ?', [order.id]);
      await pool.query('DELETE FROM products WHERE id IN (?, ?)', [product1.id, product2.id]);
    });
  });
});
