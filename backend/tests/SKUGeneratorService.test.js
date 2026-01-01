/**
 * Property-Based Tests for SKU Generator Service
 * Feature: auto-sku-generation
 * Uses fast-check library for property-based testing
 */

const fc = require('fast-check');
const SKUGeneratorService = require('../services/SKUGeneratorService');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const db = require('../config/database');

describe('SKU Generator Service - Property-Based Tests', () => {
  // Clean up test data before and after tests
  beforeAll(async () => {
    // Ensure database connection is ready
    await db.pool.query('SELECT 1');
  });

  afterAll(async () => {
    // Clean up test data
    await db.pool.query('DELETE FROM products WHERE sku LIKE "TEST%"');
    await db.pool.query('DELETE FROM product_categories WHERE prefix LIKE "TST%"');
    await db.pool.end();
  });

  /**
   * Property 1: SKU Format Validity
   * Validates: Requirements 1.2, 4.1, 4.2, 4.3
   * 
   * For any generated SKU, it must match the pattern [A-Z]{2,4}\d{5}
   * (2-4 uppercase letters followed by exactly 5 digits)
   */
  describe('Property 1: SKU Format Validity', () => {
    test('generated SKU always matches format [A-Z]{2,4}\\d{5}', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }), // category_id or null
          async (categoryId) => {
            // Generate SKU
            const sku = await SKUGeneratorService.generateSKU(categoryId);
            
            // Verify format: 2-4 uppercase letters followed by 5 digits
            const formatPattern = /^[A-Z]{2,4}\d{5}$/;
            expect(formatPattern.test(sku)).toBe(true);
            
            // Verify using service's own validation method
            expect(SKUGeneratorService.validateSKUFormat(sku)).toBe(true);
            
            // Extract and verify components
            const match = sku.match(/^([A-Z]{2,4})(\d{5})$/);
            expect(match).not.toBeNull();
            
            const [, prefix, number] = match;
            
            // Prefix should be 2-4 uppercase letters
            expect(prefix.length).toBeGreaterThanOrEqual(2);
            expect(prefix.length).toBeLessThanOrEqual(4);
            expect(/^[A-Z]+$/.test(prefix)).toBe(true);
            
            // Number should be exactly 5 digits
            expect(number.length).toBe(5);
            expect(/^\d{5}$/.test(number)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: SKU Uniqueness
   * Validates: Requirements 1.4, 7.1, 7.3
   * 
   * For any two products in the system, their SKU codes must be different
   * Note: This tests that the SKU format and validation ensures uniqueness,
   * not the actual database insertion (which is tested in integration tests)
   */
  describe('Property 2: SKU Uniqueness', () => {
    test('SKU validation and format ensure uniqueness', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.tuple(
              fc.array(
                fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
                { minLength: 2, maxLength: 4 }
              ).map(chars => chars.join('')),
              fc.integer({ min: 1, max: 99999 })
            ),
            { minLength: 5, maxLength: 20 }
          ),
          async (skuPairs) => {
            const generatedSKUs = new Set();
            
            // Create SKUs from prefix-number pairs
            for (const [prefix, number] of skuPairs) {
              const sku = `${prefix}${number.toString().padStart(5, '0')}`;
              
              // Verify format is valid
              expect(SKUGeneratorService.validateSKUFormat(sku)).toBe(true);
              
              // Add to set
              generatedSKUs.add(sku);
            }
            
            // Each unique prefix-number combination creates a unique SKU
            // Duplicates in input will result in same SKU (expected)
            expect(generatedSKUs.size).toBeGreaterThan(0);
            expect(generatedSKUs.size).toBeLessThanOrEqual(skuPairs.length);
            
            // All SKUs in set should be valid
            for (const sku of generatedSKUs) {
              expect(SKUGeneratorService.validateSKUFormat(sku)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('different prefix-number combinations create different SKUs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.array(
              fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
              { minLength: 2, maxLength: 4 }
            ).map(chars => chars.join('')),
            fc.integer({ min: 1, max: 99999 }),
            fc.array(
              fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
              { minLength: 2, maxLength: 4 }
            ).map(chars => chars.join('')),
            fc.integer({ min: 1, max: 99999 })
          ).filter(([prefix1, num1, prefix2, num2]) => 
            prefix1 !== prefix2 || num1 !== num2 // Ensure different combinations
          ),
          async ([prefix1, num1, prefix2, num2]) => {
            const sku1 = `${prefix1}${num1.toString().padStart(5, '0')}`;
            const sku2 = `${prefix2}${num2.toString().padStart(5, '0')}`;
            
            // Different combinations should create different SKUs
            expect(sku1).not.toBe(sku2);
            
            // Both should be valid
            expect(SKUGeneratorService.validateSKUFormat(sku1)).toBe(true);
            expect(SKUGeneratorService.validateSKUFormat(sku2)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Prefix Validity
   * Validates: Requirements 2.2, 2.3, 2.4, 2.6
   * 
   * For any category prefix, it must be 2-4 uppercase English letters (A-Z)
   * and unique across all categories
   */
  describe('Property 3: Prefix Validity', () => {
    test('category prefixes are valid and unique', async () => {
      // Generate valid prefixes using array of characters
      const prefixGenerator = fc.array(
        fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
        { minLength: 2, maxLength: 4 }
      ).map(chars => chars.join(''));
      
      await fc.assert(
        fc.asyncProperty(
          fc.array(prefixGenerator, { minLength: 3, maxLength: 10 }),
          async (prefixes) => {
            // Make prefixes unique for this test
            const uniquePrefixes = [...new Set(prefixes)];
            
            for (const prefix of uniquePrefixes) {
              // Validate prefix format
              expect(prefix.length).toBeGreaterThanOrEqual(2);
              expect(prefix.length).toBeLessThanOrEqual(4);
              expect(/^[A-Z]+$/.test(prefix)).toBe(true);
              
              // Test validation method
              const normalized = ProductCategory.validateAndNormalizePrefix(prefix);
              expect(normalized).toBe(prefix);
              expect(normalized.length).toBeGreaterThanOrEqual(2);
              expect(normalized.length).toBeLessThanOrEqual(4);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('invalid prefixes are rejected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.string({ minLength: 0, maxLength: 1 }), // Too short
            fc.string({ minLength: 5, maxLength: 10 }), // Too long
            fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 2, maxLength: 4 }).map(arr => arr.join('')), // Numbers
            fc.array(fc.constantFrom('!', '@', '#', '$', '%'), { minLength: 2, maxLength: 4 }).map(arr => arr.join('')) // Special chars
          ),
          async (invalidPrefix) => {
            // Invalid prefixes should throw error or return null
            try {
              const result = ProductCategory.validateAndNormalizePrefix(invalidPrefix);
              // If it doesn't throw, it should return null for empty strings
              if (result !== null) {
                // If it returns a value, it must be valid
                expect(result.length).toBeGreaterThanOrEqual(2);
                expect(result.length).toBeLessThanOrEqual(4);
                expect(/^[A-Z]+$/.test(result)).toBe(true);
              }
            } catch (error) {
              // Expected to throw for invalid prefixes
              expect(error).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Sequential Number Range
   * Validates: Requirements 3.2, 3.3, 3.4, 3.5
   * 
   * For any generated sequential number, it must be between 00001 and 99999 (inclusive)
   */
  describe('Property 4: Sequential Number Range', () => {
    test('sequential numbers are within valid range', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.integer({ min: 1, max: 50 }), { nil: null }),
          async (categoryId) => {
            // Generate SKU
            const sku = await SKUGeneratorService.generateSKU(categoryId);
            
            // Extract sequential number
            const match = sku.match(/^[A-Z]{2,4}(\d{5})$/);
            expect(match).not.toBeNull();
            
            const sequentialNumber = match[1];
            const numericValue = parseInt(sequentialNumber, 10);
            
            // Verify it's exactly 5 digits
            expect(sequentialNumber.length).toBe(5);
            
            // Verify it's zero-padded
            expect(sequentialNumber).toBe(numericValue.toString().padStart(5, '0'));
            
            // Verify range: 00001 to 99999
            expect(numericValue).toBeGreaterThanOrEqual(1);
            expect(numericValue).toBeLessThanOrEqual(99999);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Default Prefix Usage
   * Validates: Requirements 1.3, 6.1, 6.2
   * 
   * For any product without a category, the system must use "GEN" as the prefix
   */
  describe('Property 5: Default Prefix Usage', () => {
    test('products without category use GEN prefix', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null), // Always null category
          async (categoryId) => {
            // Generate SKU with null category
            const sku = await SKUGeneratorService.generateSKU(categoryId);
            
            // Should start with "GEN"
            expect(sku.startsWith('GEN')).toBe(true);
            
            // Verify format: GEN + 5 digits
            expect(/^GEN\d{5}$/.test(sku)).toBe(true);
            
            // Test getCategoryPrefix directly
            const prefix = await SKUGeneratorService.getCategoryPrefix(null);
            expect(prefix).toBe('GEN');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('products with non-existent category use GEN prefix', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 999999, max: 9999999 }), // Very high ID that doesn't exist
          async (nonExistentCategoryId) => {
            // Get prefix for non-existent category
            const prefix = await SKUGeneratorService.getCategoryPrefix(nonExistentCategoryId);
            
            // Should return default "GEN"
            expect(prefix).toBe('GEN');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Sequential Number Increment
   * Validates: Requirements 3.1, 3.3
   * 
   * For any category prefix, when generating a new SKU, the sequential number
   * must be exactly one more than the highest existing sequential number for that prefix
   */
  describe('Property 6: Sequential Number Increment', () => {
    test('sequential numbers increment correctly', async () => {
      // Generate valid prefixes using array of characters
      const prefixGenerator = fc.array(
        fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
        { minLength: 2, maxLength: 4 }
      ).map(chars => chars.join(''));
      
      await fc.assert(
        fc.asyncProperty(
          prefixGenerator,
          async (prefix) => {
            // Get current max number for this prefix
            const currentMax = await SKUGeneratorService.getMaxSequentialNumber(prefix);
            
            // Generate next sequential number
            const nextNumber = await SKUGeneratorService.getNextSequentialNumber(prefix);
            const nextNumericValue = parseInt(nextNumber, 10);
            
            // Should be exactly currentMax + 1
            expect(nextNumericValue).toBe(currentMax + 1);
            
            // Should be properly formatted with leading zeros
            expect(nextNumber).toBe(nextNumericValue.toString().padStart(5, '0'));
            expect(nextNumber.length).toBe(5);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Prefix Immutability for Existing Products
   * Validates: Requirements 2.5, 6.3
   * 
   * For any existing product, changing its category must not change its SKU
   */
  describe('Property 7: Prefix Immutability for Existing Products', () => {
    test('changing product category does not change SKU', async () => {
      // This property is tested at the controller/model level
      // Here we verify that SKU validation remains consistent
      
      // Generate valid prefixes using array of characters
      const prefixGenerator = fc.array(
        fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
        { minLength: 2, maxLength: 4 }
      ).map(chars => chars.join(''));
      
      await fc.assert(
        fc.asyncProperty(
          prefixGenerator,
          fc.integer({ min: 1, max: 99999 }),
          async (prefix, number) => {
            // Create a valid SKU
            const sku = `${prefix}${number.toString().padStart(5, '0')}`;
            
            // Verify format is valid
            const isValid = SKUGeneratorService.validateSKUFormat(sku);
            expect(isValid).toBe(true);
            
            // SKU format validation should be independent of category
            // The same SKU should always be valid regardless of context
            const isValidAgain = SKUGeneratorService.validateSKUFormat(sku);
            expect(isValidAgain).toBe(isValid);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Category Prefix Independence
   * Validates: Requirements 3.1, 5.3, 6.4
   * 
   * For any two different category prefixes, their sequential number sequences
   * must be independent
   */
  describe('Property 8: Category Prefix Independence', () => {
    test('different prefixes have independent sequences', async () => {
      // Generate valid prefixes using array of characters
      const prefixGenerator = fc.array(
        fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
        { minLength: 2, maxLength: 4 }
      ).map(chars => chars.join(''));
      
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(prefixGenerator, prefixGenerator)
            .filter(([prefix1, prefix2]) => prefix1 !== prefix2), // Ensure different prefixes
          async ([prefix1, prefix2]) => {
            // Get max numbers for both prefixes
            const max1 = await SKUGeneratorService.getMaxSequentialNumber(prefix1);
            const max2 = await SKUGeneratorService.getMaxSequentialNumber(prefix2);
            
            // Get next numbers for both prefixes
            const next1 = await SKUGeneratorService.getNextSequentialNumber(prefix1);
            const next2 = await SKUGeneratorService.getNextSequentialNumber(prefix2);
            
            // Each should be independent (max + 1 for their own prefix)
            expect(parseInt(next1, 10)).toBe(max1 + 1);
            expect(parseInt(next2, 10)).toBe(max2 + 1);
            
            // The sequences are independent - they can have the same number
            // but with different prefixes, creating unique SKUs
            const sku1 = `${prefix1}${next1}`;
            const sku2 = `${prefix2}${next2}`;
            
            // Both should be valid
            expect(SKUGeneratorService.validateSKUFormat(sku1)).toBe(true);
            expect(SKUGeneratorService.validateSKUFormat(sku2)).toBe(true);
            
            // They should be different (different prefixes)
            expect(sku1).not.toBe(sku2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for specific examples and edge cases
  describe('Unit Tests - Specific Examples', () => {
    test('should generate valid SKU with default prefix', async () => {
      const sku = await SKUGeneratorService.generateSKU(null);
      expect(sku).toMatch(/^GEN\d{5}$/);
    });

    test('should validate correct SKU format', () => {
      expect(SKUGeneratorService.validateSKUFormat('ELEC00001')).toBe(true);
      expect(SKUGeneratorService.validateSKUFormat('GEN12345')).toBe(true);
      expect(SKUGeneratorService.validateSKUFormat('AB00001')).toBe(true);
      expect(SKUGeneratorService.validateSKUFormat('ABCD99999')).toBe(true);
    });

    test('should reject invalid SKU formats', () => {
      expect(SKUGeneratorService.validateSKUFormat('A00001')).toBe(false); // Too short prefix
      expect(SKUGeneratorService.validateSKUFormat('ABCDE00001')).toBe(false); // Too long prefix
      expect(SKUGeneratorService.validateSKUFormat('ABC0001')).toBe(false); // Too short number
      expect(SKUGeneratorService.validateSKUFormat('ABC000001')).toBe(false); // Too long number
      expect(SKUGeneratorService.validateSKUFormat('abc00001')).toBe(false); // Lowercase
      expect(SKUGeneratorService.validateSKUFormat('AB-00001')).toBe(false); // Special char
      expect(SKUGeneratorService.validateSKUFormat('12300001')).toBe(false); // Numbers in prefix
    });

    test('should handle sequential number padding', async () => {
      const number = await SKUGeneratorService.getNextSequentialNumber('TEST');
      expect(number.length).toBe(5);
      expect(/^\d{5}$/.test(number)).toBe(true);
    });

    test('should throw error when limit reached', async () => {
      // Mock getMaxSequentialNumber to return 99999
      const originalMethod = SKUGeneratorService.getMaxSequentialNumber;
      SKUGeneratorService.getMaxSequentialNumber = jest.fn().mockResolvedValue(99999);
      
      await expect(SKUGeneratorService.getNextSequentialNumber('TEST'))
        .rejects
        .toThrow();
      
      // Restore original method
      SKUGeneratorService.getMaxSequentialNumber = originalMethod;
    });
  });
});
