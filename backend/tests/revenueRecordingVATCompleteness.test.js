/**
 * Property-Based Tests for Revenue Recording VAT Completeness
 * Feature: itkmmshop-ecommerce, Property 14
 * Uses fast-check library for property-based testing
 */

const fc = require('fast-check');
const db = require('../config/database');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ProductCategory = require('../models/ProductCategory');

describe('Revenue Recording VAT Completeness - Property-Based Tests', () => {
  let testUser;
  let testCategory;
  let testProducts = [];

  beforeAll(async () => {
    // Create test user directly using pool
    const bcrypt = require('bcrypt');
    const password_hash = await bcrypt.hash('TestPassword123!', 10);
    const [userResult] = await db.pool.execute(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      [`revenue-test-${Date.now()}@test.com`, password_hash, 'Revenue', 'Test', 'customer']
    );
    testUser = { id: userResult.insertId };

    // Create test category
    testCategory = await ProductCategory.create({
      name: `Revenue Test Category ${Date.now()}`,
      description: 'Category for revenue testing'
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await db.pool.execute('DELETE FROM users WHERE id = ?', [testUser.id]);
    }
    if (testCategory) {
      await db.pool.execute('DELETE FROM product_categories WHERE id = ?', [testCategory.id]);
    }
    // Clean up test products
    for (const product of testProducts) {
      await db.pool.execute('DELETE FROM products WHERE id = ?', [product.id]);
    }
  });

  /**
   * Property 14: Revenue Recording VAT Completeness
   * Validates: Requirements 14.1
   * 
   * For any sales transaction, the system should record amount excluding VAT, 
   * VAT amount, and total amount for each item in the financial records
   */
  describe('Property 14: Revenue Recording VAT Completeness', () => {
    test('should record complete VAT breakdown for any order item', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              // Generate prices with 2 decimal places to match DECIMAL(10,2) database precision
              price_excluding_vat: fc.double({ min: 1, max: 10000, noNaN: true }).map(n => Math.round(n * 100) / 100),
              vat_rate: fc.constantFrom(7, 10, 15),
              quantity: fc.integer({ min: 1, max: 10 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (orderItemsData) => {
            // Create test products for this order
            const products = [];
            for (let i = 0; i < orderItemsData.length; i++) {
              const itemData = orderItemsData[i];
              const product = await Product.create({
                sku: `REVENUE-TEST-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                name: `Revenue Test Product ${i}`,
                description: 'Test product for revenue recording',
                category_id: testCategory.id,
                price_excluding_vat: itemData.price_excluding_vat,
                vat_rate: itemData.vat_rate,
                stock_quantity: 1000
              });
              products.push(product);
              testProducts.push(product);
            }

            // Create order with these products
            const orderData = {
              user_id: testUser.id,
              shipping_address: '123 Test Street, Test City, 10000',
              shipping_subdistrict: 'Test Subdistrict',
              shipping_district: 'Test District',
              shipping_province: 'Test Province',
              shipping_postal_code: '10000',
              shipping_cost: 0,
              source_platform: 'website',
              items: products.map((product, index) => ({
                product_id: product.id,
                quantity: orderItemsData[index].quantity
              }))
            };

            const order = await Order.createDirect(orderData);

            try {
              // Verify order was created
              expect(order).toBeDefined();
              expect(order.id).toBeDefined();
              expect(order.items).toBeDefined();
              expect(order.items.length).toBe(orderItemsData.length);

              // For each order item, verify complete VAT information is recorded
              for (let i = 0; i < order.items.length; i++) {
                const orderItem = order.items[i];
                const originalData = orderItemsData[i];
                const product = products[i];

                // 1. Amount excluding VAT must be recorded
                expect(orderItem.unit_price_excluding_vat).toBeDefined();
                expect(parseFloat(orderItem.unit_price_excluding_vat)).toBeGreaterThan(0);
                // Use 2 decimal precision to match DECIMAL(10,2) database storage
                expect(parseFloat(orderItem.unit_price_excluding_vat)).toBeCloseTo(
                  originalData.price_excluding_vat,
                  2
                );

                // 2. VAT amount must be recorded
                expect(orderItem.unit_vat_amount).toBeDefined();
                expect(parseFloat(orderItem.unit_vat_amount)).toBeGreaterThanOrEqual(0);
                
                // The database uses ROUND() which may differ from Math.round()
                // We verify the VAT is within acceptable rounding tolerance
                const calculatedVAT = originalData.price_excluding_vat * originalData.vat_rate / 100;
                const expectedVATAmount = parseFloat(orderItem.unit_vat_amount);
                
                // VAT should be close to the calculated value (within 0.01 due to rounding)
                expect(Math.abs(expectedVATAmount - calculatedVAT)).toBeLessThanOrEqual(0.01);

                // 3. Total amount must be recorded
                expect(orderItem.unit_price_including_vat).toBeDefined();
                expect(parseFloat(orderItem.unit_price_including_vat)).toBeGreaterThan(0);
                
                // Total should equal price excluding VAT + VAT amount
                const expectedTotal = Math.round(
                  (parseFloat(orderItem.unit_price_excluding_vat) + parseFloat(orderItem.unit_vat_amount)) * 100
                ) / 100;
                expect(parseFloat(orderItem.unit_price_including_vat)).toBeCloseTo(expectedTotal, 2);

                // 4. VAT rate must be recorded
                expect(orderItem.vat_rate).toBeDefined();
                expect(parseFloat(orderItem.vat_rate)).toBe(originalData.vat_rate);

                // 5. Quantity must be recorded
                expect(orderItem.quantity).toBeDefined();
                expect(orderItem.quantity).toBe(originalData.quantity);

                // 6. Line totals must be calculated correctly
                expect(orderItem.line_total_excluding_vat).toBeDefined();
                expect(orderItem.line_total_vat).toBeDefined();
                expect(orderItem.line_total_including_vat).toBeDefined();

                const expectedLineExcludingVAT = Math.round(
                  (parseFloat(orderItem.unit_price_excluding_vat) * orderItem.quantity) * 100
                ) / 100;
                expect(parseFloat(orderItem.line_total_excluding_vat)).toBeCloseTo(
                  expectedLineExcludingVAT,
                  2
                );

                const expectedLineVAT = Math.round(
                  (parseFloat(orderItem.unit_vat_amount) * orderItem.quantity) * 100
                ) / 100;
                expect(parseFloat(orderItem.line_total_vat)).toBeCloseTo(expectedLineVAT, 2);

                const expectedLineTotal = Math.round(
                  (parseFloat(orderItem.unit_price_including_vat) * orderItem.quantity) * 100
                ) / 100;
                expect(parseFloat(orderItem.line_total_including_vat)).toBeCloseTo(
                  expectedLineTotal,
                  2
                );

                // 7. Line total should equal sum of components
                const calculatedLineTotal = Math.round(
                  (parseFloat(orderItem.line_total_excluding_vat) + parseFloat(orderItem.line_total_vat)) * 100
                ) / 100;
                expect(parseFloat(orderItem.line_total_including_vat)).toBeCloseTo(
                  calculatedLineTotal,
                  2
                );
              }

              // Verify order-level totals aggregate item-level data correctly
              let expectedSubtotalExcludingVAT = 0;
              let expectedTotalVAT = 0;

              for (const item of order.items) {
                expectedSubtotalExcludingVAT += parseFloat(item.line_total_excluding_vat);
                expectedTotalVAT += parseFloat(item.line_total_vat);
              }

              expect(parseFloat(order.subtotal_excluding_vat)).toBeCloseTo(
                expectedSubtotalExcludingVAT,
                2
              );
              expect(parseFloat(order.total_vat_amount)).toBeCloseTo(expectedTotalVAT, 2);

              // Total amount should equal subtotal + VAT - discount + shipping
              const expectedOrderTotal = Math.round(
                (expectedSubtotalExcludingVAT + expectedTotalVAT - parseFloat(order.discount_amount) + parseFloat(order.shipping_cost)) * 100
              ) / 100;
              expect(parseFloat(order.total_amount)).toBeCloseTo(expectedOrderTotal, 2);

            } finally {
              // Clean up: delete the test order and its items
              await db.pool.execute('DELETE FROM order_items WHERE order_id = ?', [order.id]);
              await db.pool.execute('DELETE FROM orders WHERE id = ?', [order.id]);
              
              // Restore product stock
              for (const product of products) {
                await db.pool.execute(
                  'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                  [orderItemsData[products.indexOf(product)].quantity, product.id]
                );
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 60000); // Increase timeout for database operations

    test('should maintain VAT completeness across different VAT rates', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              // Generate prices with 2 decimal places to match database precision
              price_excluding_vat: fc.double({ min: 10, max: 1000, noNaN: true }).map(n => Math.round(n * 100) / 100),
              // Generate realistic VAT rates (0-20% with 2 decimal precision)
              vat_rate: fc.double({ min: 0, max: 20, noNaN: true }).map(n => Math.round(n * 100) / 100),
              quantity: fc.integer({ min: 1, max: 5 })
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (orderItemsData) => {
            // Create test products
            const products = [];
            for (let i = 0; i < orderItemsData.length; i++) {
              const itemData = orderItemsData[i];
              const product = await Product.create({
                sku: `REVENUE-VAR-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                name: `Revenue Variable Rate Product ${i}`,
                description: 'Test product with variable VAT rate',
                category_id: testCategory.id,
                price_excluding_vat: itemData.price_excluding_vat,
                vat_rate: itemData.vat_rate,
                stock_quantity: 1000
              });
              products.push(product);
              testProducts.push(product);
            }

            // Create order
            const orderData = {
              user_id: testUser.id,
              shipping_address: '456 Variable Rate St, Test City, 10000',
              shipping_cost: 0,
              items: products.map((product, index) => ({
                product_id: product.id,
                quantity: orderItemsData[index].quantity
              }))
            };

            const order = await Order.createDirect(orderData);

            try {
              // Each item should have its own VAT rate preserved
              for (let i = 0; i < order.items.length; i++) {
                const orderItem = order.items[i];
                const originalRate = orderItemsData[i].vat_rate;

                // VAT rate must be preserved per item
                expect(parseFloat(orderItem.vat_rate)).toBeCloseTo(originalRate, 2);

                // VAT calculation must use the item's specific rate
                // The database uses ROUND() which may differ from Math.round()
                const calculatedVAT = parseFloat(orderItem.unit_price_excluding_vat) * originalRate / 100;
                const actualVAT = parseFloat(orderItem.unit_vat_amount);
                
                // VAT should be close to calculated value (within 0.01 due to rounding)
                expect(Math.abs(actualVAT - calculatedVAT)).toBeLessThanOrEqual(0.01);

                // All three components must be present regardless of rate
                expect(orderItem.unit_price_excluding_vat).toBeDefined();
                expect(orderItem.unit_vat_amount).toBeDefined();
                expect(orderItem.unit_price_including_vat).toBeDefined();
              }
            } finally {
              // Clean up
              await db.pool.execute('DELETE FROM order_items WHERE order_id = ?', [order.id]);
              await db.pool.execute('DELETE FROM orders WHERE id = ?', [order.id]);
              
              for (const product of products) {
                await db.pool.execute(
                  'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                  [orderItemsData[products.indexOf(product)].quantity, product.id]
                );
              }
            }
          }
        ),
        { numRuns: 50 } // Reduced runs for performance
      );
    }, 60000);

    test('should record VAT information even for zero-VAT items', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate prices with 2 decimal places to match database precision
            price_excluding_vat: fc.double({ min: 10, max: 500, noNaN: true }).map(n => Math.round(n * 100) / 100),
            quantity: fc.integer({ min: 1, max: 5 })
          }),
          async (itemData) => {
            // Create product with 0% VAT
            const product = await Product.create({
              sku: `REVENUE-ZERO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: 'Zero VAT Product',
              description: 'Test product with zero VAT',
              category_id: testCategory.id,
              price_excluding_vat: itemData.price_excluding_vat,
              vat_rate: 0,
              stock_quantity: 1000
            });
            testProducts.push(product);

            const orderData = {
              user_id: testUser.id,
              shipping_address: '789 Zero VAT Ave, Test City, 10000',
              shipping_cost: 0,
              items: [{ product_id: product.id, quantity: itemData.quantity }]
            };

            const order = await Order.createDirect(orderData);

            try {
              const orderItem = order.items[0];

              // Even with 0% VAT, all fields must be present
              expect(orderItem.unit_price_excluding_vat).toBeDefined();
              expect(orderItem.unit_vat_amount).toBeDefined();
              expect(orderItem.unit_price_including_vat).toBeDefined();
              expect(orderItem.vat_rate).toBeDefined();

              // VAT amount should be 0
              expect(parseFloat(orderItem.unit_vat_amount)).toBe(0);

              // Price including VAT should equal price excluding VAT
              expect(parseFloat(orderItem.unit_price_including_vat)).toBeCloseTo(
                parseFloat(orderItem.unit_price_excluding_vat),
                2
              );

              // VAT rate should be 0
              expect(parseFloat(orderItem.vat_rate)).toBe(0);
            } finally {
              // Clean up
              await db.pool.execute('DELETE FROM order_items WHERE order_id = ?', [order.id]);
              await db.pool.execute('DELETE FROM orders WHERE id = ?', [order.id]);
              await db.pool.execute(
                'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                [itemData.quantity, product.id]
              );
            }
          }
        ),
        { numRuns: 50 }
      );
    }, 60000);
  });

  // Unit tests for specific examples
  describe('Unit Tests - Specific Revenue Recording Examples', () => {
    test('should record complete VAT breakdown for a simple order', async () => {
      // Create a test product
      const product = await Product.create({
        sku: `UNIT-REVENUE-${Date.now()}`,
        name: 'Unit Test Product',
        description: 'Product for unit testing',
        category_id: testCategory.id,
        price_excluding_vat: 100,
        vat_rate: 7,
        stock_quantity: 100
      });
      testProducts.push(product);

      const orderData = {
        user_id: testUser.id,
        shipping_address: 'Unit Test Address',
        shipping_cost: 0,
        items: [{ product_id: product.id, quantity: 2 }]
      };

      const order = await Order.createDirect(orderData);

      try {
        const orderItem = order.items[0];

        expect(parseFloat(orderItem.unit_price_excluding_vat)).toBe(100);
        expect(parseFloat(orderItem.unit_vat_amount)).toBe(7);
        expect(parseFloat(orderItem.unit_price_including_vat)).toBe(107);
        expect(parseFloat(orderItem.vat_rate)).toBe(7);
        expect(orderItem.quantity).toBe(2);
        expect(parseFloat(orderItem.line_total_excluding_vat)).toBe(200);
        expect(parseFloat(orderItem.line_total_vat)).toBe(14);
        expect(parseFloat(orderItem.line_total_including_vat)).toBe(214);
      } finally {
        await db.pool.execute('DELETE FROM order_items WHERE order_id = ?', [order.id]);
        await db.pool.execute('DELETE FROM orders WHERE id = ?', [order.id]);
        await db.pool.execute(
          'UPDATE products SET stock_quantity = stock_quantity + 2 WHERE id = ?',
          [product.id]
        );
      }
    });
  });
});
