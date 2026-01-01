# Requirements Document: Auto SKU Generation

## Introduction

ระบบสร้าง SKU (Stock Keeping Unit) อัตโนมัติสำหรับสินค้าใหม่ โดยอ้างอิงจากหมวดหมู่สินค้าและเลขลำดับที่ไม่ซ้ำกัน เพื่อให้การจัดการสินค้ามีความเป็นระเบียบและสามารถระบุสินค้าได้อย่างชัดเจน

## Glossary

- **SKU (Stock Keeping Unit)**: รหัสสินค้าที่ใช้ในการระบุและติดตามสินค้าแต่ละรายการ
- **Category_Prefix**: รหัสตัวอักษรภาษาอังกฤษที่แทนหมวดหมู่สินค้า (2-4 ตัวอักษร)
- **Sequential_Number**: เลขลำดับ 5 หลักที่เรียงตามลำดับภายในแต่ละหมวดหมู่
- **Product_Management_System**: ระบบจัดการสินค้าในหน้า Admin
- **Category_Management**: ระบบจัดการหมวดหมู่สินค้า

## Requirements

### Requirement 1: Auto-Generate SKU Based on Category

**User Story:** As an admin, I want the system to automatically generate SKU codes when I add a new product, so that I don't have to manually create unique codes.

#### Acceptance Criteria

1. WHEN an admin creates a new product THEN THE System SHALL automatically generate a unique SKU code
2. WHEN generating SKU THEN THE System SHALL use the category prefix followed by a 5-digit sequential number
3. WHEN a product has no category assigned THEN THE System SHALL use a default prefix "GEN" (General)
4. THE System SHALL ensure that generated SKU codes are unique across all products
5. WHEN displaying the product form THEN THE System SHALL show the auto-generated SKU in a read-only field

### Requirement 2: Category Prefix Management

**User Story:** As an admin, I want to define English letter prefixes for each product category, so that SKU codes clearly indicate the product category.

#### Acceptance Criteria

1. WHEN creating or editing a category THEN THE System SHALL allow admin to specify a category prefix
2. THE System SHALL validate that category prefix contains only English letters (A-Z, a-z)
3. THE System SHALL validate that category prefix length is between 2 and 4 characters
4. THE System SHALL convert category prefix to uppercase for consistency
5. WHEN a category prefix is changed THEN THE System SHALL apply the new prefix only to newly created products
6. THE System SHALL ensure that category prefixes are unique across all categories

### Requirement 3: Sequential Number Generation

**User Story:** As a system, I want to generate sequential 5-digit numbers for each category, so that SKU codes are organized and non-duplicating.

#### Acceptance Criteria

1. WHEN generating SKU for a category THEN THE System SHALL find the highest sequential number for that category prefix
2. WHEN no products exist for a category THEN THE System SHALL start the sequence at 00001
3. WHEN products exist for a category THEN THE System SHALL increment the highest number by 1
4. THE System SHALL pad the sequential number with leading zeros to ensure 5 digits
5. WHEN the sequential number reaches 99999 THEN THE System SHALL prevent creating new products and display an error message

### Requirement 4: SKU Format Validation

**User Story:** As a system, I want to validate SKU format, so that all SKU codes follow the correct pattern.

#### Acceptance Criteria

1. THE System SHALL validate that SKU format matches the pattern: [PREFIX][5-DIGIT-NUMBER]
2. WHEN validating SKU THEN THE System SHALL ensure prefix is 2-4 uppercase English letters
3. WHEN validating SKU THEN THE System SHALL ensure sequential number is exactly 5 digits
4. WHEN manual SKU entry is attempted THEN THE System SHALL validate against the format rules
5. THE System SHALL display clear error messages for invalid SKU formats

### Requirement 5: Category Addition and Prefix Assignment

**User Story:** As an admin, I want to add new product categories with their prefixes at any time, so that I can organize products as the business grows.

#### Acceptance Criteria

1. WHEN adding a new category THEN THE System SHALL require a category prefix to be specified
2. WHEN a new category is added THEN THE System SHALL immediately be available for product creation
3. WHEN creating products with a new category THEN THE System SHALL start sequential numbering from 00001
4. THE System SHALL allow adding categories without disrupting existing SKU sequences
5. WHEN displaying category list THEN THE System SHALL show the prefix alongside the category name

### Requirement 6: Default Category Handling

**User Story:** As an admin, I want products without a category to still receive valid SKU codes, so that I can create products before categorizing them.

#### Acceptance Criteria

1. WHEN a product is created without a category THEN THE System SHALL use the default prefix "GEN"
2. WHEN using default prefix THEN THE System SHALL maintain a separate sequential number sequence
3. WHEN a product's category is later assigned THEN THE System SHALL keep the original SKU unchanged
4. THE System SHALL track sequential numbers for the default prefix independently

### Requirement 7: SKU Uniqueness Enforcement

**User Story:** As a system, I want to prevent duplicate SKU codes, so that each product has a unique identifier.

#### Acceptance Criteria

1. WHEN generating SKU THEN THE System SHALL check for existing SKU codes in the database
2. WHEN a duplicate SKU is detected THEN THE System SHALL increment the sequential number and retry
3. THE System SHALL perform uniqueness check before saving the product
4. WHEN manual SKU entry creates a duplicate THEN THE System SHALL reject the entry with an error message
5. THE System SHALL use database constraints to enforce SKU uniqueness

### Requirement 8: User Interface for SKU Generation

**User Story:** As an admin, I want to see the auto-generated SKU when creating a product, so that I know what code will be assigned.

#### Acceptance Criteria

1. WHEN opening the add product form THEN THE System SHALL display an empty SKU field
2. WHEN selecting a category THEN THE System SHALL immediately generate and display the SKU preview
3. WHEN changing category THEN THE System SHALL update the SKU preview accordingly
4. THE System SHALL display the SKU field as read-only to prevent manual editing
5. WHEN the product is saved THEN THE System SHALL use the displayed SKU code

### Requirement 9: Category Prefix Display

**User Story:** As an admin, I want to see category prefixes in the category management interface, so that I can easily identify and manage them.

#### Acceptance Criteria

1. WHEN viewing the category list THEN THE System SHALL display the prefix for each category
2. WHEN editing a category THEN THE System SHALL show the current prefix in an editable field
3. THE System SHALL display a warning when changing an existing category prefix
4. WHEN displaying categories in product form THEN THE System SHALL show format: "Category Name (PREFIX)"
5. THE System SHALL provide a clear indication of which categories have prefixes assigned

### Requirement 10: Error Handling and Validation Messages

**User Story:** As an admin, I want to receive clear error messages when SKU generation fails, so that I can take appropriate action.

#### Acceptance Criteria

1. WHEN SKU generation fails THEN THE System SHALL display a specific error message explaining the issue
2. WHEN category prefix is invalid THEN THE System SHALL show validation errors in real-time
3. WHEN sequential number limit is reached THEN THE System SHALL suggest creating a new category
4. THE System SHALL prevent form submission when SKU generation errors occur
5. WHEN database errors occur THEN THE System SHALL log the error and display a user-friendly message

