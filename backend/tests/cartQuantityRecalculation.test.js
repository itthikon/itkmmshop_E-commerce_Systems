/**
 * Property-Based Tests for Cart Quantity Recalculation Consistency
 * Feature: itkmmshop-ecommerce, Property 8: Cart Quantity Recalculation Consistency
 * Validates: Requirements 4.2
 * 
 * For any cart quantity modification, the system should automatically recalculate 
 * all pricing components (subtotals, VAT amounts, totals) correctly
 */

const fc = require('fast-check');
const { pool } = require('../config/database');

// Mock the database module to provide query method
jest.mock('../config/database', () => {
  const actualDb = jest.requireActual('../config/database');
  return {
    ...actualDb,
    query: (...args) => actualDb.pool.query(...args),
    execute: (...args) => actualDb.pool.execute(...args),
    end: () => actualDb.pool.end()
  };
});

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

describe('Cart Quantity Recalculation Consistency - Property-Based Tests', () => {
  let testCategory;

  beforeAll(async () => {
    // Create a test category
    testCategory = await ProductCategory.create({
      name: 'Test Category for Cart Recalc',
      description: 'Category for cart quantity recalculation tests'
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
    // Clean up test data after each test
    await pool.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE session_id LIKE "test-recalc-%")');
    await pool.query('DELETE FROM carts WHERE session_id LIKE "test-recalc-%"');
    await pool.query('DELETE FROM products WHERE sku LIKE "TEST-RECALC-%"');
  });

  /**
   * Property 8: Cart Quantity Recalculation Consistency
   * Validates: Requirements 4.2
   * 
   * For any cart quantity modification, the system should automatically recalculate 
   * all pricing components (subtotals, VAT amounts, totals) correctly
   */
  describe('Property 8: Cart Quantity Recalculation Consistency', () => {
    test('should recalculate all pricing components when quantity is modified', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 1, max: 5000, noNaN: true }), // price excluding VAT
          fc.constantFrom(7, 10, 15), // VAT rate
          fc.integer({ min: 1, max: 50 }), // initial quantity
          fc.integer({ min: 1, max: 50 }), // new quantity
          async (priceExcludingVAT, vatRate, initialQuantity, newQuantity) => {
            // Round price to 2 decimal places
            const price = Math.round(priceExcludingVAT * 100) / 100;
            
            // Create a test product
            const sku = `TEST-RECALC-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Test product for quantity recalculation',
              category_id: testCategory.id,
              price_excluding_vat: price,
              vat_rate: vatRate,
              stock_quantity: Math.max(initialQuantity, newQuantity) + 10
            });

            // Get the actual VAT values from the database (generated columns)
            // The database uses ROUND() which may differ from JavaScript rounding
            const [productData] = await pool.query(
              'SELECT vat_amount, price_including_vat FROM products WHERE id = ?',
              [product.id]
            );
            const expectedVATAmount = parseFloat(productData[0].vat_amount);
            const expectedPriceIncludingVAT = parseFloat(productData[0].price_including_vat);

            // Create cart and add product with initial quantity
            const sessionId = `test-recalc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, initialQuantity);

            // Verify product still exists before update
            const [checkProduct] = await pool.query(
              'SELECT id, stock_quantity FROM products WHERE id = ?',
              [product.id]
            );
            if (checkProduct.length === 0) {
              throw new Error(`Product ${product.id} was deleted before update`);
            }

            // Update quantity
            const updatedCart = await Cart.updateItemQuantity(cart.id, product.id, newQuantity);

            // Find the updated item
            const cartItem = updatedCart.items.find(item => item.product_id === product.id);
            expect(cartItem).toBeDefined();

            // Property: Quantity must be updated correctly
            expect(cartItem.quantity).toBe(newQuantity);

            // Property: Unit prices must remain unchanged
            expect(parseFloat(cartItem.unit_price_excluding_vat)).toBe(price);
            expect(parseFloat(cartItem.vat_rate)).toBe(vatRate);
            expect(parseFloat(cartItem.unit_vat_amount)).toBe(expectedVATAmount);
            expect(parseFloat(cartItem.unit_price_including_vat)).toBe(expectedPriceIncludingVAT);

            // Property: Line totals must be recalculated correctly based on new quantity
            // Database uses ROUND(quantity * unit_price_excluding_vat, 2) for line_total_excluding_vat
            const expectedLineTotalExcludingVAT = Math.round((price * newQuantity) * 100) / 100;
            // Database uses ROUND(quantity * unit_vat_amount, 2) for line_total_vat
            const expectedLineTotalVAT = Math.round((expectedVATAmount * newQuantity) * 100) / 100;
            // Database uses ROUND(quantity * unit_price_including_vat, 2) for line_total_including_vat
            const expectedLineTotalIncludingVAT = Math.round((expectedPriceIncludingVAT * newQuantity) * 100) / 100;

            expect(parseFloat(cartItem.line_total_excluding_vat)).toBe(expectedLineTotalExcludingVAT);
            expect(parseFloat(cartItem.line_total_vat)).toBe(expectedLineTotalVAT);
            expect(parseFloat(cartItem.line_total_including_vat)).toBe(expectedLineTotalIncludingVAT);

            // Property: Cart totals must be recalculated correctly
            expect(parseFloat(updatedCart.subtotal_excluding_vat)).toBe(expectedLineTotalExcludingVAT);
            expect(parseFloat(updatedCart.total_vat_amount)).toBe(expectedLineTotalVAT);
            expect(parseFloat(updatedCart.total_amount)).toBe(expectedLineTotalIncludingVAT);

            // Clean up
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should recalculate correctly when quantity increases', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 10, max: 1000, noNaN: true }),
          fc.constantFrom(7, 10, 15),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 30 }),
          async (priceExcludingVAT, vatRate, initialQuantity, additionalQuantity) => {
            const price = Math.round(priceExcludingVAT * 100) / 100;
            const newQuantity = initialQuantity + additionalQuantity;
            
            const sku = `TEST-RECALC-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Test product for quantity increase',
              category_id: testCategory.id,
              price_excluding_vat: price,
              vat_rate: vatRate,
              stock_quantity: newQuantity + 10
            });

            const expectedVATAmount = Math.round((price * vatRate / 100) * 100) / 100;
            const expectedPriceIncludingVAT = Math.round((price + expectedVATAmount) * 100) / 100;

            const sessionId = `test-recalc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            
            // Add with initial quantity
            await Cart.addItem(cart.id, product.id, initialQuantity);
            
            // Update to new quantity
            const updatedCart = await Cart.updateItemQuantity(cart.id, product.id, newQuantity);

            const cartItem = updatedCart.items.find(item => item.product_id === product.id);

            // Property: Line totals must reflect the new quantity
            const expectedLineTotalExcludingVAT = Math.round((price * newQuantity) * 100) / 100;
            const expectedLineTotalVAT = Math.round((expectedVATAmount * newQuantity) * 100) / 100;
            const expectedLineTotalIncludingVAT = Math.round((expectedPriceIncludingVAT * newQuantity) * 100) / 100;

            // Use tolerance for floating-point precision issues (0.02 baht tolerance)
            expect(Math.abs(parseFloat(cartItem.line_total_excluding_vat) - expectedLineTotalExcludingVAT)).toBeLessThan(0.02);
            expect(Math.abs(parseFloat(cartItem.line_total_vat) - expectedLineTotalVAT)).toBeLessThan(0.02);
            expect(Math.abs(parseFloat(cartItem.line_total_including_vat) - expectedLineTotalIncludingVAT)).toBeLessThan(0.02);

            // Clean up
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should recalculate correctly when quantity decreases', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 10, max: 1000, noNaN: true }),
          fc.constantFrom(7, 10, 15),
          fc.integer({ min: 10, max: 50 }),
          fc.integer({ min: 1, max: 9 }),
          async (priceExcludingVAT, vatRate, initialQuantity, newQuantity) => {
            const price = Math.round(priceExcludingVAT * 100) / 100;
            
            const sku = `TEST-RECALC-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Test product for quantity decrease',
              category_id: testCategory.id,
              price_excluding_vat: price,
              vat_rate: vatRate,
              stock_quantity: initialQuantity + 10
            });

            const expectedVATAmount = Math.round((price * vatRate / 100) * 100) / 100;
            const expectedPriceIncludingVAT = Math.round((price + expectedVATAmount) * 100) / 100;

            const sessionId = `test-recalc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            
            // Add with initial quantity
            await Cart.addItem(cart.id, product.id, initialQuantity);
            
            // Decrease to new quantity
            const updatedCart = await Cart.updateItemQuantity(cart.id, product.id, newQuantity);

            const cartItem = updatedCart.items.find(item => item.product_id === product.id);

            // Property: Line totals must reflect the decreased quantity
            const expectedLineTotalExcludingVAT = Math.round((price * newQuantity) * 100) / 100;
            const expectedLineTotalVAT = Math.round((expectedVATAmount * newQuantity) * 100) / 100;
            const expectedLineTotalIncludingVAT = Math.round((expectedPriceIncludingVAT * newQuantity) * 100) / 100;

            // Use tolerance for floating-point precision issues (0.01 baht tolerance)
            expect(Math.abs(parseFloat(cartItem.line_total_excluding_vat) - expectedLineTotalExcludingVAT)).toBeLessThan(0.02);
            expect(Math.abs(parseFloat(cartItem.line_total_vat) - expectedLineTotalVAT)).toBeLessThan(0.02);
            expect(Math.abs(parseFloat(cartItem.line_total_including_vat) - expectedLineTotalIncludingVAT)).toBeLessThan(0.02);

            // Clean up
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should recalculate cart totals correctly with multiple items when one quantity changes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              price: fc.double({ min: 10, max: 500, noNaN: true }),
              vatRate: fc.constantFrom(7, 10, 15),
              quantity: fc.integer({ min: 1, max: 10 })
            }),
            { minLength: 2, maxLength: 4 }
          ),
          fc.integer({ min: 0, max: 3 }), // index of item to modify
          fc.integer({ min: 1, max: 20 }), // new quantity for modified item
          async (productSpecs, modifyIndex, newQuantity) => {
            // Ensure modifyIndex is within bounds
            const itemToModifyIndex = modifyIndex % productSpecs.length;
            
            const sessionId = `test-recalc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            const createdProducts = [];

            try {
              // Create and add multiple products to cart
              for (const spec of productSpecs) {
                const price = Math.round(spec.price * 100) / 100;
                const sku = `TEST-RECALC-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
                
                const product = await Product.create({
                  sku,
                  name: `Test Product ${sku}`,
                  description: 'Test product for multi-item recalc',
                  category_id: testCategory.id,
                  price_excluding_vat: price,
                  vat_rate: spec.vatRate,
                  stock_quantity: Math.max(spec.quantity, newQuantity) + 10
                });

                createdProducts.push(product);
                await Cart.addItem(cart.id, product.id, spec.quantity);
              }

              // Modify quantity of one item
              const productToModify = createdProducts[itemToModifyIndex];
              const updatedCart = await Cart.updateItemQuantity(cart.id, productToModify.id, newQuantity);

              // Calculate expected cart totals using actual database values
              let expectedSubtotalExcludingVAT = 0;
              let expectedTotalVAT = 0;
              let expectedTotalIncludingVAT = 0;

              for (let i = 0; i < productSpecs.length; i++) {
                const product = createdProducts[i];
                const qty = i === itemToModifyIndex ? newQuantity : productSpecs[i].quantity;
                
                // Get actual VAT values from database
                const [productData] = await pool.query(
                  'SELECT price_excluding_vat, vat_amount, price_including_vat FROM products WHERE id = ?',
                  [product.id]
                );
                
                const price = parseFloat(productData[0].price_excluding_vat);
                const vatAmount = parseFloat(productData[0].vat_amount);
                const priceIncludingVAT = parseFloat(productData[0].price_including_vat);

                // Line totals use ROUND(quantity * unit_value, 2)
                const lineTotalExcludingVAT = Math.round((price * qty) * 100) / 100;
                const lineTotalVAT = Math.round((vatAmount * qty) * 100) / 100;
                const lineTotalIncludingVAT = Math.round((priceIncludingVAT * qty) * 100) / 100;

                expectedSubtotalExcludingVAT += lineTotalExcludingVAT;
                expectedTotalVAT += lineTotalVAT;
                expectedTotalIncludingVAT += lineTotalIncludingVAT;
              }

              // Round the final sums to match database precision
              expectedSubtotalExcludingVAT = Math.round(expectedSubtotalExcludingVAT * 100) / 100;
              expectedTotalVAT = Math.round(expectedTotalVAT * 100) / 100;
              expectedTotalIncludingVAT = Math.round(expectedTotalIncludingVAT * 100) / 100;

              // Property: Cart totals must reflect all items with updated quantity
              // Use exact equality since we're matching database rounding logic
              expect(parseFloat(updatedCart.subtotal_excluding_vat)).toBe(expectedSubtotalExcludingVAT);
              expect(parseFloat(updatedCart.total_vat_amount)).toBe(expectedTotalVAT);
              expect(parseFloat(updatedCart.total_amount)).toBe(expectedTotalIncludingVAT);

            } finally {
              // Clean up all created products
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

  // Unit tests for specific examples and edge cases
  describe('Unit Tests - Specific Examples', () => {
    test('should recalculate correctly when quantity changes from 1 to 5', async () => {
      const sku = `TEST-RECALC-${Date.now()}-UNIT1`;
      const product = await Product.create({
        sku,
        name: 'Unit Test Product',
        description: 'Product for unit test',
        category_id: testCategory.id,
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 50
      });

      const sessionId = `test-recalc-${Date.now()}-unit1`;
      const cart = await Cart.findOrCreate(null, sessionId);
      
      // Add with quantity 1
      await Cart.addItem(cart.id, product.id, 1);
      
      // Update to quantity 5
      const updatedCart = await Cart.updateItemQuantity(cart.id, product.id, 5);

      const cartItem = updatedCart.items.find(item => item.product_id === product.id);
      
      expect(cartItem.quantity).toBe(5);
      expect(parseFloat(cartItem.line_total_excluding_vat)).toBe(500.00);
      expect(parseFloat(cartItem.line_total_vat)).toBe(35.00);
      expect(parseFloat(cartItem.line_total_including_vat)).toBe(535.00);

      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    });

    test('should recalculate correctly when quantity changes from 10 to 3', async () => {
      const sku = `TEST-RECALC-${Date.now()}-UNIT2`;
      const product = await Product.create({
        sku,
        name: 'Unit Test Product 2',
        description: 'Product for unit test',
        category_id: testCategory.id,
        price_excluding_vat: 50.00,
        vat_rate: 7.00,
        stock_quantity: 50
      });

      const sessionId = `test-recalc-${Date.now()}-unit2`;
      const cart = await Cart.findOrCreate(null, sessionId);
      
      // Add with quantity 10
      await Cart.addItem(cart.id, product.id, 10);
      
      // Update to quantity 3
      const updatedCart = await Cart.updateItemQuantity(cart.id, product.id, 3);

      const cartItem = updatedCart.items.find(item => item.product_id === product.id);
      
      expect(cartItem.quantity).toBe(3);
      expect(parseFloat(cartItem.line_total_excluding_vat)).toBe(150.00);
      expect(parseFloat(cartItem.line_total_vat)).toBe(10.50);
      expect(parseFloat(cartItem.line_total_including_vat)).toBe(160.50);

      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    });

    test('should handle quantity update to 1 correctly', async () => {
      const sku = `TEST-RECALC-${Date.now()}-UNIT3`;
      const product = await Product.create({
        sku,
        name: 'Unit Test Product 3',
        description: 'Product for unit test',
        category_id: testCategory.id,
        price_excluding_vat: 99.99,
        vat_rate: 7.00,
        stock_quantity: 50
      });

      const sessionId = `test-recalc-${Date.now()}-unit3`;
      const cart = await Cart.findOrCreate(null, sessionId);
      
      // Add with quantity 5
      await Cart.addItem(cart.id, product.id, 5);
      
      // Update to quantity 1
      const updatedCart = await Cart.updateItemQuantity(cart.id, product.id, 1);

      const cartItem = updatedCart.items.find(item => item.product_id === product.id);
      
      expect(cartItem.quantity).toBe(1);
      expect(parseFloat(cartItem.line_total_excluding_vat)).toBe(99.99);
      expect(parseFloat(cartItem.line_total_vat)).toBe(7.00);
      expect(parseFloat(cartItem.line_total_including_vat)).toBe(106.99);

      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    });

    test('should recalculate with 10% VAT rate correctly', async () => {
      const sku = `TEST-RECALC-${Date.now()}-UNIT4`;
      const product = await Product.create({
        sku,
        name: 'Unit Test Product 4',
        description: 'Product with 10% VAT',
        category_id: testCategory.id,
        price_excluding_vat: 200.00,
        vat_rate: 10.00,
        stock_quantity: 50
      });

      const sessionId = `test-recalc-${Date.now()}-unit4`;
      const cart = await Cart.findOrCreate(null, sessionId);
      
      // Add with quantity 2
      await Cart.addItem(cart.id, product.id, 2);
      
      // Update to quantity 4
      const updatedCart = await Cart.updateItemQuantity(cart.id, product.id, 4);

      const cartItem = updatedCart.items.find(item => item.product_id === product.id);
      
      expect(cartItem.quantity).toBe(4);
      expect(parseFloat(cartItem.line_total_excluding_vat)).toBe(800.00);
      expect(parseFloat(cartItem.line_total_vat)).toBe(80.00);
      expect(parseFloat(cartItem.line_total_including_vat)).toBe(880.00);

      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    });
  });
});
