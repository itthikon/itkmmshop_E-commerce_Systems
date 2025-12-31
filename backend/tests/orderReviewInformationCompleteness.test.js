/**
 * Property-Based Tests for Order Review Information Completeness
 * Feature: itkmmshop-ecommerce, Property 10: Order Review Information Completeness
 * Validates: Requirements 6.1
 * 
 * For any order proceeding to review, the system should display itemized list 
 * with all required fields (product name, quantity, unit price excluding VAT, 
 * VAT per unit, line total)
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

describe('Order Review Information Completeness - Property-Based Tests', () => {
  let testCategory;

  beforeAll(async () => {
    testCategory = await ProductCategory.create({
      name: 'Test Category for Order Review',
      description: 'Category for order review tests'
    });
  });

  afterAll(async () => {
    if (testCategory) {
      await pool.query('DELETE FROM product_categories WHERE id = ?', [testCategory.id]);
    }
    await pool.end();
  });

  afterEach(async () => {
    await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE "ORD-%-TEST%")');
    await pool.query('DELETE FROM orders WHERE order_number LIKE "ORD-%-TEST%"');
    await pool.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE session_id LIKE "test-order-review-%")');
    await pool.query('DELETE FROM carts WHERE session_id LIKE "test-order-review-%"');
    await pool.query('DELETE FROM products WHERE sku LIKE "TEST-ORDER-REVIEW-%"');
  });

  /**
   * Property 10: Order Review Information Completeness
   * Validates: Requirements 6.1
   * 
   * For any order proceeding to review, the system should display itemized list 
   * with all required fields
   */
  describe('Property 10: Order Review Information Completeness', () => {
    test('should include all required fields for any order item', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 1, max: 5000, noNaN: true }),
          fc.constantFrom(7, 10, 15),
          fc.integer({ min: 1, max: 50 }),
          fc.string({ minLength: 5, maxLength: 100 }),
          async (price, vatRate, quantity, productName) => {
            const roundedPrice = Math.round(price * 100) / 100;
            const sku = `TEST-ORDER-REVIEW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const product = await Product.create({
              sku,
              name: productName,
              description: 'Product for order review test',
              category_id: testCategory.id,
              price_excluding_vat: roundedPrice,
              vat_rate: vatRate,
              stock_quantity: quantity + 10
            });

            const sessionId = `test-order-review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, quantity);

            const orderData = {
              cart_id: cart.id,
              user_id: null,
              guest_name: 'Test Guest',
              guest_email: 'test@example.com',
              guest_phone: '0812345678',
              shipping_address: 'Test Address',
              shipping_cost: 0,
              source_platform: 'website'
            };

            const order = await Order.createFromCart(orderData);

            // Property: Order must have items array
            expect(order.items).toBeDefined();
            expect(Array.isArray(order.items)).toBe(true);
            expect(order.items.length).toBeGreaterThan(0);

            const orderItem = order.items[0];

            // Property: Each order item must have product name
            expect(orderItem.product_name).toBeDefined();
            expect(orderItem.product_name).toBe(productName);

            // Property: Each order item must have product SKU
            expect(orderItem.product_sku).toBeDefined();
            expect(orderItem.product_sku).toBe(sku);

            // Property: Each order item must have quantity
            expect(orderItem.quantity).toBeDefined();
            expect(orderItem.quantity).toBe(quantity);

            // Property: Each order item must have unit price excluding VAT
            expect(orderItem.unit_price_excluding_vat).toBeDefined();
            expect(parseFloat(orderItem.unit_price_excluding_vat)).toBe(roundedPrice);

            // Property: Each order item must have VAT rate
            expect(orderItem.vat_rate).toBeDefined();
            expect(parseFloat(orderItem.vat_rate)).toBe(vatRate);

            // Property: Each order item must have unit VAT amount
            expect(orderItem.unit_vat_amount).toBeDefined();
            const expectedVATAmount = Math.round((roundedPrice * vatRate / 100) * 100) / 100;
            expect(Math.abs(parseFloat(orderItem.unit_vat_amount) - expectedVATAmount)).toBeLessThan(0.02);

            // Property: Each order item must have unit price including VAT
            expect(orderItem.unit_price_including_vat).toBeDefined();
            const expectedPriceIncludingVAT = Math.round((roundedPrice + expectedVATAmount) * 100) / 100;
            expect(Math.abs(parseFloat(orderItem.unit_price_including_vat) - expectedPriceIncludingVAT)).toBeLessThan(0.02);

            // Property: Each order item must have line totals
            expect(orderItem.line_total_excluding_vat).toBeDefined();
            expect(orderItem.line_total_vat).toBeDefined();
            expect(orderItem.line_total_including_vat).toBeDefined();

            // Clean up
            await pool.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
            await pool.query('DELETE FROM orders WHERE id = ?', [order.id]);
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should include complete information for multiple items in order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              price: fc.double({ min: 10, max: 1000, noNaN: true }),
              vatRate: fc.constantFrom(7, 10, 15),
              quantity: fc.integer({ min: 1, max: 20 }),
              name: fc.string({ minLength: 5, maxLength: 50 })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (productSpecs) => {
            const sessionId = `test-order-review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            const createdProducts = [];

            try {
              // Create and add multiple products
              for (const spec of productSpecs) {
                const price = Math.round(spec.price * 100) / 100;
                const sku = `TEST-ORDER-REVIEW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                const product = await Product.create({
                  sku,
                  name: spec.name,
                  description: 'Multi-item order review test',
                  category_id: testCategory.id,
                  price_excluding_vat: price,
                  vat_rate: spec.vatRate,
                  stock_quantity: spec.quantity + 10
                });

                createdProducts.push({ product, spec });
                await Cart.addItem(cart.id, product.id, spec.quantity);
              }

              const orderData = {
                cart_id: cart.id,
                user_id: null,
                guest_name: 'Multi Item Guest',
                guest_email: 'multi@example.com',
                guest_phone: '0899999999',
                shipping_address: 'Multi Item Address',
                shipping_cost: 0,
                source_platform: 'website'
              };

              const order = await Order.createFromCart(orderData);

              // Property: Order must have all items
              expect(order.items.length).toBe(productSpecs.length);

              // Property: Each item must have complete information
              for (let i = 0; i < order.items.length; i++) {
                const orderItem = order.items[i];
                const matchingProduct = createdProducts.find(
                  cp => cp.product.id === orderItem.product_id
                );

                expect(matchingProduct).toBeDefined();
                const { product, spec } = matchingProduct;
                const price = Math.round(spec.price * 100) / 100;

                // Verify all required fields are present and correct
                expect(orderItem.product_name).toBe(spec.name);
                expect(orderItem.product_sku).toBe(product.sku);
                expect(orderItem.quantity).toBe(spec.quantity);
                expect(parseFloat(orderItem.unit_price_excluding_vat)).toBe(price);
                expect(parseFloat(orderItem.vat_rate)).toBe(spec.vatRate);
                expect(orderItem.unit_vat_amount).toBeDefined();
                expect(orderItem.unit_price_including_vat).toBeDefined();
                expect(orderItem.line_total_excluding_vat).toBeDefined();
                expect(orderItem.line_total_vat).toBeDefined();
                expect(orderItem.line_total_including_vat).toBeDefined();
              }

              // Clean up
              await pool.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
              await pool.query('DELETE FROM orders WHERE id = ?', [order.id]);
            } finally {
              for (const { product } of createdProducts) {
                await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('should include order summary with all totals', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 10, max: 1000, noNaN: true }),
          fc.integer({ min: 1, max: 10 }),
          fc.double({ min: 0, max: 200, noNaN: true }), // shipping cost
          async (price, quantity, shippingCost) => {
            const roundedPrice = Math.round(price * 100) / 100;
            const roundedShipping = Math.round(shippingCost * 100) / 100;
            const sku = `TEST-ORDER-REVIEW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const product = await Product.create({
              sku,
              name: 'Summary Test Product',
              description: 'Product for order summary test',
              category_id: testCategory.id,
              price_excluding_vat: roundedPrice,
              vat_rate: 7.00,
              stock_quantity: quantity + 10
            });

            const sessionId = `test-order-review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, quantity);

            const orderData = {
              cart_id: cart.id,
              user_id: null,
              guest_name: 'Summary Guest',
              guest_email: 'summary@example.com',
              guest_phone: '0877777777',
              shipping_address: 'Summary Address',
              shipping_cost: roundedShipping,
              source_platform: 'website'
            };

            const order = await Order.createFromCart(orderData);

            // Property: Order must have subtotal excluding VAT
            expect(order.subtotal_excluding_vat).toBeDefined();
            const expectedSubtotal = roundedPrice * quantity;
            expect(Math.abs(parseFloat(order.subtotal_excluding_vat) - expectedSubtotal)).toBeLessThan(0.5);

            // Property: Order must have total VAT amount
            expect(order.total_vat_amount).toBeDefined();
            const expectedVAT = Math.round((expectedSubtotal * 0.07) * 100) / 100;
            expect(Math.abs(parseFloat(order.total_vat_amount) - expectedVAT)).toBeLessThan(0.5);

            // Property: Order must have discount amount (even if 0)
            expect(order.discount_amount).toBeDefined();

            // Property: Order must have shipping cost
            expect(order.shipping_cost).toBeDefined();
            expect(parseFloat(order.shipping_cost)).toBe(roundedShipping);

            // Property: Order must have total amount
            expect(order.total_amount).toBeDefined();
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

    test('should preserve line total calculations for any quantity', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 1, max: 500, noNaN: true }),
          fc.constantFrom(7, 10, 15),
          fc.integer({ min: 1, max: 100 }),
          async (price, vatRate, quantity) => {
            const roundedPrice = Math.round(price * 100) / 100;
            const sku = `TEST-ORDER-REVIEW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const product = await Product.create({
              sku,
              name: 'Line Total Test Product',
              description: 'Product for line total test',
              category_id: testCategory.id,
              price_excluding_vat: roundedPrice,
              vat_rate: vatRate,
              stock_quantity: quantity + 10
            });

            const sessionId = `test-order-review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, quantity);

            const orderData = {
              cart_id: cart.id,
              user_id: null,
              guest_name: 'Line Total Guest',
              guest_email: 'linetotal@example.com',
              guest_phone: '0866666666',
              shipping_address: 'Line Total Address',
              shipping_cost: 0,
              source_platform: 'website'
            };

            const order = await Order.createFromCart(orderData);
            const orderItem = order.items[0];

            // Property: Line total excluding VAT = unit price × quantity
            const expectedLineTotalExcludingVAT = Math.round((roundedPrice * quantity) * 100) / 100;
            expect(Math.abs(parseFloat(orderItem.line_total_excluding_vat) - expectedLineTotalExcludingVAT)).toBeLessThan(0.5);

            // Property: Line total VAT = unit VAT × quantity
            const unitVAT = Math.round((roundedPrice * vatRate / 100) * 100) / 100;
            const expectedLineTotalVAT = Math.round((unitVAT * quantity) * 100) / 100;
            expect(Math.abs(parseFloat(orderItem.line_total_vat) - expectedLineTotalVAT)).toBeLessThan(0.5);

            // Property: Line total including VAT = line total excluding VAT + line total VAT
            const expectedLineTotalIncludingVAT = expectedLineTotalExcludingVAT + expectedLineTotalVAT;
            expect(Math.abs(parseFloat(orderItem.line_total_including_vat) - expectedLineTotalIncludingVAT)).toBeLessThan(0.5);

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
    test('should include all required fields for standard order', async () => {
      const sku = `TEST-ORDER-REVIEW-${Date.now()}-UNIT`;
      const product = await Product.create({
        sku,
        name: 'Standard Review Product',
        description: 'Product for unit test',
        category_id: testCategory.id,
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 50
      });

      const sessionId = `test-order-review-${Date.now()}-unit`;
      const cart = await Cart.findOrCreate(null, sessionId);
      await Cart.addItem(cart.id, product.id, 2);

      const orderData = {
        cart_id: cart.id,
        user_id: null,
        guest_name: 'Unit Test Guest',
        guest_email: 'unit@example.com',
        guest_phone: '0812345678',
        shipping_address: 'Unit Test Address',
        shipping_cost: 50,
        source_platform: 'website'
      };

      const order = await Order.createFromCart(orderData);
      const orderItem = order.items[0];

      expect(orderItem.product_name).toBe('Standard Review Product');
      expect(orderItem.product_sku).toBe(sku);
      expect(orderItem.quantity).toBe(2);
      expect(parseFloat(orderItem.unit_price_excluding_vat)).toBe(100.00);
      expect(parseFloat(orderItem.vat_rate)).toBe(7.00);
      expect(parseFloat(orderItem.unit_vat_amount)).toBe(7.00);
      expect(parseFloat(orderItem.unit_price_including_vat)).toBe(107.00);
      expect(parseFloat(orderItem.line_total_excluding_vat)).toBe(200.00);
      expect(parseFloat(orderItem.line_total_vat)).toBe(14.00);
      expect(parseFloat(orderItem.line_total_including_vat)).toBe(214.00);

      expect(parseFloat(order.subtotal_excluding_vat)).toBe(200.00);
      expect(parseFloat(order.total_vat_amount)).toBe(14.00);
      expect(parseFloat(order.shipping_cost)).toBe(50.00);
      expect(parseFloat(order.total_amount)).toBe(264.00);

      await pool.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
      await pool.query('DELETE FROM orders WHERE id = ?', [order.id]);
      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    });

    test('should handle order with single quantity item', async () => {
      const sku = `TEST-ORDER-REVIEW-${Date.now()}-QTY1`;
      const product = await Product.create({
        sku,
        name: 'Single Quantity Product',
        description: 'Product with quantity 1',
        category_id: testCategory.id,
        price_excluding_vat: 99.99,
        vat_rate: 7.00,
        stock_quantity: 10
      });

      const sessionId = `test-order-review-${Date.now()}-qty1`;
      const cart = await Cart.findOrCreate(null, sessionId);
      await Cart.addItem(cart.id, product.id, 1);

      const orderData = {
        cart_id: cart.id,
        user_id: null,
        guest_name: 'Single Qty Guest',
        guest_email: 'single@example.com',
        guest_phone: '0855555555',
        shipping_address: 'Single Qty Address',
        shipping_cost: 0,
        source_platform: 'website'
      };

      const order = await Order.createFromCart(orderData);
      const orderItem = order.items[0];

      expect(orderItem.quantity).toBe(1);
      expect(parseFloat(orderItem.line_total_excluding_vat)).toBe(99.99);
      expect(parseFloat(orderItem.line_total_vat)).toBe(7.00);
      expect(parseFloat(orderItem.line_total_including_vat)).toBe(106.99);

      await pool.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
      await pool.query('DELETE FROM orders WHERE id = ?', [order.id]);
      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    });
  });
});
