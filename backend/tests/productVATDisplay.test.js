/**
 * Property-Based Tests for Product VAT Display
 * Feature: itkmmshop-ecommerce, Property 6
 * Uses fast-check library for property-based testing
 */

const fc = require('fast-check');
const { VATCalculatorService } = require('../services/VATCalculatorService');

describe('Product VAT Display - Property-Based Tests', () => {
  let vatCalculator;

  beforeEach(() => {
    vatCalculator = new VATCalculatorService(7.00);
  });

  /**
   * Property 6: Product VAT Display Completeness
   * Validates: Requirements 3.5
   * 
   * For any product displayed to customers, the system should show 
   * price excluding VAT, VAT amount per unit, and total price including VAT
   */
  describe('Property 6: Product VAT Display Completeness', () => {
    test('should display all required VAT components for any product', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 1000000, noNaN: true }), // price_excluding_vat
          fc.double({ min: 0, max: 100, noNaN: true }), // vat_rate
          (priceExcludingVAT, vatRate) => {
            // Simulate product data structure as it would be stored/retrieved
            const product = {
              price_excluding_vat: Math.round(priceExcludingVAT * 100) / 100,
              vat_rate: vatRate
            };

            // Calculate VAT breakdown (simulating what the system does)
            const breakdown = vatCalculator.calculateVATBreakdown(
              product.price_excluding_vat,
              'exclusive',
              product.vat_rate
            );

            // Property: All three required components must be present and valid
            
            // 1. Price excluding VAT must be present and non-negative
            expect(breakdown.priceExcludingVAT).toBeDefined();
            expect(breakdown.priceExcludingVAT).toBeGreaterThanOrEqual(0);
            expect(typeof breakdown.priceExcludingVAT).toBe('number');

            // 2. VAT amount per unit must be present and non-negative
            expect(breakdown.vatAmount).toBeDefined();
            expect(breakdown.vatAmount).toBeGreaterThanOrEqual(0);
            expect(typeof breakdown.vatAmount).toBe('number');

            // 3. Total price including VAT must be present and non-negative
            expect(breakdown.priceIncludingVAT).toBeDefined();
            expect(breakdown.priceIncludingVAT).toBeGreaterThanOrEqual(0);
            expect(typeof breakdown.priceIncludingVAT).toBe('number');

            // 4. All values should have proper precision (2 decimal places)
            expect(breakdown.priceExcludingVAT).toBe(Math.round(breakdown.priceExcludingVAT * 100) / 100);
            expect(breakdown.vatAmount).toBe(Math.round(breakdown.vatAmount * 100) / 100);
            expect(breakdown.priceIncludingVAT).toBe(Math.round(breakdown.priceIncludingVAT * 100) / 100);

            // 5. Mathematical relationship must hold: price_including = price_excluding + vat_amount
            const calculatedTotal = Math.round((breakdown.priceExcludingVAT + breakdown.vatAmount) * 100) / 100;
            expect(breakdown.priceIncludingVAT).toBe(calculatedTotal);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should display complete VAT information for products with default VAT rate', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          (priceExcludingVAT) => {
            // Product using default VAT rate (7%)
            const product = {
              price_excluding_vat: Math.round(priceExcludingVAT * 100) / 100,
              vat_rate: 7.00
            };

            const breakdown = vatCalculator.calculateVATBreakdown(
              product.price_excluding_vat,
              'exclusive',
              product.vat_rate
            );

            // All three components must be present
            expect(breakdown).toHaveProperty('priceExcludingVAT');
            expect(breakdown).toHaveProperty('vatAmount');
            expect(breakdown).toHaveProperty('priceIncludingVAT');

            // VAT rate should be included in display information
            expect(breakdown).toHaveProperty('vatRate');
            expect(breakdown.vatRate).toBe(7.00);

            // Values should be consistent with 7% VAT
            const expectedVAT = Math.round((product.price_excluding_vat * 7 / 100) * 100) / 100;
            expect(breakdown.vatAmount).toBe(expectedVAT);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should display VAT information consistently across different product prices', () => {
      fc.assert(
        fc.property(
          fc.array(fc.double({ min: 1, max: 10000, noNaN: true }), { minLength: 2, maxLength: 10 }),
          fc.constantFrom(7, 10, 15),
          (prices, vatRate) => {
            // Simulate multiple products with the same VAT rate
            const products = prices.map(price => ({
              price_excluding_vat: Math.round(price * 100) / 100,
              vat_rate: vatRate
            }));

            // Calculate VAT breakdown for each product
            const breakdowns = products.map(product =>
              vatCalculator.calculateVATBreakdown(
                product.price_excluding_vat,
                'exclusive',
                product.vat_rate
              )
            );

            // Property: All products must display all three VAT components
            breakdowns.forEach((breakdown, index) => {
              // All three components must be present
              expect(breakdown.priceExcludingVAT).toBeDefined();
              expect(breakdown.vatAmount).toBeDefined();
              expect(breakdown.priceIncludingVAT).toBeDefined();

              // VAT rate should be consistent
              expect(breakdown.vatRate).toBe(vatRate);

              // Components should be mathematically consistent
              const total = Math.round((breakdown.priceExcludingVAT + breakdown.vatAmount) * 100) / 100;
              expect(breakdown.priceIncludingVAT).toBe(total);

              // VAT percentage should be consistent across all products
              // For very small prices, rounding can cause larger percentage differences
              const vatPercentage = (breakdown.vatAmount / breakdown.priceExcludingVAT) * 100;
              expect(Math.abs(vatPercentage - vatRate)).toBeLessThan(1);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should display VAT information for products with custom VAT rates', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 5000, noNaN: true }),
          fc.double({ min: 0, max: 50, noNaN: true }),
          (priceExcludingVAT, customVATRate) => {
            // Product with custom VAT rate
            const product = {
              price_excluding_vat: Math.round(priceExcludingVAT * 100) / 100,
              vat_rate: customVATRate
            };

            const breakdown = vatCalculator.calculateVATBreakdown(
              product.price_excluding_vat,
              'exclusive',
              product.vat_rate
            );

            // All required components must be present
            expect(breakdown.priceExcludingVAT).toBeDefined();
            expect(breakdown.vatAmount).toBeDefined();
            expect(breakdown.priceIncludingVAT).toBeDefined();
            expect(breakdown.vatRate).toBeDefined();

            // Custom VAT rate should be reflected in the display
            expect(breakdown.vatRate).toBe(customVATRate);

            // VAT calculation should use the custom rate
            const expectedVAT = Math.round((product.price_excluding_vat * customVATRate / 100) * 100) / 100;
            expect(breakdown.vatAmount).toBe(expectedVAT);

            // Total should include VAT calculated with custom rate
            const expectedTotal = Math.round((product.price_excluding_vat + expectedVAT) * 100) / 100;
            expect(breakdown.priceIncludingVAT).toBe(expectedTotal);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should maintain VAT display completeness when product prices are updated', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 10, max: 1000, noNaN: true }),
          fc.double({ min: 10, max: 1000, noNaN: true }),
          fc.constantFrom(7, 10, 15),
          (oldPrice, newPrice, vatRate) => {
            // Original product
            const originalProduct = {
              price_excluding_vat: Math.round(oldPrice * 100) / 100,
              vat_rate: vatRate
            };

            // Updated product (simulating admin price update)
            const updatedProduct = {
              price_excluding_vat: Math.round(newPrice * 100) / 100,
              vat_rate: vatRate
            };

            // Calculate VAT breakdown for both
            const originalBreakdown = vatCalculator.calculateVATBreakdown(
              originalProduct.price_excluding_vat,
              'exclusive',
              originalProduct.vat_rate
            );

            const updatedBreakdown = vatCalculator.calculateVATBreakdown(
              updatedProduct.price_excluding_vat,
              'exclusive',
              updatedProduct.vat_rate
            );

            // Property: Both original and updated products must display all VAT components
            [originalBreakdown, updatedBreakdown].forEach(breakdown => {
              expect(breakdown.priceExcludingVAT).toBeDefined();
              expect(breakdown.vatAmount).toBeDefined();
              expect(breakdown.priceIncludingVAT).toBeDefined();
              expect(breakdown.vatRate).toBeDefined();

              // All values should be valid numbers
              expect(typeof breakdown.priceExcludingVAT).toBe('number');
              expect(typeof breakdown.vatAmount).toBe('number');
              expect(typeof breakdown.priceIncludingVAT).toBe('number');

              // Mathematical consistency
              const total = Math.round((breakdown.priceExcludingVAT + breakdown.vatAmount) * 100) / 100;
              expect(breakdown.priceIncludingVAT).toBe(total);
            });

            // VAT rate should remain consistent
            expect(originalBreakdown.vatRate).toBe(updatedBreakdown.vatRate);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for specific examples and edge cases
  describe('Unit Tests - Product VAT Display Examples', () => {
    test('should display complete VAT information for a standard product', () => {
      const product = {
        price_excluding_vat: 100.00,
        vat_rate: 7.00
      };

      const breakdown = vatCalculator.calculateVATBreakdown(
        product.price_excluding_vat,
        'exclusive',
        product.vat_rate
      );

      expect(breakdown.priceExcludingVAT).toBe(100.00);
      expect(breakdown.vatAmount).toBe(7.00);
      expect(breakdown.priceIncludingVAT).toBe(107.00);
      expect(breakdown.vatRate).toBe(7.00);
    });

    test('should display VAT information for low-priced products', () => {
      const product = {
        price_excluding_vat: 0.50,
        vat_rate: 7.00
      };

      const breakdown = vatCalculator.calculateVATBreakdown(
        product.price_excluding_vat,
        'exclusive',
        product.vat_rate
      );

      expect(breakdown.priceExcludingVAT).toBe(0.50);
      expect(breakdown.vatAmount).toBe(0.04); // Rounded
      expect(breakdown.priceIncludingVAT).toBe(0.54);
    });

    test('should display VAT information for high-priced products', () => {
      const product = {
        price_excluding_vat: 99999.99,
        vat_rate: 7.00
      };

      const breakdown = vatCalculator.calculateVATBreakdown(
        product.price_excluding_vat,
        'exclusive',
        product.vat_rate
      );

      expect(breakdown.priceExcludingVAT).toBe(99999.99);
      expect(breakdown.vatAmount).toBe(7000.00);
      expect(breakdown.priceIncludingVAT).toBe(106999.99);
    });

    test('should display VAT information for products with zero VAT rate', () => {
      const product = {
        price_excluding_vat: 100.00,
        vat_rate: 0.00
      };

      const breakdown = vatCalculator.calculateVATBreakdown(
        product.price_excluding_vat,
        'exclusive',
        product.vat_rate
      );

      expect(breakdown.priceExcludingVAT).toBe(100.00);
      expect(breakdown.vatAmount).toBe(0.00);
      expect(breakdown.priceIncludingVAT).toBe(100.00);
      expect(breakdown.vatRate).toBe(0.00);
    });

    test('should display VAT information with proper decimal precision', () => {
      const product = {
        price_excluding_vat: 123.45,
        vat_rate: 7.00
      };

      const breakdown = vatCalculator.calculateVATBreakdown(
        product.price_excluding_vat,
        'exclusive',
        product.vat_rate
      );

      // All values should have at most 2 decimal places
      expect(breakdown.priceExcludingVAT.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
      expect(breakdown.vatAmount.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
      expect(breakdown.priceIncludingVAT.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });
});
