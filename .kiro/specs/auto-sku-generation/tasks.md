# Implementation Plan: Auto SKU Generation

## Overview

แผนการพัฒนาระบบสร้าง SKU อัตโนมัติ แบ่งเป็น 6 ขั้นตอนหลัก เริ่มจากการเตรียมฐานข้อมูล, พัฒนา Backend Services, สร้าง API Endpoints, พัฒนา Frontend Components, เขียน Tests และทดสอบระบบทั้งหมด

## Tasks

- [x] 1. Database Schema Migration
  - [x] 1.1 Create migration script to add prefix column to product_categories table
    - Create `backend/migrations/add-category-prefix.js`
    - Add `prefix VARCHAR(4) UNIQUE` column with index
    - Set default value to NULL for existing categories
    - _Requirements: 2.2, 2.3, 2.6_
  
  - [x] 1.2 Update database schema documentation
    - Update `backend/config/schema.sql` with new column definition
    - Add comments explaining prefix usage
    - _Requirements: 2.1_
  
  - [x] 1.3 Run migration and verify database changes
    - Execute migration script
    - Verify column exists with correct constraints
    - Test unique constraint on prefix
    - _Requirements: 2.6_

- [x] 2. Backend - SKU Generator Service
  - [x] 2.1 Create SKU Generator Service base structure
    - Create `backend/services/SKUGeneratorService.js`
    - Implement class structure with core methods
    - Add error definitions and constants
    - _Requirements: 1.1, 1.2_
  
  - [x] 2.2 Implement generateSKU method
    - Get category prefix or default "GEN"
    - Get next sequential number
    - Format SKU as [PREFIX][00001-99999]
    - Verify uniqueness
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 2.3 Implement getCategoryPrefix method
    - Query category by ID
    - Return prefix or "GEN" if null/not found
    - Handle null category_id
    - _Requirements: 1.3, 6.1_
  
  - [x] 2.4 Implement getNextSequentialNumber method
    - Query max sequential number for prefix using SQL
    - Increment by 1
    - Pad with leading zeros to 5 digits
    - Handle limit reached (99999)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 2.5 Implement validateSKUFormat method
    - Validate pattern: /^[A-Z]{2,4}\d{5}$/
    - Return boolean result
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 2.6 Implement checkSKUUniqueness method
    - Query products table for existing SKU
    - Return boolean result
    - _Requirements: 7.1, 7.3_
  
  - [ ]* 2.7 Write unit tests for SKU Generator Service
    - Test generateSKU with various categories
    - Test default prefix usage
    - Test sequential number increment
    - Test format validation
    - Test uniqueness check
    - Test limit reached scenario
    - _Requirements: 1.1, 1.2, 1.3, 3.5, 4.1, 7.1_

- [x] 3. Backend - Category Model Updates
  - [x] 3.1 Update ProductCategory model with prefix support
    - Update `backend/models/ProductCategory.js`
    - Add prefix field to create/update methods
    - Implement validateAndNormalizePrefix method
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 3.2 Implement prefix validation logic
    - Validate length (2-4 characters)
    - Validate characters (A-Z only)
    - Convert to uppercase
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [x] 3.3 Implement isPrefixUnique method
    - Query for duplicate prefixes
    - Exclude current category ID when updating
    - _Requirements: 2.6_
  
  - [ ]* 3.4 Write unit tests for Category model
    - Test prefix validation (valid/invalid cases)
    - Test prefix normalization (lowercase → uppercase)
    - Test prefix uniqueness check
    - Test category creation with prefix
    - _Requirements: 2.2, 2.3, 2.4, 2.6_

- [x] 4. Backend - API Endpoints
  - [x] 4.1 Create SKU generation endpoint
    - Add POST `/api/products/generate-sku` route
    - Accept category_id in request body
    - Call SKU Generator Service
    - Return generated SKU with metadata
    - _Requirements: 1.1, 8.2_
  
  - [x] 4.2 Update product creation endpoint
    - Modify POST `/api/products` in productController
    - Auto-generate SKU if not provided
    - Remove manual SKU input requirement
    - Validate generated SKU before saving
    - _Requirements: 1.1, 1.4, 7.3_
  
  - [x] 4.3 Update product update endpoint
    - Ensure SKU is immutable (cannot be changed)
    - Return error if SKU modification attempted
    - _Requirements: 6.3_
  
  - [x] 4.4 Update category endpoints
    - Modify POST `/api/categories` to accept prefix
    - Modify PUT `/api/categories/:id` to validate prefix changes
    - Add prefix to GET `/api/categories` response
    - _Requirements: 2.1, 5.1, 5.2, 9.2_
  
  - [x] 4.5 Add error handling for all endpoints
    - Handle SKU generation errors
    - Handle prefix validation errors
    - Return appropriate HTTP status codes
    - Provide clear error messages
    - _Requirements: 10.1, 10.2, 10.4, 10.5_
  
  - [ ]* 4.6 Write integration tests for API endpoints
    - Test SKU generation endpoint
    - Test product creation with auto SKU
    - Test SKU immutability on update
    - Test category CRUD with prefix
    - Test error responses
    - _Requirements: 1.1, 2.1, 6.3, 10.1_

