/**
 * Property-Based Tests for Voucher VAT Recalculation Accuracy
 * Feature: itkmmshop-ecommerce, Property 9: Voucher VAT Recalculation Accuracy
 * Validates: Requirements 5.2, 5.5
 * 
 * For any valid voucher application, the system should apply discount before VAT 
 * calculation and recalculate VAT based on the discounted amount
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
const Voucher = require('../models/Voucher');

describe('Voucher VAT Recalculation Accuracy - Property-Based Tests', () => {
  let testCategory;

  beforeAll(async () => {
    // Create a test category
    testCategory = await ProductCategory.create({
      name: 'Test Category for Voucher VAT',
      description: 'Category for voucher VAT recalculation tests'
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
    await pool.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE session_id LIKE "test-voucher-vat-%")');
    await pool.query('DELETE FROM carts WHERE session_id LIKE "test-voucher-vat-%"');
    await pool.query('DELETE FROM products WHERE sku LIKE "TEST-VOUCHER-VAT-%"');
    await pool.query('DELETE FROM vouchers WHERE code LIKE "TEST-VOUCHER-%"');
  });

  /**
   * Property 9: Voucher VAT Recalculation Accuracy
   * Validates: Requirements 5.2, 5.5
   * 
   * For any valid voucher application, the system should apply discount before VAT 
   * calculation and recalculate VAT based on the discounted amount
   */
  describe('Property 9: Voucher VAT Recalculation Accuracy', () => {
    test('should apply percentage discount before VAT and recalculate VAT correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 100, max: 5000, noNaN: true }), // price excluding VAT
          fc.constantFrom(7, 10, 15), // VAT rate
          fc.integer({ min: 1, max: 20 }), // quantity
          fc.double({ min: 5, max: 50, noNaN: true }), // discount percentage
          async (priceExcludingVAT, vatRate, quantity, discountPercentage) => {
            const price = Math.round(priceExcludingVAT * 100) / 100;
            const discountPct = Math.round(discountPercentage * 100) / 100;
            
            // Create test product
            const sku = `TEST-VOUCHER-VAT-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Test product for voucher VAT recalculation',
              category_id: testCategory.id,
              price_excluding_vat: price,
              vat_rate: vatRate,
              stock_quantity: quantity + 10
            });

            // Create test voucher
            const voucherCode = `TEST-VOUCHER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const now = new Date();
            const startDate = new Date(now.getTime() - 86400000); // 1 day ago
            const endDate = new Date(now.getTime() + 86400000); // 1 day from now
            
            const voucher = await Voucher.create({
              code: voucherCode,
              name: 'Test Percentage Voucher',
              discount_type: 'percentage',
              discount_value: discountPct,
              minimum_order_amount: 0,
              start_date: startDate,
              end_date: endDate,
              status: 'active'
            });

            // Create cart and add product
            const sessionId = `test-voucher-vat-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, quantity);

            // Get cart before voucher
            const cartBeforeVoucher = await Cart.getById(cart.id);
            const subtotalBeforeDiscount = parseFloat(cartBeforeVoucher.subtotal_excluding_vat);
            const totalVATBeforeDiscount = parseFloat(cartBeforeVoucher.total_vat_amount);

            // Apply voucher
            const cartAfterVoucher = await Cart.applyVoucher(cart.id, voucherCode);

            // Property: Discount should be applied to subtotal excluding VAT
            const expectedDiscountAmount = Math.round((subtotalBeforeDiscount * (discountPct / 100)) * 100) / 100;
            const actualDiscountAmount = parseFloat(cartAfterVoucher.discount_amount);
            
            // Allow small rounding differences
            expect(Math.abs(actualDiscountAmount - expectedDiscountAmount)).toBeLessThan(0.02);

            // Property: VAT should be recalculated on discounted amount using weighted average rate
            const discountedSubtotal = subtotalBeforeDiscount - actualDiscountAmount;
            const avgVATRate = (totalVATBeforeDiscount / subtotalBeforeDiscount) * 100;
            const expectedVATAfterDiscount = Math.round((discountedSubtotal * avgVATRate / 100) * 100) / 100;
            const actualVATAfterDiscount = parseFloat(cartAfterVoucher.total_vat_amount);
            
            // Allow tolerance for floating-point precision issues (0.1 baht tolerance)
            expect(Math.abs(actualVATAfterDiscount - expectedVATAfterDiscount)).toBeLessThan(0.1);

            // Property: Total should be discounted subtotal + recalculated VAT
            const expectedTotal = Math.round((discountedSubtotal + expectedVATAfterDiscount) * 100) / 100;
            const actualTotal = parseFloat(cartAfterVoucher.total_amount);
            
            // Allow slightly larger tolerance for total due to cumulative rounding
            expect(Math.abs(actualTotal - expectedTotal)).toBeLessThan(0.1);

            // Clean up
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
            await pool.query('DELETE FROM vouchers WHERE id = ?', [voucher.id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should apply fixed amount discount before VAT and recalculate VAT correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 200, max: 5000, noNaN: true }), // price excluding VAT
          fc.constantFrom(7, 10, 15), // VAT rate
          fc.integer({ min: 1, max: 10 }), // quantity
          fc.double({ min: 10, max: 100, noNaN: true }), // fixed discount amount
          async (priceExcludingVAT, vatRate, quantity, discountValue) => {
            const price = Math.round(priceExcludingVAT * 100) / 100;
            const fixedDiscount = Math.round(discountValue * 100) / 100;
            
            // Create test product
            const sku = `TEST-VOUCHER-VAT-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Test product for fixed voucher',
              category_id: testCategory.id,
              price_excluding_vat: price,
              vat_rate: vatRate,
              stock_quantity: quantity + 10
            });

            // Create test voucher
            const voucherCode = `TEST-VOUCHER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const now = new Date();
            const startDate = new Date(now.getTime() - 86400000);
            const endDate = new Date(now.getTime() + 86400000);
            
            const voucher = await Voucher.create({
              code: voucherCode,
              name: 'Test Fixed Amount Voucher',
              discount_type: 'fixed_amount',
              discount_value: fixedDiscount,
              minimum_order_amount: 0,
              start_date: startDate,
              end_date: endDate,
              status: 'active'
            });

            // Create cart and add product
            const sessionId = `test-voucher-vat-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, quantity);

            // Get cart before voucher
            const cartBeforeVoucher = await Cart.getById(cart.id);
            const subtotalBeforeDiscount = parseFloat(cartBeforeVoucher.subtotal_excluding_vat);
            const totalVATBeforeDiscount = parseFloat(cartBeforeVoucher.total_vat_amount);

            // Apply voucher
            const cartAfterVoucher = await Cart.applyVoucher(cart.id, voucherCode);

            // Property: Fixed discount should be applied (capped at subtotal)
            const expectedDiscountAmount = Math.min(fixedDiscount, subtotalBeforeDiscount);
            const actualDiscountAmount = parseFloat(cartAfterVoucher.discount_amount);
            
            expect(Math.abs(actualDiscountAmount - expectedDiscountAmount)).toBeLessThan(0.02);

            // Property: VAT should be recalculated on discounted amount using weighted average rate
            const discountedSubtotal = subtotalBeforeDiscount - actualDiscountAmount;
            const avgVATRate = (totalVATBeforeDiscount / subtotalBeforeDiscount) * 100;
            const expectedVATAfterDiscount = Math.round((discountedSubtotal * avgVATRate / 100) * 100) / 100;
            const actualVATAfterDiscount = parseFloat(cartAfterVoucher.total_vat_amount);
            
            // Allow tolerance for floating-point precision issues (0.1 baht tolerance)
            expect(Math.abs(actualVATAfterDiscount - expectedVATAfterDiscount)).toBeLessThan(0.1);

            // Property: Total should be discounted subtotal + recalculated VAT
            const expectedTotal = Math.round((discountedSubtotal + expectedVATAfterDiscount) * 100) / 100;
            const actualTotal = parseFloat(cartAfterVoucher.total_amount);
            
            expect(Math.abs(actualTotal - expectedTotal)).toBeLessThan(0.1);

            // Clean up
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
            await pool.query('DELETE FROM vouchers WHERE id = ?', [voucher.id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should apply percentage discount with max cap and recalculate VAT correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 500, max: 5000, noNaN: true }), // price excluding VAT
          fc.constantFrom(7, 10, 15), // VAT rate
          fc.integer({ min: 2, max: 10 }), // quantity
          fc.double({ min: 20, max: 50, noNaN: true }), // discount percentage
          fc.double({ min: 50, max: 200, noNaN: true }), // max discount cap
          async (priceExcludingVAT, vatRate, quantity, discountPercentage, maxDiscountCap) => {
            const price = Math.round(priceExcludingVAT * 100) / 100;
            const discountPct = Math.round(discountPercentage * 100) / 100;
            const maxDiscount = Math.round(maxDiscountCap * 100) / 100;
            
            // Create test product
            const sku = `TEST-VOUCHER-VAT-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const product = await Product.create({
              sku,
              name: `Test Product ${sku}`,
              description: 'Test product for capped voucher',
              category_id: testCategory.id,
              price_excluding_vat: price,
              vat_rate: vatRate,
              stock_quantity: quantity + 10
            });

            // Create test voucher with max discount
            const voucherCode = `TEST-VOUCHER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const now = new Date();
            const startDate = new Date(now.getTime() - 86400000);
            const endDate = new Date(now.getTime() + 86400000);
            
            const voucher = await Voucher.create({
              code: voucherCode,
              name: 'Test Capped Percentage Voucher',
              discount_type: 'percentage',
              discount_value: discountPct,
              max_discount_amount: maxDiscount,
              minimum_order_amount: 0,
              start_date: startDate,
              end_date: endDate,
              status: 'active'
            });

            // Create cart and add product
            const sessionId = `test-voucher-vat-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            await Cart.addItem(cart.id, product.id, quantity);

            // Get cart before voucher
            const cartBeforeVoucher = await Cart.getById(cart.id);
            const subtotalBeforeDiscount = parseFloat(cartBeforeVoucher.subtotal_excluding_vat);
            const totalVATBeforeDiscount = parseFloat(cartBeforeVoucher.total_vat_amount);

            // Apply voucher
            const cartAfterVoucher = await Cart.applyVoucher(cart.id, voucherCode);

            // Property: Discount should be capped at max_discount_amount
            const uncappedDiscount = subtotalBeforeDiscount * (discountPct / 100);
            const expectedDiscountAmount = Math.min(uncappedDiscount, maxDiscount, subtotalBeforeDiscount);
            const actualDiscountAmount = parseFloat(cartAfterVoucher.discount_amount);
            
            expect(Math.abs(actualDiscountAmount - expectedDiscountAmount)).toBeLessThan(0.02);

            // Property: VAT should be recalculated on discounted amount using weighted average rate
            const discountedSubtotal = subtotalBeforeDiscount - actualDiscountAmount;
            const avgVATRate = (totalVATBeforeDiscount / subtotalBeforeDiscount) * 100;
            const expectedVATAfterDiscount = Math.round((discountedSubtotal * avgVATRate / 100) * 100) / 100;
            const actualVATAfterDiscount = parseFloat(cartAfterVoucher.total_vat_amount);
            
            // Allow tolerance for floating-point precision issues (0.1 baht tolerance)
            expect(Math.abs(actualVATAfterDiscount - expectedVATAfterDiscount)).toBeLessThan(0.1);

            // Clean up
            await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
            await pool.query('DELETE FROM vouchers WHERE id = ?', [voucher.id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should recalculate VAT correctly when voucher is applied to multi-item cart', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              price: fc.double({ min: 50, max: 1000, noNaN: true }),
              vatRate: fc.constantFrom(7, 10, 15),
              quantity: fc.integer({ min: 1, max: 5 })
            }),
            { minLength: 2, maxLength: 4 }
          ),
          fc.double({ min: 10, max: 30, noNaN: true }), // discount percentage
          async (productSpecs, discountPercentage) => {
            const discountPct = Math.round(discountPercentage * 100) / 100;
            
            // Create test voucher
            const voucherCode = `TEST-VOUCHER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const now = new Date();
            const startDate = new Date(now.getTime() - 86400000);
            const endDate = new Date(now.getTime() + 86400000);
            
            const voucher = await Voucher.create({
              code: voucherCode,
              name: 'Test Multi-Item Voucher',
              discount_type: 'percentage',
              discount_value: discountPct,
              minimum_order_amount: 0,
              start_date: startDate,
              end_date: endDate,
              status: 'active'
            });

            const sessionId = `test-voucher-vat-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const cart = await Cart.findOrCreate(null, sessionId);
            const createdProducts = [];

            try {
              // Create and add multiple products to cart
              for (const spec of productSpecs) {
                const price = Math.round(spec.price * 100) / 100;
                const sku = `TEST-VOUCHER-VAT-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
                
                const product = await Product.create({
                  sku,
                  name: `Test Product ${sku}`,
                  description: 'Test product for multi-item voucher',
                  category_id: testCategory.id,
                  price_excluding_vat: price,
                  vat_rate: spec.vatRate,
                  stock_quantity: spec.quantity + 10
                });

                createdProducts.push(product);
                await Cart.addItem(cart.id, product.id, spec.quantity);
              }

              // Get cart before voucher
              const cartBeforeVoucher = await Cart.getById(cart.id);
              const subtotalBeforeDiscount = parseFloat(cartBeforeVoucher.subtotal_excluding_vat);

              // Apply voucher
              const cartAfterVoucher = await Cart.applyVoucher(cart.id, voucherCode);

              // Property: Discount should be applied to total subtotal
              const expectedDiscountAmount = Math.round((subtotalBeforeDiscount * discountPct / 100) * 100) / 100;
              const actualDiscountAmount = parseFloat(cartAfterVoucher.discount_amount);
              
              expect(Math.abs(actualDiscountAmount - expectedDiscountAmount)).toBeLessThan(0.02);

              // Property: VAT should be recalculated on discounted subtotal
              const discountedSubtotal = subtotalBeforeDiscount - actualDiscountAmount;
              
              // Calculate weighted average VAT rate from all items
              let totalVATBeforeDiscount = 0;
              for (const item of cartBeforeVoucher.items) {
                totalVATBeforeDiscount += parseFloat(item.line_total_vat);
              }
              const avgVATRate = (totalVATBeforeDiscount / subtotalBeforeDiscount) * 100;
              
              const expectedVATAfterDiscount = Math.round((discountedSubtotal * avgVATRate / 100) * 100) / 100;
              const actualVATAfterDiscount = parseFloat(cartAfterVoucher.total_vat_amount);
              
              expect(Math.abs(actualVATAfterDiscount - expectedVATAfterDiscount)).toBeLessThan(0.02);

            } finally {
              // Clean up all created products
              for (const product of createdProducts) {
                await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
              }
              await pool.query('DELETE FROM vouchers WHERE id = ?', [voucher.id]);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Unit tests for specific examples and edge cases
  describe('Unit Tests - Specific Examples', () => {
    test('should apply 10% discount and recalculate VAT correctly', async () => {
      // Create test product with 7% VAT
      const sku = `TEST-VOUCHER-VAT-${Date.now()}-UNIT1`;
      const product = await Product.create({
        sku,
        name: 'Unit Test Product',
        description: 'Product for unit test',
        category_id: testCategory.id,
        price_excluding_vat: 1000.00,
        vat_rate: 7.00,
        stock_quantity: 50
      });

      // Create 10% discount voucher
      const voucherCode = `TEST-VOUCHER-${Date.now()}-UNIT1`;
      const now = new Date();
      const voucher = await Voucher.create({
        code: voucherCode,
        name: 'Unit Test 10% Voucher',
        discount_type: 'percentage',
        discount_value: 10,
        minimum_order_amount: 0,
        start_date: new Date(now.getTime() - 86400000),
        end_date: new Date(now.getTime() + 86400000),
        status: 'active'
      });

      // Create cart and add product
      const sessionId = `test-voucher-vat-${Date.now()}-unit1`;
      const cart = await Cart.findOrCreate(null, sessionId);
      await Cart.addItem(cart.id, product.id, 1);

      // Apply voucher
      const cartAfterVoucher = await Cart.applyVoucher(cart.id, voucherCode);

      // Verify calculations
      // Original: 1000.00 (excl VAT) + 70.00 (VAT) = 1070.00
      // After 10% discount: 900.00 (excl VAT) + 63.00 (VAT) = 963.00
      expect(parseFloat(cartAfterVoucher.subtotal_excluding_vat)).toBe(1000.00);
      expect(parseFloat(cartAfterVoucher.discount_amount)).toBe(100.00);
      expect(parseFloat(cartAfterVoucher.total_vat_amount)).toBe(63.00);
      expect(parseFloat(cartAfterVoucher.total_amount)).toBe(963.00);

      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
      await pool.query('DELETE FROM vouchers WHERE id = ?', [voucher.id]);
    });

    test('should apply fixed 50 baht discount and recalculate VAT correctly', async () => {
      const sku = `TEST-VOUCHER-VAT-${Date.now()}-UNIT2`;
      const product = await Product.create({
        sku,
        name: 'Unit Test Product 2',
        description: 'Product for fixed discount test',
        category_id: testCategory.id,
        price_excluding_vat: 500.00,
        vat_rate: 7.00,
        stock_quantity: 50
      });

      // Create 50 baht fixed discount voucher
      const voucherCode = `TEST-VOUCHER-${Date.now()}-UNIT2`;
      const now = new Date();
      const voucher = await Voucher.create({
        code: voucherCode,
        name: 'Unit Test 50 Baht Voucher',
        discount_type: 'fixed_amount',
        discount_value: 50,
        minimum_order_amount: 0,
        start_date: new Date(now.getTime() - 86400000),
        end_date: new Date(now.getTime() + 86400000),
        status: 'active'
      });

      const sessionId = `test-voucher-vat-${Date.now()}-unit2`;
      const cart = await Cart.findOrCreate(null, sessionId);
      await Cart.addItem(cart.id, product.id, 2);

      // Apply voucher
      const cartAfterVoucher = await Cart.applyVoucher(cart.id, voucherCode);

      // Verify calculations
      // Original: 1000.00 (excl VAT) + 70.00 (VAT) = 1070.00
      // After 50 baht discount: 950.00 (excl VAT) + 66.50 (VAT) = 1016.50
      expect(parseFloat(cartAfterVoucher.subtotal_excluding_vat)).toBe(1000.00);
      expect(parseFloat(cartAfterVoucher.discount_amount)).toBe(50.00);
      expect(parseFloat(cartAfterVoucher.total_vat_amount)).toBe(66.50);
      expect(parseFloat(cartAfterVoucher.total_amount)).toBe(1016.50);

      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
      await pool.query('DELETE FROM vouchers WHERE id = ?', [voucher.id]);
    });

    test('should cap discount at max_discount_amount', async () => {
      const sku = `TEST-VOUCHER-VAT-${Date.now()}-UNIT3`;
      const product = await Product.create({
        sku,
        name: 'Unit Test Product 3',
        description: 'Product for capped discount test',
        category_id: testCategory.id,
        price_excluding_vat: 2000.00,
        vat_rate: 7.00,
        stock_quantity: 50
      });

      // Create 50% discount voucher capped at 500 baht
      const voucherCode = `TEST-VOUCHER-${Date.now()}-UNIT3`;
      const now = new Date();
      const voucher = await Voucher.create({
        code: voucherCode,
        name: 'Unit Test Capped Voucher',
        discount_type: 'percentage',
        discount_value: 50,
        max_discount_amount: 500,
        minimum_order_amount: 0,
        start_date: new Date(now.getTime() - 86400000),
        end_date: new Date(now.getTime() + 86400000),
        status: 'active'
      });

      const sessionId = `test-voucher-vat-${Date.now()}-unit3`;
      const cart = await Cart.findOrCreate(null, sessionId);
      await Cart.addItem(cart.id, product.id, 1);

      // Apply voucher
      const cartAfterVoucher = await Cart.applyVoucher(cart.id, voucherCode);

      // Verify calculations
      // 50% of 2000 = 1000, but capped at 500
      // After 500 baht discount: 1500.00 (excl VAT) + 105.00 (VAT) = 1605.00
      expect(parseFloat(cartAfterVoucher.subtotal_excluding_vat)).toBe(2000.00);
      expect(parseFloat(cartAfterVoucher.discount_amount)).toBe(500.00);
      expect(parseFloat(cartAfterVoucher.total_vat_amount)).toBe(105.00);
      expect(parseFloat(cartAfterVoucher.total_amount)).toBe(1605.00);

      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
      await pool.query('DELETE FROM vouchers WHERE id = ?', [voucher.id]);
    });

    test('should handle 10% VAT rate correctly with voucher', async () => {
      const sku = `TEST-VOUCHER-VAT-${Date.now()}-UNIT4`;
      const product = await Product.create({
        sku,
        name: 'Unit Test Product 4',
        description: 'Product with 10% VAT',
        category_id: testCategory.id,
        price_excluding_vat: 800.00,
        vat_rate: 10.00,
        stock_quantity: 50
      });

      const voucherCode = `TEST-VOUCHER-${Date.now()}-UNIT4`;
      const now = new Date();
      const voucher = await Voucher.create({
        code: voucherCode,
        name: 'Unit Test 20% Voucher',
        discount_type: 'percentage',
        discount_value: 20,
        minimum_order_amount: 0,
        start_date: new Date(now.getTime() - 86400000),
        end_date: new Date(now.getTime() + 86400000),
        status: 'active'
      });

      const sessionId = `test-voucher-vat-${Date.now()}-unit4`;
      const cart = await Cart.findOrCreate(null, sessionId);
      await Cart.addItem(cart.id, product.id, 1);

      // Apply voucher
      const cartAfterVoucher = await Cart.applyVoucher(cart.id, voucherCode);

      // Verify calculations with 10% VAT
      // After 20% discount: 640.00 (excl VAT) + 64.00 (VAT) = 704.00
      expect(parseFloat(cartAfterVoucher.subtotal_excluding_vat)).toBe(800.00);
      expect(parseFloat(cartAfterVoucher.discount_amount)).toBe(160.00);
      expect(parseFloat(cartAfterVoucher.total_vat_amount)).toBe(64.00);
      expect(parseFloat(cartAfterVoucher.total_amount)).toBe(704.00);

      await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
      await pool.query('DELETE FROM vouchers WHERE id = ?', [voucher.id]);
    });
  });
});
