/**
 * Property-Based Tests for VAT Calculator Service
 * Feature: itkmmshop-ecommerce
 * Uses fast-check library for property-based testing
 */

const fc = require('fast-check');
const { VATCalculatorService } = require('../services/VATCalculatorService');

describe('VAT Calculator Service - Property-Based Tests', () => {
  let vatCalculator;

  beforeEach(() => {
    vatCalculator = new VATCalculatorService(7.00);
  });

  /**
   * Property 15: VAT Calculation Rate Accuracy
   * Validates: Requirements 15.1
   * 
   * For any VAT calculation, the system should apply the configured rate 
   * (default 7%) to each product unit and allow rate configuration by admin
   */
  describe('Property 15: VAT Calculation Rate Accuracy', () => {
    test('should apply configured VAT rate accurately to any price', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 1000000, noNaN: true }), // Avoid very small numbers
          fc.double({ min: 0, max: 100, noNaN: true }),
          (price, vatRate) => {
            // Calculate VAT amount
            const vatAmount = vatCalculator.calculateVATAmount(price, vatRate);
            
            // Expected VAT amount
            const expectedVAT = Math.round((price * vatRate / 100) * 100) / 100;
            
            // VAT amount should match expected calculation
            expect(vatAmount).toBe(expectedVAT);
            
            // VAT amount should be non-negative
            expect(vatAmount).toBeGreaterThanOrEqual(0);
            
            // VAT amount should not exceed the original price for rates <= 100%
            // Allow small tolerance for floating-point precision
            if (vatRate <= 100) {
              expect(vatAmount).toBeLessThanOrEqual(price + 0.01);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should calculate price including VAT correctly for any price and rate', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 1000000, noNaN: true }), // Avoid very small numbers
          fc.double({ min: 0, max: 100, noNaN: true }),
          (price, vatRate) => {
            const priceIncludingVAT = vatCalculator.calculatePriceIncludingVAT(price, vatRate);
            const vatAmount = vatCalculator.calculateVATAmount(price, vatRate);
            
            // Price including VAT should equal price + VAT amount
            const expected = Math.round((price + vatAmount) * 100) / 100;
            expect(priceIncludingVAT).toBe(expected);
            
            // Price including VAT should be greater than or equal to original price
            // Allow small tolerance for floating-point precision
            expect(priceIncludingVAT).toBeGreaterThanOrEqual(price - 0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should allow configurable VAT rates and apply them correctly', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0, max: 50, noNaN: true }),
          (price, customRate) => {
            // Set custom rate
            vatCalculator.setDefaultRate(customRate);
            
            // Calculate with default (now custom) rate
            const vatWithDefault = vatCalculator.calculateVATAmount(price);
            
            // Calculate with explicit rate
            const vatWithExplicit = vatCalculator.calculateVATAmount(price, customRate);
            
            // Both should be equal
            expect(vatWithDefault).toBe(vatWithExplicit);
            
            // Verify the rate was actually applied
            const expectedVAT = Math.round((price * customRate / 100) * 100) / 100;
            expect(vatWithDefault).toBe(expectedVAT);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should maintain precision in VAT calculations', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.constantFrom(7, 10, 15, 20),
          (price, vatRate) => {
            const breakdown = vatCalculator.calculateVATBreakdown(price, 'exclusive', vatRate);
            
            // Sum of components should equal total
            const calculatedTotal = Math.round((breakdown.priceExcludingVAT + breakdown.vatAmount) * 100) / 100;
            expect(breakdown.priceIncludingVAT).toBe(calculatedTotal);
            
            // VAT rate should be preserved
            expect(breakdown.vatRate).toBe(vatRate);
            
            // All values should have at most 2 decimal places
            expect(breakdown.priceExcludingVAT).toBe(Math.round(breakdown.priceExcludingVAT * 100) / 100);
            expect(breakdown.vatAmount).toBe(Math.round(breakdown.vatAmount * 100) / 100);
            expect(breakdown.priceIncludingVAT).toBe(Math.round(breakdown.priceIncludingVAT * 100) / 100);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle reverse calculation (inclusive to exclusive) correctly', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 10000, noNaN: true }),
          fc.constantFrom(7, 10, 15),
          (priceIncludingVAT, vatRate) => {
            // Calculate price excluding VAT from price including VAT
            const priceExcludingVAT = vatCalculator.calculatePriceExcludingVAT(priceIncludingVAT, vatRate);
            
            // Recalculate price including VAT from the result
            const recalculatedPriceIncludingVAT = vatCalculator.calculatePriceIncludingVAT(priceExcludingVAT, vatRate);
            
            // Should get back to original price (within rounding tolerance)
            expect(Math.abs(recalculatedPriceIncludingVAT - priceIncludingVAT)).toBeLessThan(0.02);
            
            // Price excluding VAT should be less than price including VAT
            expect(priceExcludingVAT).toBeLessThanOrEqual(priceIncludingVAT);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: Product Price VAT Auto-calculation
   * Validates: Requirements 11.2
   * 
   * For any product price set by admin, the system should automatically 
   * calculate VAT per unit and total price including VAT using the configured VAT rate
   */
  describe('Property 13: Product Price VAT Auto-calculation', () => {
    test('should automatically calculate VAT and total price for any product price', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 1000000, noNaN: true }), // Product price excluding VAT
          fc.double({ min: 0, max: 100, noNaN: true }), // VAT rate
          (priceExcludingVAT, vatRate) => {
            // When admin sets a product price, calculate VAT breakdown
            const breakdown = vatCalculator.calculateVATBreakdown(priceExcludingVAT, 'exclusive', vatRate);
            
            // VAT per unit should be automatically calculated
            const expectedVATPerUnit = Math.round((priceExcludingVAT * vatRate / 100) * 100) / 100;
            expect(breakdown.vatAmount).toBe(expectedVATPerUnit);
            
            // Total price including VAT should be automatically calculated
            const expectedTotalPrice = Math.round((priceExcludingVAT + expectedVATPerUnit) * 100) / 100;
            expect(breakdown.priceIncludingVAT).toBe(expectedTotalPrice);
            
            // The original price should be preserved
            expect(breakdown.priceExcludingVAT).toBe(Math.round(priceExcludingVAT * 100) / 100);
            
            // The VAT rate should be stored
            expect(breakdown.vatRate).toBe(vatRate);
            
            // All calculated values should be non-negative
            expect(breakdown.vatAmount).toBeGreaterThanOrEqual(0);
            expect(breakdown.priceIncludingVAT).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should use default VAT rate when admin does not specify custom rate', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          (priceExcludingVAT) => {
            // Set a known default rate
            const defaultRate = 7.00;
            vatCalculator.setDefaultRate(defaultRate);
            
            // Calculate without specifying rate (should use default)
            const breakdown = vatCalculator.calculateVATBreakdown(priceExcludingVAT, 'exclusive');
            
            // Should use the default rate
            expect(breakdown.vatRate).toBe(defaultRate);
            
            // VAT should be calculated using default rate
            const expectedVAT = Math.round((priceExcludingVAT * defaultRate / 100) * 100) / 100;
            expect(breakdown.vatAmount).toBe(expectedVAT);
            
            // Total price should include VAT calculated with default rate
            const expectedTotal = Math.round((priceExcludingVAT + expectedVAT) * 100) / 100;
            expect(breakdown.priceIncludingVAT).toBe(expectedTotal);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should maintain consistency when admin changes VAT rate configuration', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 10, max: 1000, noNaN: true }), // Increased min to avoid rounding edge cases
          fc.double({ min: 5, max: 20, noNaN: true }),
          fc.double({ min: 5, max: 20, noNaN: true }),
          (price, rate1, rate2) => {
            // Calculate with first rate
            const breakdown1 = vatCalculator.calculateVATBreakdown(price, 'exclusive', rate1);
            
            // Calculate with second rate
            const breakdown2 = vatCalculator.calculateVATBreakdown(price, 'exclusive', rate2);
            
            // Base price should remain the same
            expect(breakdown1.priceExcludingVAT).toBe(breakdown2.priceExcludingVAT);
            
            // VAT amounts should differ if rates differ significantly
            // Use a threshold that accounts for rounding: difference must be > 0.01 after rounding
            const rateDiff = Math.abs(rate1 - rate2);
            const vatDiff = Math.abs(breakdown1.vatAmount - breakdown2.vatAmount);
            
            if (rateDiff > 0.1) { // Only check if rates differ by more than 0.1%
              expect(vatDiff).toBeGreaterThan(0);
              expect(breakdown1.priceIncludingVAT).not.toBe(breakdown2.priceIncludingVAT);
            }
            
            // Each breakdown should be internally consistent
            const total1 = Math.round((breakdown1.priceExcludingVAT + breakdown1.vatAmount) * 100) / 100;
            expect(breakdown1.priceIncludingVAT).toBe(total1);
            
            const total2 = Math.round((breakdown2.priceExcludingVAT + breakdown2.vatAmount) * 100) / 100;
            expect(breakdown2.priceIncludingVAT).toBe(total2);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle product price updates with automatic VAT recalculation', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 10, max: 1000, noNaN: true }),
          fc.double({ min: 10, max: 1000, noNaN: true }),
          fc.constantFrom(7, 10, 15),
          (oldPrice, newPrice, vatRate) => {
            // Calculate VAT for old price
            const oldBreakdown = vatCalculator.calculateVATBreakdown(oldPrice, 'exclusive', vatRate);
            
            // Calculate VAT for new price (simulating admin updating product price)
            const newBreakdown = vatCalculator.calculateVATBreakdown(newPrice, 'exclusive', vatRate);
            
            // VAT rate should remain the same
            expect(oldBreakdown.vatRate).toBe(newBreakdown.vatRate);
            
            // VAT amounts should be proportional to prices
            const oldRatio = oldBreakdown.vatAmount / oldBreakdown.priceExcludingVAT;
            const newRatio = newBreakdown.vatAmount / newBreakdown.priceExcludingVAT;
            
            // Ratios should be approximately equal (within rounding tolerance)
            expect(Math.abs(oldRatio - newRatio)).toBeLessThan(0.001);
            
            // Both breakdowns should be valid
            expect(oldBreakdown.priceIncludingVAT).toBeGreaterThan(oldBreakdown.priceExcludingVAT);
            expect(newBreakdown.priceIncludingVAT).toBeGreaterThan(newBreakdown.priceExcludingVAT);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for specific examples and edge cases
  describe('Unit Tests - Specific Examples', () => {
    test('should calculate VAT correctly for standard 7% rate', () => {
      expect(vatCalculator.calculateVATAmount(100, 7)).toBe(7);
      expect(vatCalculator.calculatePriceIncludingVAT(100, 7)).toBe(107);
    });

    test('should handle zero price', () => {
      expect(vatCalculator.calculateVATAmount(0, 7)).toBe(0);
      expect(vatCalculator.calculatePriceIncludingVAT(0, 7)).toBe(0);
    });

    test('should handle zero VAT rate', () => {
      expect(vatCalculator.calculateVATAmount(100, 0)).toBe(0);
      expect(vatCalculator.calculatePriceIncludingVAT(100, 0)).toBe(100);
    });

    test('should throw error for negative price', () => {
      expect(() => vatCalculator.calculateVATAmount(-100, 7)).toThrow();
    });

    test('should throw error for invalid VAT rate', () => {
      expect(() => vatCalculator.calculateVATAmount(100, -5)).toThrow();
      expect(() => vatCalculator.calculateVATAmount(100, 150)).toThrow();
    });

    test('should calculate cart VAT correctly', () => {
      const items = [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 3 }
      ];
      const result = vatCalculator.calculateCartVAT(items, 'exclusive', 7);
      
      expect(result.totals.subtotalExcludingVAT).toBe(350);
      expect(result.totals.totalVAT).toBe(24.5);
      expect(result.totals.totalIncludingVAT).toBe(374.5);
    });
  });
});