- [x] 5. Frontend - SKU Preview Component
  - [x] 5.1 Create SKU Preview component
    - Create `frontend/src/components/product/SKUPreview.js`
    - Display auto-generated SKU
    - Show loading state during generation
    - Make field read-only
    - _Requirements: 1.5, 8.1, 8.4_
  
  - [x] 5.2 Implement SKU generation on category change
    - Call `/api/products/generate-sku` when category selected
    - Update SKU preview in real-time
    - Handle null category (show GEN prefix)
    - _Requirements: 8.2, 8.3_
  
  - [x] 5.3 Add SKU Preview styling
    - Create `frontend/src/components/product/SKUPreview.css`
    - Style read-only field
    - Add loading indicator
    - Add helpful hint text
    - _Requirements: 8.1, 8.4_
  
  - [ ]* 5.4 Write component tests for SKU Preview
    - Test SKU display
    - Test loading state
    - Test category change trigger
    - Test read-only behavior
    - _Requirements: 8.1, 8.2, 8.4_

- [x] 6. Frontend - Product Management Updates
  - [x] 6.1 Integrate SKU Preview into ProductManagement
    - Update `frontend/src/pages/admin/ProductManagement.js`
    - Replace manual SKU input with SKU Preview component
    - Remove SKU from form data (auto-generated)
    - Pass category_id to SKU Preview
    - _Requirements: 1.5, 8.1, 8.2_
  
  - [x] 6.2 Update product form submission
    - Remove SKU from form data sent to API
    - Handle SKU in response after creation
    - Display success message with generated SKU
    - _Requirements: 1.1, 8.5_
  
  - [x] 6.3 Update product edit form
    - Display existing SKU as read-only
    - Prevent SKU modification
    - Show warning if category changed (SKU stays same)
    - _Requirements: 6.3, 8.4_
  
  - [x] 6.4 Add error handling for SKU generation
    - Display error messages from API
    - Handle limit reached scenario
    - Show user-friendly suggestions
    - _Requirements: 10.1, 10.2, 10.4_

- [x] 7. Frontend - Category Management
  - [x] 7.1 Create Category Management page
    - Create `frontend/src/pages/admin/CategoryManagement.js`
    - Implement category list view
    - Show prefix alongside category name
    - Add create/edit/delete functionality
    - _Requirements: 5.1, 5.2, 9.1, 9.2_
  
  - [x] 7.2 Implement prefix input field
    - Add prefix input to category form
    - Auto-uppercase input
    - Validate format in real-time (2-4 letters, A-Z only)
    - Show validation errors
    - _Requirements: 2.2, 2.3, 2.4, 10.2_
  
  - [x] 7.3 Add prefix change warning
    - Detect when existing category prefix is changed
    - Show warning about non-retroactive effect
    - Require confirmation before saving
    - _Requirements: 2.5, 9.3_
  
  - [x] 7.4 Display prefix in category selector
    - Update category dropdown in product form
    - Show format: "Category Name (PREFIX)"
    - Handle categories without prefix
    - _Requirements: 9.4_
  
  - [x] 7.5 Add Category Management styling
    - Create `frontend/src/pages/admin/CategoryManagement.css`
    - Style category list and forms
    - Style prefix input field
    - Add visual indicators for validation
    - _Requirements: 9.1, 9.5_
  
  - [ ]* 7.6 Write component tests for Category Management
    - Test category CRUD operations
    - Test prefix validation
    - Test prefix change warning
    - Test category display with prefix
    - _Requirements: 2.2, 2.5, 9.1, 9.3_

