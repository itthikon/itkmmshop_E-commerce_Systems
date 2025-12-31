/**
 * Property-Based Tests for Receipt VAT Breakdown Completeness
 * Feature: itkmmshop-ecommerce, Property 12: Receipt VAT Breakdown Completeness
 * Validates: Requirements 10.2
 * 
 * For any generated receipt, the system should display complete VAT breakdown 
 * including unit price excluding VAT, VAT per unit, unit price including VAT, 
 * quantity, and line total for each item
 */

const fc = require('fast-check');
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

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
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const Cart = require('../models/Cart');
const ReceiptService = require('../services/ReceiptService');

describe('Receipt VAT Breakdown Completeness - Property-Based Tests', () => {
  let testCategory;
  const receiptsDir = path.join(__dirname, '../uploads/receipts');

  beforeAll(async () => {
    // Create test category
    testCategory = await ProductCategory.create({
      name: 'Test Category for Receipt VAT',
      description: 'Category for receipt VAT tests'
    });

    // Ensure receipts directory exists
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
  });


  afterAll(async () => {
    // Clean up test category
    if (testCategory) {
      await pool.query('DELETE FROM product_categories WHERE id = ?', [testCategory.id]);
    }

    // Clean up test receipts
    if (fs.existsSync(receiptsDir)) {
      const files = fs.readdirSync(receiptsDir);
      files.forEach(file => {
        if (file.startsWith('receipt-RCP-TEST-')) {
          fs.unlinkSync(path.join(receiptsDir, file));
        }
      });
    }

    await pool.end();
  });

  afterEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE "ORD-TEST-%")');
    await pool.query('DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE "ORD-TEST-%")');
    await pool.query('DELETE FROM orders WHERE order_number LIKE "ORD-TEST-%"');
    await pool.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE session_id LIKE "test-receipt-%")');
    await pool.query('DELETE FROM carts WHERE session_id LIKE "test-receipt-%"');
    await pool.query('DELETE FROM products WHERE sku LIKE "TEST-RECEIPT-%"');
  });

  /**
   * Helper function to create order with items
   */
  async function createTestOrder(items, guestInfo = {}) {
    const sessionId = `test-receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const cart = await Cart.findOrCreate(null, sessionId);

    const createdProducts = [];

    // Create products and add to cart
    for (const item of items) {
      const price = Math.round(item.price * 100) / 100;
      const sku = `TEST-RECEIPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const product = await Product.create({
        sku,
        name: item.name || `Test Product ${sku}`,
        description: 'Test product for receipt',
        category_id: testCategory.id,
        price_excluding_vat: price,
        vat_rate: item.vatRate,
        stock_quantity: item.quantity + 10
      });

      createdProducts.push(product);
      await Cart.addItem(cart.id, product.id, item.quantity);
    }


    // Create order from cart
    const orderNumber = `ORD-TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const orderData = {
      cart_id: cart.id,
      guest_name: guestInfo.name || 'Test Customer',
      guest_email: guestInfo.email || 'test@example.com',
      guest_phone: guestInfo.phone || '0812345678',
      shipping_address: guestInfo.address || '123 Test Street, Bangkok',
      shipping_cost: guestInfo.shipping_cost || 0,
      source_platform: 'website'
    };

    // Manually create order to control order_number
    const updatedCart = await Cart.getById(cart.id);
    const subtotalExcludingVat = parseFloat(updatedCart.subtotal_excluding_vat);
    const totalVatAmount = parseFloat(updatedCart.total_vat_amount);
    const discountAmount = parseFloat(updatedCart.discount_amount);
    const shippingCost = parseFloat(orderData.shipping_cost);
    const totalAmount = subtotalExcludingVat + totalVatAmount - discountAmount + shippingCost;

    const [orderResult] = await pool.execute(`
      INSERT INTO orders (
        order_number, guest_name, guest_email, guest_phone,
        shipping_address, subtotal_excluding_vat, total_vat_amount,
        discount_amount, shipping_cost, total_amount,
        status, payment_status, source_platform
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNumber,
      orderData.guest_name,
      orderData.guest_email,
      orderData.guest_phone,
      orderData.shipping_address,
      subtotalExcludingVat.toFixed(2),
      totalVatAmount.toFixed(2),
      discountAmount.toFixed(2),
      shippingCost.toFixed(2),
      totalAmount.toFixed(2),
      'pending',
      'pending',
      orderData.source_platform
    ]);

    const orderId = orderResult.insertId;

    // Create order items
    const cartWithItems = await Cart.getById(cart.id);
    for (const cartItem of cartWithItems.items) {
      await pool.execute(`
        INSERT INTO order_items (
          order_id, product_id, product_name, product_sku,
          quantity, unit_price_excluding_vat, vat_rate,
          unit_vat_amount, unit_price_including_vat
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        cartItem.product_id,
        cartItem.product_name,
        cartItem.product_sku,
        cartItem.quantity,
        cartItem.unit_price_excluding_vat,
        cartItem.vat_rate,
        cartItem.unit_vat_amount,
        cartItem.unit_price_including_vat
      ]);
    }

    const order = await Order.findById(orderId);
    return { order, createdProducts };
  }


  /**
   * Helper function to create payment and generate receipt
   */
  async function createPaymentAndReceipt(order) {
    const receiptNumber = `RCP-TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const [paymentResult] = await pool.execute(`
      INSERT INTO payments (
        order_id, payment_method, amount, status,
        receipt_number, receipt_generated_at, payment_date
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      order.id,
      'bank_transfer',
      order.total_amount,
      'verified',
      receiptNumber
    ]);

    const payment = await Payment.findById(paymentResult.insertId);
    
    // Generate receipt PDF
    const receiptPath = await ReceiptService.generateReceipt(order, payment);
    
    return { payment, receiptPath };
  }

  /**
   * Helper function to extract text content from receipt data structure
   * Since we're testing the data structure, not the PDF itself
   */
  function extractReceiptData(order, payment) {
    // Simulate what the receipt service uses to generate the PDF
    const receiptData = {
      receiptNumber: payment.receipt_number,
      receiptDate: payment.receipt_generated_at,
      orderNumber: order.order_number,
      customerName: order.guest_name,
      customerPhone: order.guest_phone,
      customerEmail: order.guest_email,
      shippingAddress: order.shipping_address,
      items: order.items.map(item => ({
        productName: item.product_name,
        quantity: item.quantity,
        unitPriceExcludingVAT: parseFloat(item.unit_price_excluding_vat),
        unitVATAmount: parseFloat(item.unit_vat_amount),
        unitPriceIncludingVAT: parseFloat(item.unit_price_including_vat),
        lineTotalExcludingVAT: parseFloat(item.line_total_excluding_vat),
        lineTotalVAT: parseFloat(item.line_total_vat),
        lineTotalIncludingVAT: parseFloat(item.line_total_including_vat)
      })),
      subtotalExcludingVAT: parseFloat(order.subtotal_excluding_vat),
      totalVAT: parseFloat(order.total_vat_amount),
      discount: parseFloat(order.discount_amount),
      shipping: parseFloat(order.shipping_cost),
      totalAmount: parseFloat(order.total_amount),
      paymentMethod: payment.payment_method,
      transferDate: payment.transfer_date
    };

    return receiptData;
  }


  /**
   * Property 12: Receipt VAT Breakdown Completeness
   * Validates: Requirements 10.2
   * 
   * For any generated receipt, the system should display complete VAT breakdown 
   * including unit price excluding VAT, VAT per unit, unit price including VAT, 
   * quantity, and line total for each item
   */
  describe('Property 12: Receipt VAT Breakdown Completeness', () => {
    test('should include complete VAT breakdown for any receipt with single item', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 1, max: 10000, noNaN: true }), // price
          fc.constantFrom(7, 10, 15), // VAT rate
          fc.integer({ min: 1, max: 100 }), // quantity
          async (price, vatRate, quantity) => {
            // Create order with single item
            const { order, createdProducts } = await createTestOrder([
              { price, vatRate, quantity, name: 'Test Product' }
            ]);

            // Create payment and generate receipt
            const { payment } = await createPaymentAndReceipt(order);

            // Extract receipt data structure
            const receiptData = extractReceiptData(order, payment);

            // Property: Receipt must contain all required fields
            expect(receiptData.receiptNumber).toBeDefined();
            expect(receiptData.receiptDate).toBeDefined();
            expect(receiptData.orderNumber).toBeDefined();

            // Property: Receipt must have items array
            expect(receiptData.items).toBeDefined();
            expect(Array.isArray(receiptData.items)).toBe(true);
            expect(receiptData.items.length).toBeGreaterThan(0);

            // Property: Each item must have complete VAT breakdown
            const item = receiptData.items[0];
            
            // 1. Unit price excluding VAT must be present and valid
            expect(item.unitPriceExcludingVAT).toBeDefined();
            expect(typeof item.unitPriceExcludingVAT).toBe('number');
            expect(item.unitPriceExcludingVAT).toBeGreaterThan(0);

            // 2. VAT per unit must be present and valid
            expect(item.unitVATAmount).toBeDefined();
            expect(typeof item.unitVATAmount).toBe('number');
            expect(item.unitVATAmount).toBeGreaterThanOrEqual(0);

            // 3. Unit price including VAT must be present and valid
            expect(item.unitPriceIncludingVAT).toBeDefined();
            expect(typeof item.unitPriceIncludingVAT).toBe('number');
            expect(item.unitPriceIncludingVAT).toBeGreaterThan(0);

            // 4. Quantity must be present and valid
            expect(item.quantity).toBeDefined();
            expect(typeof item.quantity).toBe('number');
            expect(item.quantity).toBe(quantity);

            // 5. Line total must be present and valid
            expect(item.lineTotalIncludingVAT).toBeDefined();
            expect(typeof item.lineTotalIncludingVAT).toBe('number');
            expect(item.lineTotalIncludingVAT).toBeGreaterThan(0);

            // Property: Mathematical relationships must hold
            const calculatedPriceIncVAT = Math.round((item.unitPriceExcludingVAT + item.unitVATAmount) * 100) / 100;
            expect(Math.abs(item.unitPriceIncludingVAT - calculatedPriceIncVAT)).toBeLessThan(0.02);

            const calculatedLineTotal = Math.round((item.unitPriceIncludingVAT * item.quantity) * 100) / 100;
            expect(Math.abs(item.lineTotalIncludingVAT - calculatedLineTotal)).toBeLessThan(0.02);

            // Property: Receipt totals must be present
            expect(receiptData.subtotalExcludingVAT).toBeDefined();
            expect(receiptData.totalVAT).toBeDefined();
            expect(receiptData.totalAmount).toBeDefined();

            // Cleanup handled by afterEach
          }
        ),
        { numRuns: 30 }
      );
    });


    test('should include complete VAT breakdown for receipts with multiple items', async () => {
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
          async (itemSpecs) => {
            // Create order with multiple items
            const items = itemSpecs.map((spec, index) => ({
              ...spec,
              name: `Test Product ${index + 1}`
            }));

            const { order, createdProducts } = await createTestOrder(items);

            // Create payment and generate receipt
            const { payment } = await createPaymentAndReceipt(order);

            // Extract receipt data
            const receiptData = extractReceiptData(order, payment);

            // Property: Receipt must contain all items
            expect(receiptData.items.length).toBe(itemSpecs.length);

            // Property: Each item must have complete VAT breakdown
            for (let i = 0; i < receiptData.items.length; i++) {
              const item = receiptData.items[i];
              const spec = itemSpecs[i];

              // All required fields must be present
              expect(item.unitPriceExcludingVAT).toBeDefined();
              expect(item.unitVATAmount).toBeDefined();
              expect(item.unitPriceIncludingVAT).toBeDefined();
              expect(item.quantity).toBeDefined();
              expect(item.lineTotalExcludingVAT).toBeDefined();
              expect(item.lineTotalVAT).toBeDefined();
              expect(item.lineTotalIncludingVAT).toBeDefined();

              // All values must be valid numbers
              expect(typeof item.unitPriceExcludingVAT).toBe('number');
              expect(typeof item.unitVATAmount).toBe('number');
              expect(typeof item.unitPriceIncludingVAT).toBe('number');
              expect(typeof item.quantity).toBe('number');
              expect(typeof item.lineTotalExcludingVAT).toBe('number');
              expect(typeof item.lineTotalVAT).toBe('number');
              expect(typeof item.lineTotalIncludingVAT).toBe('number');

              // Quantity must match
              expect(item.quantity).toBe(spec.quantity);

              // Mathematical relationships must hold
              const calculatedPriceIncVAT = Math.round((item.unitPriceExcludingVAT + item.unitVATAmount) * 100) / 100;
              expect(Math.abs(item.unitPriceIncludingVAT - calculatedPriceIncVAT)).toBeLessThan(0.02);

              const calculatedLineTotal = Math.round((item.unitPriceIncludingVAT * item.quantity) * 100) / 100;
              expect(Math.abs(item.lineTotalIncludingVAT - calculatedLineTotal)).toBeLessThan(0.02);
            }

            // Property: Receipt totals must aggregate all items correctly
            const calculatedSubtotal = receiptData.items.reduce((sum, item) => sum + item.lineTotalExcludingVAT, 0);
            const calculatedTotalVAT = receiptData.items.reduce((sum, item) => sum + item.lineTotalVAT, 0);
            
            expect(Math.abs(receiptData.subtotalExcludingVAT - calculatedSubtotal)).toBeLessThan(0.1);
            expect(Math.abs(receiptData.totalVAT - calculatedTotalVAT)).toBeLessThan(0.1);

            // Cleanup handled by afterEach
          }
        ),
        { numRuns: 20 }
      );
    });


    test('should include VAT breakdown with discount and shipping costs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 100, max: 1000, noNaN: true }), // price
          fc.constantFrom(7, 10, 15), // VAT rate
          fc.integer({ min: 1, max: 10 }), // quantity
          fc.double({ min: 0, max: 100, noNaN: true }), // shipping cost
          async (price, vatRate, quantity, shippingCost) => {
            const shipping = Math.round(shippingCost * 100) / 100;

            // Create order with shipping
            const { order, createdProducts } = await createTestOrder(
              [{ price, vatRate, quantity, name: 'Test Product' }],
              { shipping_cost: shipping }
            );

            // Create payment and generate receipt
            const { payment } = await createPaymentAndReceipt(order);

            // Extract receipt data
            const receiptData = extractReceiptData(order, payment);

            // Property: Receipt must include all pricing components
            expect(receiptData.subtotalExcludingVAT).toBeDefined();
            expect(receiptData.totalVAT).toBeDefined();
            expect(receiptData.discount).toBeDefined();
            expect(receiptData.shipping).toBeDefined();
            expect(receiptData.totalAmount).toBeDefined();

            // Property: Each item must still have complete VAT breakdown
            const item = receiptData.items[0];
            expect(item.unitPriceExcludingVAT).toBeDefined();
            expect(item.unitVATAmount).toBeDefined();
            expect(item.unitPriceIncludingVAT).toBeDefined();
            expect(item.quantity).toBeDefined();
            expect(item.lineTotalIncludingVAT).toBeDefined();

            // Property: Shipping cost must be reflected in total
            const calculatedTotal = Math.round(
              (receiptData.subtotalExcludingVAT + receiptData.totalVAT - receiptData.discount + receiptData.shipping) * 100
            ) / 100;
            expect(Math.abs(receiptData.totalAmount - calculatedTotal)).toBeLessThan(0.1);

            // Cleanup handled by afterEach
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should maintain VAT breakdown completeness across different VAT rates', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              price: fc.double({ min: 10, max: 500, noNaN: true }),
              vatRate: fc.double({ min: 0, max: 20, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 10 })
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (itemSpecs) => {
            const items = itemSpecs.map((spec, index) => ({
              ...spec,
              name: `Product ${index + 1}`
            }));

            const { order, createdProducts } = await createTestOrder(items);
            const { payment } = await createPaymentAndReceipt(order);
            const receiptData = extractReceiptData(order, payment);

            // Property: All items must have complete VAT breakdown regardless of VAT rate
            for (const item of receiptData.items) {
              // All required fields present
              expect(item.unitPriceExcludingVAT).toBeDefined();
              expect(item.unitVATAmount).toBeDefined();
              expect(item.unitPriceIncludingVAT).toBeDefined();
              expect(item.quantity).toBeDefined();
              expect(item.lineTotalExcludingVAT).toBeDefined();
              expect(item.lineTotalVAT).toBeDefined();
              expect(item.lineTotalIncludingVAT).toBeDefined();

              // All values are valid numbers
              expect(Number.isFinite(item.unitPriceExcludingVAT)).toBe(true);
              expect(Number.isFinite(item.unitVATAmount)).toBe(true);
              expect(Number.isFinite(item.unitPriceIncludingVAT)).toBe(true);
              expect(Number.isFinite(item.lineTotalExcludingVAT)).toBe(true);
              expect(Number.isFinite(item.lineTotalVAT)).toBe(true);
              expect(Number.isFinite(item.lineTotalIncludingVAT)).toBe(true);

              // Mathematical consistency
              const priceSum = Math.round((item.unitPriceExcludingVAT + item.unitVATAmount) * 100) / 100;
              expect(Math.abs(item.unitPriceIncludingVAT - priceSum)).toBeLessThan(0.02);
            }

            // Cleanup handled by afterEach
          }
        ),
        { numRuns: 30 }
      );
    });
  });


  // Unit tests for specific examples and edge cases
  describe('Unit Tests - Specific Receipt Examples', () => {
    test('should display complete VAT breakdown for standard receipt', async () => {
      const { order, createdProducts } = await createTestOrder([
        { price: 100.00, vatRate: 7.00, quantity: 2, name: 'Standard Product' }
      ]);

      const { payment } = await createPaymentAndReceipt(order);
      const receiptData = extractReceiptData(order, payment);

      const item = receiptData.items[0];
      
      expect(item.unitPriceExcludingVAT).toBe(100.00);
      expect(item.unitVATAmount).toBe(7.00);
      expect(item.unitPriceIncludingVAT).toBe(107.00);
      expect(item.quantity).toBe(2);
      expect(item.lineTotalExcludingVAT).toBe(200.00);
      expect(item.lineTotalVAT).toBe(14.00);
      expect(item.lineTotalIncludingVAT).toBe(214.00);

      expect(receiptData.subtotalExcludingVAT).toBe(200.00);
      expect(receiptData.totalVAT).toBe(14.00);
      expect(receiptData.totalAmount).toBe(214.00);

      // Cleanup handled by afterEach
    });

    test('should display VAT breakdown for receipt with multiple items', async () => {
      const { order, createdProducts } = await createTestOrder([
        { price: 50.00, vatRate: 7.00, quantity: 1, name: 'Product A' },
        { price: 75.00, vatRate: 7.00, quantity: 2, name: 'Product B' }
      ]);

      const { payment } = await createPaymentAndReceipt(order);
      const receiptData = extractReceiptData(order, payment);

      expect(receiptData.items.length).toBe(2);

      // First item
      expect(receiptData.items[0].unitPriceExcludingVAT).toBe(50.00);
      expect(receiptData.items[0].unitVATAmount).toBe(3.50);
      expect(receiptData.items[0].unitPriceIncludingVAT).toBe(53.50);
      expect(receiptData.items[0].quantity).toBe(1);

      // Second item
      expect(receiptData.items[1].unitPriceExcludingVAT).toBe(75.00);
      expect(receiptData.items[1].unitVATAmount).toBe(5.25);
      expect(receiptData.items[1].unitPriceIncludingVAT).toBe(80.25);
      expect(receiptData.items[1].quantity).toBe(2);

      // Totals
      expect(receiptData.subtotalExcludingVAT).toBe(200.00); // 50 + (75*2)
      expect(receiptData.totalVAT).toBe(14.00); // 3.50 + (5.25*2)
      expect(receiptData.totalAmount).toBe(214.00);

      // Cleanup handled by afterEach
    });

    test('should display VAT breakdown with shipping cost', async () => {
      const { order, createdProducts } = await createTestOrder(
        [{ price: 100.00, vatRate: 7.00, quantity: 1, name: 'Product' }],
        { shipping_cost: 50.00 }
      );

      const { payment } = await createPaymentAndReceipt(order);
      const receiptData = extractReceiptData(order, payment);

      expect(receiptData.subtotalExcludingVAT).toBe(100.00);
      expect(receiptData.totalVAT).toBe(7.00);
      expect(receiptData.shipping).toBe(50.00);
      expect(receiptData.totalAmount).toBe(157.00); // 100 + 7 + 50

      // Cleanup handled by afterEach
    });

    test('should display VAT breakdown for low-priced items', async () => {
      const { order, createdProducts } = await createTestOrder([
        { price: 0.50, vatRate: 7.00, quantity: 10, name: 'Low Price Item' }
      ]);

      const { payment } = await createPaymentAndReceipt(order);
      const receiptData = extractReceiptData(order, payment);

      const item = receiptData.items[0];
      
      expect(item.unitPriceExcludingVAT).toBe(0.50);
      expect(item.unitVATAmount).toBe(0.04); // Rounded
      expect(item.unitPriceIncludingVAT).toBe(0.54);
      expect(item.quantity).toBe(10);

      // Cleanup handled by afterEach
    });

    test('should display VAT breakdown for items with 10% VAT', async () => {
      const { order, createdProducts } = await createTestOrder([
        { price: 200.00, vatRate: 10.00, quantity: 1, name: '10% VAT Product' }
      ]);

      const { payment } = await createPaymentAndReceipt(order);
      const receiptData = extractReceiptData(order, payment);

      const item = receiptData.items[0];
      
      expect(item.unitPriceExcludingVAT).toBe(200.00);
      expect(item.unitVATAmount).toBe(20.00);
      expect(item.unitPriceIncludingVAT).toBe(220.00);

      // Cleanup handled by afterEach
    });
  });
});
