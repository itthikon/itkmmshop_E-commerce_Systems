/**
 * Property-Based Tests for Cart VAT Information Preservation
 * Feature: itkmmshop-ecommerce, Property 7: Cart VAT Information Preservation
 * Validates: Requirements 4.1
 * 
 * For any product added to cart, the system should store and maintain 
 * quantity, unit price excluding VAT, VAT per unit, and total price including VAT
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

describe('Cart VAT Information Preservation - Property-Based Tests', () => {
  let testCategory;

  beforeAll(async () => {
    // Create a test category
    testCategory = await ProductCategory.create({
      name: 'Test Category for Cart VAT',
      description: 'Category for cart VAT preservation tests'
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
    await pool.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE session_id LIKE "test-session-%")');
    await pool.query('DELETE FROM carts WHERE session_id LIKE "test-session-%"');
    await pool.query('DELETE FROM products WHERE sku LIKE "TEST-CART-VAT-%"');
  });

  /**
   * Property 7: Cart VAT Information Preservation
   * Validates: Requirements 4.1
   * 
   * For any product added to cart, the system should store and maintain 
   * quantity, unit price excluding VAT, VAT per unit, and total price including VAT
   */
  describe('Property 7: Cart VAT Information Preservation', () => {
    test('should preserve complete VAT information when adding any product to cart', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 1, max: 10000, noNaN: true }), // price excluding VAT
          fc.constantFrom(7, 10, 15), // VAT rate
          fc.integer({ min: 1, max: 100 }), // quantity
          async (priceExcludingVAT, vatRate, quantity) => {
            // Round price to 2 decimal places
            const price = Math.round(priceExcludingVAT * 100) / 100;
            
            // Create a test product with specific VAT information
            const sku = `TEST-CART-VAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Test product for cart VAT preservation',
              category_id: testCategory.id,
              price_excluding_vat: price,
              vat_rate: vatRate,
              stock_quantity: quantity + 10 // Ensure enough stock
            });

            // Calculate expected VAT values
            const expectedVATAmount = Math.round((price * vatRate / 100) * 100) / 100;
            const expectedPriceIncludingVAT = Math.round((price + expectedVATAmount) * 100) / 100;

            // Create a cart and add the product
            const sessionId = `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            const updatedCart = await Cart.addItem(cart.id, product.id, quantity);

            // Verify cart has items
            expect(updatedCart.items).toBeDefined();
            expect(updatedCart.items.length).toBeGreaterThan(0);

            // Find the added item
            const cartItem = updatedCart.items.find(item => item.product_id === product.id);
            expect(cartItem).toBeDefined();

            // Property: Quantity must be preserved
            expect(cartItem.quantity).toBe(quantity);

            // Property: Unit price excluding VAT must be preserved
            expect(parseFloat(cartItem.unit_price_excluding_vat)).toBe(price);

            // Property: VAT rate must be preserved
            expect(parseFloat(cartItem.vat_rate)).toBe(vatRate);

            // Property: Unit VAT amount must be preserved and correct (with tolerance for rounding)
            expect(Math.abs(parseFloat(cartItem.unit_vat_amount) - expectedVATAmount)).toBeLessThan(0.02);

            // Property: Unit price including VAT must be preserved and correct (with tolerance for rounding)
            expect(Math.abs(parseFloat(cartItem.unit_price_including_vat) - expectedPriceIncludingVAT)).toBeLessThan(0.02);

            // Property: Line totals must be calculated correctly (with tolerance for rounding)
            const expectedLineTotalExcludingVAT = Math.round((price * quantity) * 100) / 100;
            const expectedLineTotalVAT = Math.round((expectedVATAmount * quantity) * 100) / 100;
            const expectedLineTotalIncludingVAT = Math.round((expectedPriceIncludingVAT * quantity) * 100) / 100;

            expect(Math.abs(parseFloat(cartItem.line_total_excluding_vat) - expectedLineTotalExcludingVAT)).toBeLessThan(0.02);
            expect(Math.abs(parseFloat(cartItem.line_total_vat) - expectedLineTotalVAT)).toBeLessThan(0.02);
            expect(Math.abs(parseFloat(cartItem.line_total_including_vat) - expectedLineTotalIncludingVAT)).toBeLessThan(0.02);

            // Clean up
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should maintain VAT information when updating cart item quantity', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 10, max: 1000, noNaN: true }), // price excluding VAT
          fc.constantFrom(7, 10, 15), // VAT rate
          fc.integer({ min: 1, max: 50 }), // initial quantity
          fc.integer({ min: 1, max: 50 }), // updated quantity
          async (priceExcludingVAT, vatRate, initialQuantity, updatedQuantity) => {
            // Round price to 2 decimal places
            const price = Math.round(priceExcludingVAT * 100) / 100;
            
            // Create a test product
            const sku = `TEST-CART-VAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Test product for cart VAT preservation',
              category_id: testCategory.id,
              price_excluding_vat: price,
              vat_rate: vatRate,
              stock_quantity: Math.max(initialQuantity, updatedQuantity) + 10
            });

            // Calculate expected VAT values
            const expectedVATAmount = Math.round((price * vatRate / 100) * 100) / 100;
            const expectedPriceIncludingVAT = Math.round((price + expectedVATAmount) * 100) / 100;

            // Create cart and add product with initial quantity
            const sessionId = `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, initialQuantity);

            // Update quantity
            const updatedCart = await Cart.updateItemQuantity(cart.id, product.id, updatedQuantity);

            // Find the updated item
            const cartItem = updatedCart.items.find(item => item.product_id === product.id);
            expect(cartItem).toBeDefined();

            // Property: All VAT information must be preserved after quantity update
            expect(cartItem.quantity).toBe(updatedQuantity);
            expect(parseFloat(cartItem.unit_price_excluding_vat)).toBe(price);
            expect(parseFloat(cartItem.vat_rate)).toBe(vatRate);
            expect(Math.abs(parseFloat(cartItem.unit_vat_amount) - expectedVATAmount)).toBeLessThan(0.02);
            expect(Math.abs(parseFloat(cartItem.unit_price_including_vat) - expectedPriceIncludingVAT)).toBeLessThan(0.02);

            // Property: Line totals must be recalculated correctly with new quantity
            const expectedLineTotalExcludingVAT = Math.round((price * updatedQuantity) * 100) / 100;
            const expectedLineTotalVAT = Math.round((expectedVATAmount * updatedQuantity) * 100) / 100;
            const expectedLineTotalIncludingVAT = Math.round((expectedPriceIncludingVAT * updatedQuantity) * 100) / 100;

            expect(Math.abs(parseFloat(cartItem.line_total_excluding_vat) - expectedLineTotalExcludingVAT)).toBeLessThan(0.02);
            expect(Math.abs(parseFloat(cartItem.line_total_vat) - expectedLineTotalVAT)).toBeLessThan(0.02);
            expect(Math.abs(parseFloat(cartItem.line_total_including_vat) - expectedLineTotalIncludingVAT)).toBeLessThan(0.02);

            // Clean up
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should preserve VAT information for multiple products in cart', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              price: fc.double({ min: 1, max: 1000, noNaN: true }),
              vatRate: fc.constantFrom(7, 10, 15),
              quantity: fc.integer({ min: 1, max: 20 })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (productSpecs) => {
            const sessionId = `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            const createdProducts = [];

            try {
              // Create and add multiple products to cart
              for (const spec of productSpecs) {
                const price = Math.round(spec.price * 100) / 100;
                const sku = `TEST-CART-VAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                const product = await Product.create({
                  sku,
                  name: `Test Product ${sku}`,
                  description: 'Test product for multi-item cart',
                  category_id: testCategory.id,
                  price_excluding_vat: price,
                  vat_rate: spec.vatRate,
                  stock_quantity: spec.quantity + 10
                });

                createdProducts.push(product);
                await Cart.addItem(cart.id, product.id, spec.quantity);
              }

              // Get cart with all items
              const finalCart = await Cart.getById(cart.id);

              // Property: Each product's VAT information must be preserved independently
              expect(finalCart.items.length).toBe(productSpecs.length);

              for (let i = 0; i < productSpecs.length; i++) {
                const spec = productSpecs[i];
                const product = createdProducts[i];
                const cartItem = finalCart.items.find(item => item.product_id === product.id);

                expect(cartItem).toBeDefined();

                const price = Math.round(spec.price * 100) / 100;
                const expectedVATAmount = Math.round((price * spec.vatRate / 100) * 100) / 100;
                const expectedPriceIncludingVAT = Math.round((price + expectedVATAmount) * 100) / 100;

                // Verify all VAT components are preserved
                expect(cartItem.quantity).toBe(spec.quantity);
                expect(parseFloat(cartItem.unit_price_excluding_vat)).toBe(price);
                expect(parseFloat(cartItem.vat_rate)).toBe(spec.vatRate);
                expect(Math.abs(parseFloat(cartItem.unit_vat_amount) - expectedVATAmount)).toBeLessThan(0.02);
                expect(Math.abs(parseFloat(cartItem.unit_price_including_vat) - expectedPriceIncludingVAT)).toBeLessThan(0.02);
              }
            } finally {
              // Clean up all created products
              for (const product of createdProducts) {
                await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
              }
            }
          }
        ),
        { numRuns: 20 } // Reduced runs for multi-product test due to complexity
      );
    });

    test('should preserve VAT information after removing and re-adding product', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 10, max: 1000, noNaN: true }),
          fc.constantFrom(7, 10, 15),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 20 }),
          async (priceExcludingVAT, vatRate, firstQuantity, secondQuantity) => {
            const price = Math.round(priceExcludingVAT * 100) / 100;
            
            // Create test product
            const sku = `TEST-CART-VAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Test product for remove/re-add',
              category_id: testCategory.id,
              price_excluding_vat: price,
              vat_rate: vatRate,
              stock_quantity: Math.max(firstQuantity, secondQuantity) + 10
            });

            const expectedVATAmount = Math.round((price * vatRate / 100) * 100) / 100;
            const expectedPriceIncludingVAT = Math.round((price + expectedVATAmount) * 100) / 100;

            // Create cart and add product
            const sessionId = `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, firstQuantity);

            // Remove product from cart
            await Cart.removeItem(cart.id, product.id);

            // Re-add product with different quantity
            const finalCart = await Cart.addItem(cart.id, product.id, secondQuantity);

            // Find the re-added item
            const cartItem = finalCart.items.find(item => item.product_id === product.id);
            expect(cartItem).toBeDefined();

            // Property: VAT information must be preserved correctly after remove/re-add cycle
            expect(cartItem.quantity).toBe(secondQuantity);
            expect(parseFloat(cartItem.unit_price_excluding_vat)).toBe(price);
            expect(parseFloat(cartItem.vat_rate)).toBe(vatRate);
            expect(Math.abs(parseFloat(cartItem.unit_vat_amount) - expectedVATAmount)).toBeLessThan(0.02);
            expect(Math.abs(parseFloat(cartItem.unit_price_including_vat) - expectedPriceIncludingVAT)).toBeLessThan(0.02);

            // Clean up
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  // Unit tests for specific examples and edge cases
  describe('Unit Tests - Specific Examples', () => {
    test('should preserve VAT information for standard 7% VAT product', async () => {
      const sku = `TEST-CART-VAT-${Date.now()}-UNIT`;
      const product = await Product.create({
        sku,
        name: 'Standard VAT Product',
        description: 'Product with 7% VAT',
        category_id: testCategory.id,
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 50
      });

      const sessionId = `test-session-${Date.now()}-unit`;
      const cart = await Cart.findOrCreate(null, sessionId);
      const updatedCart = await Cart.addItem(cart.id, product.id, 2);

      const cartItem = updatedCart.items.find(item => item.product_id === product.id);
      
      expect(cartItem.quantity).toBe(2);
      expect(parseFloat(cartItem.unit_price_excluding_vat)).toBe(100.00);
      expect(parseFloat(cartItem.vat_rate)).toBe(7.00);
      expect(parseFloat(cartItem.unit_vat_amount)).toBe(7.00);
      expect(parseFloat(cartItem.unit_price_including_vat)).toBe(107.00);
      expect(parseFloat(cartItem.line_total_excluding_vat)).toBe(200.00);
      expect(parseFloat(cartItem.line_total_vat)).toBe(14.00);
      expect(parseFloat(cartItem.line_total_including_vat)).toBe(214.00);

      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    });

    test('should handle product with 10% VAT rate', async () => {
      const sku = `TEST-CART-VAT-${Date.now()}-10PCT`;
      const product = await Product.create({
        sku,
        name: '10% VAT Product',
        description: 'Product with 10% VAT',
        category_id: testCategory.id,
        price_excluding_vat: 50.00,
        vat_rate: 10.00,
        stock_quantity: 30
      });

      const sessionId = `test-session-${Date.now()}-10pct`;
      const cart = await Cart.findOrCreate(null, sessionId);
      const updatedCart = await Cart.addItem(cart.id, product.id, 3);

      const cartItem = updatedCart.items.find(item => item.product_id === product.id);
      
      expect(parseFloat(cartItem.unit_vat_amount)).toBe(5.00);
      expect(parseFloat(cartItem.unit_price_including_vat)).toBe(55.00);
      expect(parseFloat(cartItem.line_total_vat)).toBe(15.00);

      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    });

    test('should preserve VAT information when quantity is 1', async () => {
      const sku = `TEST-CART-VAT-${Date.now()}-QTY1`;
      const product = await Product.create({
        sku,
        name: 'Single Quantity Product',
        description: 'Product with quantity 1',
        category_id: testCategory.id,
        price_excluding_vat: 99.99,
        vat_rate: 7.00,
        stock_quantity: 10
      });

      const sessionId = `test-session-${Date.now()}-qty1`;
      const cart = await Cart.findOrCreate(null, sessionId);
      const updatedCart = await Cart.addItem(cart.id, product.id, 1);

      const cartItem = updatedCart.items.find(item => item.product_id === product.id);
      
      expect(cartItem.quantity).toBe(1);
      expect(parseFloat(cartItem.line_total_excluding_vat)).toBe(99.99);
      expect(parseFloat(cartItem.line_total_vat)).toBe(7.00);
      expect(parseFloat(cartItem.line_total_including_vat)).toBe(106.99);

      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    });
  });
});
