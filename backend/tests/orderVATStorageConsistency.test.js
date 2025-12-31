/**
 * Property-Based Tests for Order VAT Storage Consistency
 * Feature: itkmmshop-ecommerce, Property 16
 * Uses fast-check library for property-based testing
 */

const fc = require('fast-check');
const db = require('../config/database');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

describe('Order VAT Storage Consistency - Property-Based Tests', () => {
  let testUser;
  let testCategory;
  let testProducts = [];

  beforeAll(async () => {
    // Create test user directly using pool
    const bcrypt = require('bcrypt');
    const password_hash = await bcrypt.hash('TestPassword123!', 10);
    const [userResult] = await db.pool.execute(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      [`vat-consistency-test-${Date.now()}@test.com`, password_hash, 'VAT', 'Test', 'customer']
    );
    testUser = { id: userResult.insertId };

    // Create test category
    testCategory = await ProductCategory.create({
      name: `VAT Consistency Test Category ${Date.now()}`,
      description: 'Category for VAT consistency testing'
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
   * Property 16: Order VAT Storage Consistency
   * Validates: Requirements 15.2
   * 
   * For any processed order, the system should store VAT per unit and total VAT amounts 
   * consistently regardless of whether pricing is displayed as inclusive or exclusive
   */
  describe('Property 16: Order VAT Storage Consistency', () => {
    test('should store VAT consistently for any order regardless of pricing display mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              price_excluding_vat: fc.double({ min: 10, max: 1000, noNaN: true }),
              vat_rate: fc.constantFrom(7, 10, 15),
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
                sku: `VAT-CONS-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                name: `VAT Consistency Product ${i}`,
                description: 'Test product for VAT consistency',
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
              shipping_address: 'VAT Consistency Test Address',
              shipping_cost: 0,
              items: products.map((product, index) => ({
                product_id: product.id,
                quantity: orderItemsData[index].quantity
              }))
            };

            const order = await Order.createDirect(orderData);

            try {
              // Verify order was created
              expect(order).toBeDefined();
              expect(order.items).toBeDefined();
              expect(order.items.length).toBe(orderItemsData.length);

              // For each order item, verify VAT storage consistency
              for (let i = 0; i < order.items.length; i++) {
                const orderItem = order.items[i];
                const originalData = orderItemsData[i];

                // 1. VAT per unit must be stored
                expect(orderItem.unit_vat_amount).toBeDefined();
                expect(parseFloat(orderItem.unit_vat_amount)).toBeGreaterThanOrEqual(0);

                // 2. VAT rate must be stored
                expect(orderItem.vat_rate).toBeDefined();
                expect(parseFloat(orderItem.vat_rate)).toBe(originalData.vat_rate);

                // 3. Calculate expected VAT per unit
                const expectedVATPerUnit = Math.round(
                  (originalData.price_excluding_vat * originalData.vat_rate / 100) * 100
                ) / 100;

                // 4. Stored VAT per unit should match calculation
                expect(parseFloat(orderItem.unit_vat_amount)).toBeCloseTo(expectedVATPerUnit, 1);

                // 5. Total VAT for line item must be stored
                expect(orderItem.line_total_vat).toBeDefined();
                const expectedLineTotalVAT = Math.round(
                  (expectedVATPerUnit * orderItem.quantity) * 100
                ) / 100;
                // Use 0 decimal precision for line totals due to cumulative rounding
                expect(parseFloat(orderItem.line_total_vat)).toBeCloseTo(expectedLineTotalVAT, 0);

                // 6. Verify consistency: line_total_vat = unit_vat_amount * quantity
                const calculatedLineTotalVAT = Math.round(
                  (parseFloat(orderItem.unit_vat_amount) * orderItem.quantity) * 100
                ) / 100;
                expect(parseFloat(orderItem.line_total_vat)).toBeCloseTo(calculatedLineTotalVAT, 0);

                // 7. Verify price components are consistent
                // price_including_vat = price_excluding_vat + vat_amount
                const calculatedPriceIncludingVAT = Math.round(
                  (parseFloat(orderItem.unit_price_excluding_vat) + parseFloat(orderItem.unit_vat_amount)) * 100
                ) / 100;
                expect(parseFloat(orderItem.unit_price_including_vat)).toBeCloseTo(
                  calculatedPriceIncludingVAT,
                  1
                );

                // 8. Verify line totals are consistent
                // line_total_including_vat = line_total_excluding_vat + line_total_vat
                const calculatedLineTotalIncludingVAT = Math.round(
                  (parseFloat(orderItem.line_total_excluding_vat) + parseFloat(orderItem.line_total_vat)) * 100
                ) / 100;
                expect(parseFloat(orderItem.line_total_including_vat)).toBeCloseTo(
                  calculatedLineTotalIncludingVAT,
                  1
                );

                // 9. Verify that VAT information is complete and non-null
                expect(orderItem.unit_price_excluding_vat).not.toBeNull();
                expect(orderItem.unit_vat_amount).not.toBeNull();
                expect(orderItem.unit_price_including_vat).not.toBeNull();
                expect(orderItem.vat_rate).not.toBeNull();
                expect(orderItem.line_total_excluding_vat).not.toBeNull();
                expect(orderItem.line_total_vat).not.toBeNull();
                expect(orderItem.line_total_including_vat).not.toBeNull();
              }

              // 10. Verify order-level VAT totals are consistent with item-level data
              let calculatedTotalVAT = 0;
              let calculatedSubtotalExcludingVAT = 0;

              for (const item of order.items) {
                calculatedTotalVAT += parseFloat(item.line_total_vat);
                calculatedSubtotalExcludingVAT += parseFloat(item.line_total_excluding_vat);
              }

              expect(parseFloat(order.total_vat_amount)).toBeCloseTo(calculatedTotalVAT, 1);
              expect(parseFloat(order.subtotal_excluding_vat)).toBeCloseTo(
                calculatedSubtotalExcludingVAT,
                1
              );

              // 11. Verify order total is consistent
              const calculatedOrderTotal = Math.round(
                (calculatedSubtotalExcludingVAT + calculatedTotalVAT - parseFloat(order.discount_amount) + parseFloat(order.shipping_cost)) * 100
              ) / 100;
              expect(parseFloat(order.total_amount)).toBeCloseTo(calculatedOrderTotal, 1);

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
    }, 60000);

    test('should maintain VAT consistency when displaying prices as inclusive or exclusive', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            price_excluding_vat: fc.double({ min: 100, max: 500, noNaN: true }),
            vat_rate: fc.constantFrom(7, 10),
            quantity: fc.integer({ min: 1, max: 3 })
          }),
          async (itemData) => {
            // Create product
            const product = await Product.create({
              sku: `VAT-DISPLAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: 'VAT Display Test Product',
              description: 'Test product for VAT display consistency',
              category_id: testCategory.id,
              price_excluding_vat: itemData.price_excluding_vat,
              vat_rate: itemData.vat_rate,
              stock_quantity: 1000
            });
            testProducts.push(product);

            // Create order
            const orderData = {
              user_id: testUser.id,
              shipping_address: 'VAT Display Test Address',
              shipping_cost: 0,
              items: [{ product_id: product.id, quantity: itemData.quantity }]
            };

            const order = await Order.createDirect(orderData);

            try {
              const orderItem = order.items[0];

              // Calculate what the values should be
              const expectedVATPerUnit = Math.round(
                (itemData.price_excluding_vat * itemData.vat_rate / 100) * 100
              ) / 100;
              const expectedPriceIncludingVAT = Math.round(
                (itemData.price_excluding_vat + expectedVATPerUnit) * 100
              ) / 100;

              // Regardless of how we display the price (inclusive or exclusive),
              // the stored values should be consistent

              // If we display as exclusive, we show: price_excluding_vat + VAT
              const displayExclusiveTotal = Math.round(
                (parseFloat(orderItem.unit_price_excluding_vat) + parseFloat(orderItem.unit_vat_amount)) * 100
              ) / 100;

              // If we display as inclusive, we show: price_including_vat (which includes VAT)
              const displayInclusivePrice = parseFloat(orderItem.unit_price_including_vat);

              // Both display modes should result in the same total
              expect(displayExclusiveTotal).toBeCloseTo(displayInclusivePrice, 1);

              // The stored VAT amount should be the same regardless of display mode
              expect(parseFloat(orderItem.unit_vat_amount)).toBeCloseTo(expectedVATPerUnit, 1);

              // The stored price excluding VAT should be the same regardless of display mode
              expect(parseFloat(orderItem.unit_price_excluding_vat)).toBeCloseTo(
                itemData.price_excluding_vat,
                1
              );

              // The stored price including VAT should be the same regardless of display mode
              expect(parseFloat(orderItem.unit_price_including_vat)).toBeCloseTo(
                expectedPriceIncludingVAT,
                1
              );

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

    test('should store VAT consistently across orders with different VAT rates', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.record({
              price_excluding_vat: fc.double({ min: 50, max: 200, noNaN: true }),
              vat_rate: fc.double({ min: 5, max: 15, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 2 })
            }),
            fc.record({
              price_excluding_vat: fc.double({ min: 50, max: 200, noNaN: true }),
              vat_rate: fc.double({ min: 5, max: 15, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 2 })
            })
          ),
          async ([item1Data, item2Data]) => {
            // Create two products with different VAT rates
            const product1 = await Product.create({
              sku: `VAT-MULTI-1-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: 'Multi-Rate Product 1',
              category_id: testCategory.id,
              price_excluding_vat: item1Data.price_excluding_vat,
              vat_rate: item1Data.vat_rate,
              stock_quantity: 1000
            });
            testProducts.push(product1);

            const product2 = await Product.create({
              sku: `VAT-MULTI-2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: 'Multi-Rate Product 2',
              category_id: testCategory.id,
              price_excluding_vat: item2Data.price_excluding_vat,
              vat_rate: item2Data.vat_rate,
              stock_quantity: 1000
            });
            testProducts.push(product2);

            // Create order with both products
            const orderData = {
              user_id: testUser.id,
              shipping_address: 'Multi-Rate Test Address',
              shipping_cost: 0,
              items: [
                { product_id: product1.id, quantity: item1Data.quantity },
                { product_id: product2.id, quantity: item2Data.quantity }
              ]
            };

            const order = await Order.createDirect(orderData);

            try {
              // Each item should maintain its own VAT rate and calculations
              const orderItem1 = order.items[0];
              const orderItem2 = order.items[1];

              // Item 1 should have its VAT rate
              expect(parseFloat(orderItem1.vat_rate)).toBeCloseTo(item1Data.vat_rate, 1);

              // Item 2 should have its VAT rate
              expect(parseFloat(orderItem2.vat_rate)).toBeCloseTo(item2Data.vat_rate, 1);

              // Each item's VAT should be calculated with its own rate
              const expectedVAT1 = Math.round(
                (item1Data.price_excluding_vat * item1Data.vat_rate / 100) * 100
              ) / 100;
              const expectedVAT2 = Math.round(
                (item2Data.price_excluding_vat * item2Data.vat_rate / 100) * 100
              ) / 100;

              expect(parseFloat(orderItem1.unit_vat_amount)).toBeCloseTo(expectedVAT1, 1);
              expect(parseFloat(orderItem2.unit_vat_amount)).toBeCloseTo(expectedVAT2, 1);

              // Order total VAT should be sum of both items' VAT
              const totalExpectedVAT = Math.round(
                ((expectedVAT1 * item1Data.quantity) + (expectedVAT2 * item2Data.quantity)) * 100
              ) / 100;
              expect(parseFloat(order.total_vat_amount)).toBeCloseTo(totalExpectedVAT, 1);

            } finally {
              // Clean up
              await db.pool.execute('DELETE FROM order_items WHERE order_id = ?', [order.id]);
              await db.pool.execute('DELETE FROM orders WHERE id = ?', [order.id]);
              await db.pool.execute(
                'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                [item1Data.quantity, product1.id]
              );
              await db.pool.execute(
                'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                [item2Data.quantity, product2.id]
              );
            }
          }
        ),
        { numRuns: 50 }
      );
    }, 60000);
  });

  // Unit tests for specific examples
  describe('Unit Tests - Specific VAT Storage Examples', () => {
    test('should store VAT consistently for a simple order', async () => {
      const product = await Product.create({
        sku: `UNIT-VAT-CONS-${Date.now()}`,
        name: 'Unit VAT Consistency Product',
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

        // Check all VAT components are stored
        expect(parseFloat(orderItem.unit_price_excluding_vat)).toBe(100);
        expect(parseFloat(orderItem.unit_vat_amount)).toBe(7);
        expect(parseFloat(orderItem.unit_price_including_vat)).toBe(107);
        expect(parseFloat(orderItem.vat_rate)).toBe(7);
        expect(parseFloat(orderItem.line_total_excluding_vat)).toBe(200);
        expect(parseFloat(orderItem.line_total_vat)).toBe(14);
        expect(parseFloat(orderItem.line_total_including_vat)).toBe(214);

        // Check order totals
        expect(parseFloat(order.subtotal_excluding_vat)).toBe(200);
        expect(parseFloat(order.total_vat_amount)).toBe(14);
        expect(parseFloat(order.total_amount)).toBe(214);
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
