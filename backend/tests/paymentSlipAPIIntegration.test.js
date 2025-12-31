const fc = require('fast-check');
const SlipOKService = require('../services/SlipOKService');
const Payment = require('../models/Payment');
const fs = require('fs').promises;
const path = require('path');
const db = require('../config/database');

/**
 * Property-Based Test for Payment Slip API Integration
 * Feature: itkmmshop-ecommerce, Property 11: Payment Slip API Integration
 * Validates: Requirements 9.3
 * 
 * Property: For any payment slip upload, the system should send the slip to 
 * SlipOK API for verification and store the verification result
 */

describe('Property 11: Payment Slip API Integration', () => {
  let testSlipPath;
  let testOrderId;

  beforeAll(async () => {
    // Create a test slip image file
    const uploadsDir = path.join(__dirname, '../uploads/test-slips');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    testSlipPath = path.join(uploadsDir, 'test-slip.jpg');
    
    // Create a minimal valid JPEG file (1x1 pixel)
    const minimalJpeg = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
      0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
      0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
      0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
      0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
      0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
      0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
      0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
      0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4,
      0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14,
      0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
      0x00, 0x00, 0x3F, 0x00, 0x7F, 0xFF, 0xD9
    ]);
    
    await fs.writeFile(testSlipPath, minimalJpeg);

    // Create a test order for payment
    const [result] = await db.pool.query(
      `INSERT INTO orders (
        order_number, guest_name, guest_email, guest_phone,
        shipping_address, subtotal_excluding_vat, total_vat_amount,
        total_amount, status, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'TEST-ORDER-' + Date.now(),
        'Test User',
        'test@example.com',
        '0812345678',
        '123 Test St',
        1000.00,
        70.00,
        1070.00,
        'pending',
        'pending'
      ]
    );
    testOrderId = result.insertId;
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.unlink(testSlipPath);
      const uploadsDir = path.dirname(testSlipPath);
      await fs.rmdir(uploadsDir);
    } catch (error) {
      // Ignore cleanup errors
    }

    // Clean up test order
    if (testOrderId) {
      await db.pool.query('DELETE FROM payments WHERE order_id = ?', [testOrderId]);
      await db.pool.query('DELETE FROM orders WHERE id = ?', [testOrderId]);
    }

    // Close database connection
    await db.pool.end();
  });

  /**
   * Property: For any payment slip upload, the system should send the slip to 
   * SlipOK API for verification and store the verification result
   */
  test('should send slip to SlipOK API and store verification result for any valid slip upload', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary payment amounts
        fc.double({ min: 1, max: 100000, noNaN: true }),
        async (amount) => {
          // Round to 2 decimal places
          const paymentAmount = Math.round(amount * 100) / 100;

          // Create payment record with slip
          const payment = await Payment.create({
            order_id: testOrderId,
            payment_method: 'bank_transfer',
            amount: paymentAmount,
            slip_image_path: testSlipPath
          });

          // Verify the payment was created
          expect(payment).toBeDefined();
          expect(payment.id).toBeDefined();
          expect(payment.slip_image_path).toBe(testSlipPath);

          // Call SlipOK API verification
          const verificationResult = await SlipOKService.verifySlip(
            testSlipPath,
            paymentAmount
          );

          // Property 1: System should always return a verification result
          expect(verificationResult).toBeDefined();
          expect(verificationResult).toHaveProperty('success');
          expect(verificationResult).toHaveProperty('verified');

          // Property 2: Verification result should have consistent structure
          if (verificationResult.success) {
            expect(verificationResult).toHaveProperty('data');
            expect(verificationResult).toHaveProperty('raw_response');
          } else {
            expect(verificationResult).toHaveProperty('error');
            expect(verificationResult.error).toHaveProperty('code');
            expect(verificationResult.error).toHaveProperty('message');
          }

          // Format verification result for storage
          const storageData = SlipOKService.formatForStorage(verificationResult);

          // Property 3: Storage data should always have required fields
          expect(storageData).toBeDefined();
          expect(storageData).toHaveProperty('verified');
          expect(storageData).toHaveProperty('slipok_response');
          expect(typeof storageData.verified).toBe('boolean');

          // Update payment with verification result
          const updatedPayment = await Payment.updateVerification(
            payment.id,
            storageData
          );

          // Property 4: Payment should be updated with verification result
          expect(updatedPayment).toBeDefined();
          expect(updatedPayment.verified).toBe(storageData.verified);
          expect(updatedPayment.slipok_response).toBeDefined();

          // Property 5: Verification result should be retrievable
          const retrievedPayment = await Payment.findById(payment.id);
          expect(retrievedPayment).toBeDefined();
          expect(retrievedPayment.verified).toBe(storageData.verified);
          expect(retrievedPayment.slipok_response).toBeDefined();

          // Clean up this test payment
          await Payment.delete(payment.id);
        }
      ),
      {
        numRuns: 100, // Run 100 iterations as specified in design
        timeout: 60000 // 60 second timeout for API calls
      }
    );
  }, 120000); // 2 minute test timeout

  /**
   * Additional property: Slip validation should reject invalid files
   */
  test('should validate slip image before API call for any file', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary file extensions and sizes
        fc.record({
          extension: fc.constantFrom('.jpg', '.jpeg', '.png', '.gif', '.txt', '.pdf'),
          size: fc.integer({ min: 0, max: 10 * 1024 * 1024 }) // 0 to 10MB
        }),
        async ({ extension, size }) => {
          // Create test file with given extension
          const testFile = path.join(
            path.dirname(testSlipPath),
            `test-file-${Date.now()}${extension}`
          );
          
          // Create file with specified size
          const buffer = Buffer.alloc(size);
          await fs.writeFile(testFile, buffer);

          try {
            // Validate the file
            const validation = await SlipOKService.validateSlipImage(testFile);

            // Property: Validation should always return a result
            expect(validation).toBeDefined();
            expect(validation).toHaveProperty('valid');
            expect(typeof validation.valid).toBe('boolean');

            // Property: Valid files should meet criteria
            if (validation.valid) {
              expect(['.jpg', '.jpeg', '.png']).toContain(extension);
              expect(size).toBeLessThanOrEqual(5 * 1024 * 1024); // Max 5MB
            }

            // Property: Invalid files should have error message
            if (!validation.valid) {
              expect(validation).toHaveProperty('error');
              expect(typeof validation.error).toBe('string');
            }
          } finally {
            // Clean up test file
            try {
              await fs.unlink(testFile);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
        }
      ),
      {
        numRuns: 100
      }
    );
  });

  /**
   * Additional property: API should handle errors gracefully
   */
  test('should handle API errors gracefully for any slip path', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary file paths (some valid, some invalid)
        fc.oneof(
          fc.constant(testSlipPath), // Valid path
          fc.constant('/nonexistent/path/slip.jpg'), // Invalid path
          fc.constant(''), // Empty path
          fc.string() // Random string
        ),
        fc.double({ min: 1, max: 100000, noNaN: true }),
        async (slipPath, amount) => {
          const paymentAmount = Math.round(amount * 100) / 100;

          // Call verification (may fail for invalid paths)
          const verificationResult = await SlipOKService.verifySlip(
            slipPath,
            paymentAmount
          );

          // Property: Should always return a result object (never throw)
          expect(verificationResult).toBeDefined();
          expect(verificationResult).toHaveProperty('success');
          expect(verificationResult).toHaveProperty('verified');

          // Property: Failed verifications should have error information
          if (!verificationResult.success || !verificationResult.verified) {
            expect(verificationResult).toHaveProperty('error');
            expect(verificationResult.error).toHaveProperty('code');
            expect(verificationResult.error).toHaveProperty('message');
          }

          // Property: Verified flag should be boolean
          expect(typeof verificationResult.verified).toBe('boolean');
        }
      ),
      {
        numRuns: 100,
        timeout: 60000
      }
    );
  }, 120000);
});