- [x] 8. Property-Based Tests
  - [x]* 8.1 Write property test for SKU format validity
    - **Property 1: SKU Format Validity**
    - Generate random category IDs
    - Verify all SKUs match /^[A-Z]{2,4}\d{5}$/
    - Run 100+ iterations
    - **Validates: Requirements 1.2, 4.1, 4.2, 4.3**
  
  - [x]* 8.2 Write property test for SKU uniqueness
    - **Property 2: SKU Uniqueness**
    - Generate multiple SKUs for same/different categories
    - Verify no duplicates
    - Test database constraint
    - Run 100+ iterations
    - **Validates: Requirements 1.4, 7.1, 7.3**
  
  - [x]* 8.3 Write property test for prefix validity
    - **Property 3: Prefix Validity**
    - Generate random prefix strings
    - Verify only valid prefixes accepted (2-4 A-Z)
    - Verify duplicate prefixes rejected
    - Run 100+ iterations
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.6**
  
  - [x]* 8.4 Write property test for sequential number range
    - **Property 4: Sequential Number Range**
    - Generate SKUs for various prefixes
    - Verify all numbers are 00001-99999
    - Verify zero-padding to 5 digits
    - Run 100+ iterations
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**
  
  - [x]* 8.5 Write property test for default prefix usage
    - **Property 5: Default Prefix Usage**
    - Create products with category_id = null
    - Verify all SKUs start with "GEN"
    - Run 100+ iterations
    - **Validates: Requirements 1.3, 6.1, 6.2**
  
  - [x]* 8.6 Write property test for sequential increment
    - **Property 6: Sequential Number Increment**
    - Create multiple products in same category
    - Verify each number is previous + 1
    - Run 100+ iterations
    - **Validates: Requirements 3.1, 3.3**
  
  - [x]* 8.7 Write property test for prefix immutability
    - **Property 7: Prefix Immutability**
    - Create product with category A
    - Update to category B
    - Verify SKU unchanged
    - Run 100+ iterations
    - **Validates: Requirements 2.5, 6.3**
  
  - [x]* 8.8 Write property test for prefix independence
    - **Property 8: Category Prefix Independence**
    - Create products in multiple categories
    - Verify sequential numbers independent per prefix
    - Run 100+ iterations
    - **Validates: Requirements 3.1, 5.3, 6.4**

- [x] 9. Integration and Testing
  - [x] 9.1 Test complete product creation flow
    - Create product with category
    - Verify SKU generated correctly
    - Verify SKU saved to database
    - Verify SKU displayed in UI
    - _Requirements: 1.1, 1.4, 8.5_
  
  - [x] 9.2 Test category management flow
    - Create category with prefix
    - Verify prefix validation
    - Update category prefix
    - Verify warning displayed
    - _Requirements: 2.1, 2.6, 5.1, 9.3_
  
  - [x] 9.3 Test edge cases
    - Create product without category (GEN prefix)
    - Create 99999 products in one category (limit)
    - Attempt duplicate prefix
    - Change product category (SKU unchanged)
    - _Requirements: 1.3, 3.5, 2.6, 6.3_
  
  - [x] 9.4 Test concurrent product creation
    - Create multiple products simultaneously
    - Verify no duplicate SKUs
    - Verify sequential numbers correct
    - _Requirements: 1.4, 7.1, 7.2_
  
  - [x] 9.5 Perform manual UI testing
    - Test SKU preview updates
    - Test category management UI
    - Test error messages display
    - Test all user workflows
    - _Requirements: 8.1, 8.2, 9.1, 10.1_

- [x] 10. Documentation and Cleanup
  - [x] 10.1 Update API documentation
    - Document new `/api/products/generate-sku` endpoint
    - Update product creation endpoint docs
    - Update category endpoint docs
    - Add example requests/responses
    - _Requirements: 1.1, 2.1_
  
  - [x] 10.2 Create user guide
    - Document how to use auto SKU generation
    - Document how to manage category prefixes
    - Add screenshots and examples
    - Include troubleshooting section
    - _Requirements: 8.1, 9.1, 10.1_
  
  - [x] 10.3 Update database seed data
    - Add prefixes to existing categories
    - Ensure sample data has valid SKUs
    - Update `backend/sample-data.sql`
    - _Requirements: 2.1, 5.2_
  
  - [x] 10.4 Code review and refactoring
    - Review all new code
    - Ensure consistent error handling
    - Optimize database queries
    - Add code comments
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests ensure all components work together
- Manual testing validates user experience

## Checkpoints

- **Checkpoint 1** (After Task 3): Database and backend services complete
  - Verify SKU generation works via direct service calls
  - Ensure all tests pass
  
- **Checkpoint 2** (After Task 6): Frontend integration complete
  - Verify SKU preview works in UI
  - Test product creation end-to-end
  
- **Checkpoint 3** (After Task 9): All testing complete
  - Verify all property tests pass
  - Verify all integration tests pass
  - Ready for deployment

