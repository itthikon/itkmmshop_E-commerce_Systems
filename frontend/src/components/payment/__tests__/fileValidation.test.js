/**
 * Property-Based Tests for File Validation
 * Feature: payment-slip-management
 * Property 1: File Validation Consistency
 * Validates: Requirements 1.3, 1.6, 1.7
 */

import * as fc from 'fast-check';
import { validateImageFile, formatFileSize } from '../../../utils/fileValidation';

// Constants from the validation module
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Helper function to create a mock File object
 */
const createMockFile = (name, size, type) => {
  // Create a Blob with the specified size
  const content = new Array(size).fill('a').join('');
  const blob = new Blob([content], { type });
  
  // Create a File object from the Blob
  const file = new File([blob], name, { type });
  
  // Override the size property to ensure it matches exactly
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false
  });
  
  return file;
};

/**
 * Arbitrary generator for valid image files
 */
const validImageFileArbitrary = () => {
  return fc.record({
    extension: fc.constantFrom(...ALLOWED_EXTENSIONS),
    mimeType: fc.constantFrom(...ALLOWED_IMAGE_TYPES),
    size: fc.integer({ min: 1, max: MAX_FILE_SIZE }),
    basename: fc.string({ 
      minLength: 1, 
      maxLength: 20,
      unit: fc.constantFrom(
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        '_', '-'
      )
    })
  }).map(({ extension, mimeType, size, basename }) => {
    const filename = `${basename}${extension}`;
    return createMockFile(filename, size, mimeType);
  });
};

/**
 * Arbitrary generator for invalid image files (wrong type)
 */
const invalidTypeFileArbitrary = () => {
  const invalidTypes = [
    'application/pdf',
    'text/plain',
    'application/zip',
    'video/mp4',
    'audio/mp3',
    'application/msword',
    'text/html',
    'application/json'
  ];
  
  const invalidExtensions = [
    '.pdf', '.txt', '.zip', '.mp4', '.mp3', 
    '.doc', '.docx', '.html', '.json', '.gif', '.bmp'
  ];
  
  return fc.record({
    extension: fc.constantFrom(...invalidExtensions),
    mimeType: fc.constantFrom(...invalidTypes),
    size: fc.integer({ min: 1, max: MAX_FILE_SIZE }),
    basename: fc.string({ 
      minLength: 1, 
      maxLength: 20,
      unit: fc.constantFrom('a', 'b', 'c', 'd', 'e', '0', '1', '2', '3', '_', '-')
    })
  }).map(({ extension, mimeType, size, basename }) => {
    const filename = `${basename}${extension}`;
    return createMockFile(filename, size, mimeType);
  });
};

/**
 * Arbitrary generator for oversized image files
 */
const oversizedImageFileArbitrary = () => {
  return fc.record({
    extension: fc.constantFrom(...ALLOWED_EXTENSIONS),
    mimeType: fc.constantFrom(...ALLOWED_IMAGE_TYPES),
    size: fc.integer({ min: MAX_FILE_SIZE + 1, max: MAX_FILE_SIZE * 3 }),
    basename: fc.string({ 
      minLength: 1, 
      maxLength: 20,
      unit: fc.constantFrom('a', 'b', 'c', 'd', 'e', '0', '1', '2', '3', '_', '-')
    })
  }).map(({ extension, mimeType, size, basename }) => {
    const filename = `${basename}${extension}`;
    return createMockFile(filename, size, mimeType);
  });
};

/**
 * Arbitrary generator for files with mismatched extension and MIME type
 */
const mismatchedFileArbitrary = () => {
  return fc.record({
    extension: fc.constantFrom('.pdf', '.txt', '.zip'),
    mimeType: fc.constantFrom(...ALLOWED_IMAGE_TYPES),
    size: fc.integer({ min: 1, max: MAX_FILE_SIZE }),
    basename: fc.string({ 
      minLength: 1, 
      maxLength: 20,
      unit: fc.constantFrom('a', 'b', 'c', 'd', 'e', '0', '1', '2', '3', '_', '-')
    })
  }).map(({ extension, mimeType, size, basename }) => {
    const filename = `${basename}${extension}`;
    return createMockFile(filename, size, mimeType);
  });
};

describe('File Validation Property-Based Tests', () => {
  describe('Property 1: File Validation Consistency', () => {
    /**
     * Test that all valid image files are accepted
     * For any valid image file (correct type, correct extension, size <= 5MB),
     * the validation should return valid: true
     */
    test('should accept all valid image files', () => {
      fc.assert(
        fc.property(validImageFileArbitrary(), (file) => {
          const result = validateImageFile(file);
          
          // Valid files should pass validation
          expect(result.valid).toBe(true);
          expect(result.error).toBeNull();
          
          // Verify the file meets all criteria
          expect(ALLOWED_IMAGE_TYPES).toContain(file.type);
          expect(file.size).toBeLessThanOrEqual(MAX_FILE_SIZE);
          
          const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => 
            file.name.toLowerCase().endsWith(ext)
          );
          expect(hasValidExtension).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that all files with invalid types are rejected
     * For any file with an invalid MIME type,
     * the validation should return valid: false with appropriate error
     */
    test('should reject all files with invalid types', () => {
      fc.assert(
        fc.property(invalidTypeFileArbitrary(), (file) => {
          const result = validateImageFile(file);
          
          // Invalid type files should fail validation
          expect(result.valid).toBe(false);
          expect(result.error).toBeTruthy();
          expect(result.error).toContain('กรุณาเลือกไฟล์รูปภาพ');
          
          // Verify the file doesn't meet type criteria
          expect(ALLOWED_IMAGE_TYPES).not.toContain(file.type);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that all oversized files are rejected
     * For any file exceeding 5MB,
     * the validation should return valid: false with size error
     */
    test('should reject all oversized files', () => {
      fc.assert(
        fc.property(oversizedImageFileArbitrary(), (file) => {
          const result = validateImageFile(file);
          
          // Oversized files should fail validation
          expect(result.valid).toBe(false);
          expect(result.error).toBeTruthy();
          expect(result.error).toContain('ขนาดไฟล์ต้องไม่เกิน 5MB');
          
          // Verify the file exceeds size limit
          expect(file.size).toBeGreaterThan(MAX_FILE_SIZE);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that files with mismatched extension and MIME type are rejected
     * For any file with valid MIME type but invalid extension,
     * the validation should return valid: false
     */
    test('should reject files with mismatched extension and MIME type', () => {
      fc.assert(
        fc.property(mismatchedFileArbitrary(), (file) => {
          const result = validateImageFile(file);
          
          // Mismatched files should fail validation
          expect(result.valid).toBe(false);
          expect(result.error).toBeTruthy();
          expect(result.error).toContain('กรุณาเลือกไฟล์รูปภาพ');
          
          // Verify the file has invalid extension
          const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => 
            file.name.toLowerCase().endsWith(ext)
          );
          expect(hasValidExtension).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that null/undefined files are rejected
     * For any null or undefined input,
     * the validation should return valid: false with appropriate error
     */
    test('should reject null or undefined files', () => {
      const nullResult = validateImageFile(null);
      expect(nullResult.valid).toBe(false);
      expect(nullResult.error).toContain('กรุณาเลือกไฟล์สลิปการโอนเงิน');

      const undefinedResult = validateImageFile(undefined);
      expect(undefinedResult.valid).toBe(false);
      expect(undefinedResult.error).toContain('กรุณาเลือกไฟล์สลิปการโอนเงิน');
    });

    /**
     * Test boundary conditions for file size
     * Files at exactly MAX_FILE_SIZE should be accepted
     * Files at MAX_FILE_SIZE + 1 should be rejected
     */
    test('should handle file size boundary correctly', () => {
      // File at exactly max size should be valid
      const maxSizeFile = createMockFile('test.jpg', MAX_FILE_SIZE, 'image/jpeg');
      const maxResult = validateImageFile(maxSizeFile);
      expect(maxResult.valid).toBe(true);
      expect(maxResult.error).toBeNull();

      // File at max size + 1 should be invalid
      const overMaxFile = createMockFile('test.jpg', MAX_FILE_SIZE + 1, 'image/jpeg');
      const overResult = validateImageFile(overMaxFile);
      expect(overResult.valid).toBe(false);
      expect(overResult.error).toContain('ขนาดไฟล์ต้องไม่เกิน 5MB');
    });

    /**
     * Test case sensitivity for file extensions
     * Extensions should be case-insensitive
     */
    test('should handle case-insensitive file extensions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('.jpg', '.jpeg', '.png'),
          fc.constantFrom('image/jpeg', 'image/jpg', 'image/png'),
          fc.integer({ min: 1, max: MAX_FILE_SIZE }),
          (extension, mimeType, size) => {
            // Test uppercase extension
            const upperFile = createMockFile(`test${extension.toUpperCase()}`, size, mimeType);
            const upperResult = validateImageFile(upperFile);
            expect(upperResult.valid).toBe(true);

            // Test lowercase extension
            const lowerFile = createMockFile(`test${extension.toLowerCase()}`, size, mimeType);
            const lowerResult = validateImageFile(lowerFile);
            expect(lowerResult.valid).toBe(true);

            // Test mixed case extension
            const mixedExt = extension.split('').map((c, i) => 
              i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()
            ).join('');
            const mixedFile = createMockFile(`test${mixedExt}`, size, mimeType);
            const mixedResult = validateImageFile(mixedFile);
            expect(mixedResult.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that validation is deterministic
     * Running validation multiple times on the same file should yield the same result
     */
    test('should produce consistent results for the same file', () => {
      fc.assert(
        fc.property(validImageFileArbitrary(), (file) => {
          const result1 = validateImageFile(file);
          const result2 = validateImageFile(file);
          const result3 = validateImageFile(file);
          
          // All results should be identical
          expect(result1.valid).toBe(result2.valid);
          expect(result2.valid).toBe(result3.valid);
          expect(result1.error).toBe(result2.error);
          expect(result2.error).toBe(result3.error);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('formatFileSize helper function', () => {
    /**
     * Test that formatFileSize produces human-readable output
     */
    test('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(MAX_FILE_SIZE)).toBe('5 MB');
    });
  });
});
