# Design Document: Auto SKU Generation

## Overview

ระบบสร้าง SKU (Stock Keeping Unit) อัตโนมัติที่ออกแบบมาเพื่อสร้างรหัสสินค้าที่ไม่ซ้ำกันโดยอัตโนมัติ โดยอ้างอิงจากหมวดหมู่สินค้าและเลขลำดับ รูปแบบ SKU จะเป็น `[PREFIX][00001-99999]` เช่น `ELEC00001`, `FASH00123` เป็นต้น

ระบบนี้จะช่วยลดความผิดพลาดจากการป้อนข้อมูลด้วยตนเอง และทำให้การจัดการสินค้ามีความเป็นระเบียบมากขึ้น

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  ProductManagement.js                                        │
│  ├─ SKU Preview Component                                    │
│  ├─ Category Selector with Prefix Display                   │
│  └─ Form Validation                                          │
│                                                              │
│  CategoryManagement.js (New)                                 │
│  ├─ Category CRUD                                            │
│  ├─ Prefix Management                                        │
│  └─ Prefix Validation                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                 │
├─────────────────────────────────────────────────────────────┤
│  SKU Generator Service                                       │
│  ├─ generateSKU(categoryId)                                  │
│  ├─ getNextSequentialNumber(prefix)                          │
│  ├─ validateSKUFormat(sku)                                   │
│  └─ checkSKUUniqueness(sku)                                  │
│                                                              │
│  Product Controller                                          │
│  ├─ createProduct() - with auto SKU                          │
│  └─ updateProduct() - SKU immutable                          │
│                                                              │
│  Category Controller                                         │
│  ├─ createCategory() - with prefix                           │
│  ├─ updateCategory() - prefix validation                     │
│  └─ getCategoriesWithPrefixes()                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (MySQL)                          │
├─────────────────────────────────────────────────────────────┤
│  product_categories                                          │
│  ├─ id (PK)                                                  │
│  ├─ name                                                     │
│  ├─ prefix (UNIQUE, 2-4 chars, uppercase)                   │
│  └─ ...                                                      │
│                                                              │
│  products                                                    │
│  ├─ id (PK)                                                  │
│  ├─ sku (UNIQUE, indexed)                                    │
│  ├─ category_id (FK)                                         │
│  └─ ...                                                      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Product Creation Flow:**
```
1. User selects category → Frontend requests SKU preview
2. Backend generates SKU:
   a. Get category prefix (or "GEN" if none)
   b. Query max sequential number for prefix
   c. Increment and format as 5 digits
   d. Return preview SKU
3. User submits form → Backend validates and saves
4. Database enforces uniqueness constraint
```

## Components and Interfaces

### 1. Database Schema Changes

#### Update `product_categories` Table

```sql
ALTER TABLE product_categories 
ADD COLUMN prefix VARCHAR(4) UNIQUE DEFAULT NULL COMMENT 'Category prefix for SKU generation (2-4 uppercase letters)',
ADD INDEX idx_prefix (prefix);
```

**Constraints:**
- `prefix` must be 2-4 uppercase English letters (A-Z)
- `prefix` must be unique across all categories
- `prefix` can be NULL (category without prefix)

#### Update `products` Table

```sql
-- SKU column already exists as UNIQUE
-- Add index for better performance on SKU lookups
ALTER TABLE products 
MODIFY COLUMN sku VARCHAR(50) UNIQUE NOT NULL COMMENT 'Auto-generated SKU: [PREFIX][00001-99999]';
```

### 2. Backend Services

#### SKU Generator Service (`backend/services/SKUGeneratorService.js`)

```javascript
class SKUGeneratorService {
  /**
   * Generate SKU for a product based on category
   * @param {number|null} categoryId - Category ID or null for default
   * @returns {Promise<string>} Generated SKU
   */
  async generateSKU(categoryId) {
    const prefix = await this.getCategoryPrefix(categoryId);
    const sequentialNumber = await this.getNextSequentialNumber(prefix);
    const sku = `${prefix}${sequentialNumber}`;
    
    // Verify uniqueness
    await this.ensureUniqueness(sku);
    
    return sku;
  }

  /**
   * Get category prefix or default "GEN"
   * @param {number|null} categoryId
   * @returns {Promise<string>} Prefix (2-4 uppercase letters)
   */
  async getCategoryPrefix(categoryId) {
    if (!categoryId) return 'GEN';
    
    const category = await Category.findById(categoryId);
    return category?.prefix || 'GEN';
  }

  /**
   * Get next sequential number for prefix
   * @param {string} prefix
   * @returns {Promise<string>} 5-digit sequential number
   */
  async getNextSequentialNumber(prefix) {
    // Query: SELECT MAX(CAST(SUBSTRING(sku, LENGTH(prefix) + 1) AS UNSIGNED)) 
    //        FROM products WHERE sku LIKE 'PREFIX%'
    const maxNumber = await this.getMaxSequentialNumber(prefix);
    const nextNumber = (maxNumber || 0) + 1;
    
    if (nextNumber > 99999) {
      throw new Error(`Sequential number limit reached for prefix ${prefix}`);
    }
    
    return nextNumber.toString().padStart(5, '0');
  }

  /**
   * Validate SKU format
   * @param {string} sku
   * @returns {boolean}
   */
  validateSKUFormat(sku) {
    const pattern = /^[A-Z]{2,4}\d{5}$/;
    return pattern.test(sku);
  }

  /**
   * Check if SKU already exists
   * @param {string} sku
   * @returns {Promise<boolean>}
   */
  async checkSKUUniqueness(sku) {
    const existing = await Product.findBySku(sku);
    return !existing;
  }

  /**
   * Ensure SKU is unique, retry if duplicate
   * @param {string} sku
   * @returns {Promise<void>}
   */
  async ensureUniqueness(sku) {
    const isUnique = await this.checkSKUUniqueness(sku);
    if (!isUnique) {
      throw new Error(`SKU ${sku} already exists`);
    }
  }
}
```

#### Category Model Updates (`backend/models/ProductCategory.js`)

```javascript
class ProductCategory {
  /**
   * Create category with prefix
   * @param {Object} data - {name, description, prefix, ...}
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const { name, description, prefix, parent_id, status } = data;
    
    // Validate and normalize prefix
    const normalizedPrefix = this.validateAndNormalizePrefix(prefix);
    
    const query = `
      INSERT INTO product_categories (name, description, prefix, parent_id, status)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.pool.execute(query, [
      name,
      description || null,
      normalizedPrefix,
      parent_id || null,
      status || 'active'
    ]);
    
    return this.findById(result.insertId);
  }

  /**
   * Validate and normalize prefix
   * @param {string} prefix
   * @returns {string|null} Normalized prefix or null
   */
  static validateAndNormalizePrefix(prefix) {
    if (!prefix) return null;
    
    const normalized = prefix.trim().toUpperCase();
    
    // Validate format: 2-4 uppercase letters
    if (!/^[A-Z]{2,4}$/.test(normalized)) {
      throw new Error('Prefix must be 2-4 English letters');
    }
    
    return normalized;
  }

  /**
   * Check if prefix is unique
   * @param {string} prefix
   * @param {number|null} excludeId - Category ID to exclude from check
   * @returns {Promise<boolean>}
   */
  static async isPrefixUnique(prefix, excludeId = null) {
    let query = 'SELECT id FROM product_categories WHERE prefix = ?';
    const params = [prefix];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await db.pool.execute(query, params);
    return rows.length === 0;
  }
}
```

### 3. API Endpoints

#### Product Endpoints

```javascript
// POST /api/products/generate-sku
// Generate SKU preview before creating product
{
  "category_id": 5  // or null
}
Response: {
  "success": true,
  "data": {
    "sku": "ELEC00123",
    "prefix": "ELEC",
    "sequential_number": "00123"
  }
}

// POST /api/products
// Create product with auto-generated SKU
{
  "name": "Product Name",
  "category_id": 5,
  // SKU will be auto-generated
  // ... other fields
}
Response: {
  "success": true,
  "data": {
    "product_id": 123,
    "sku": "ELEC00123",
    // ... other fields
  }
}
```

#### Category Endpoints

```javascript
// POST /api/categories
// Create category with prefix
{
  "name": "Electronics",
  "prefix": "ELEC",  // Will be normalized to uppercase
  "description": "Electronic products"
}

// PUT /api/categories/:id
// Update category (prefix change shows warning)
{
  "name": "Electronics & Gadgets",
  "prefix": "ELEC"  // Changing prefix affects only new products
}

// GET /api/categories
// Get all categories with prefixes
Response: {
  "success": true,
  "data": [
    {
      "category_id": 1,
      "name": "Electronics",
      "prefix": "ELEC",
      "product_count": 45
    },
    // ...
  ]
}
```

### 4. Frontend Components

#### SKU Preview Component

```javascript
// Component to show SKU preview when category is selected
const SKUPreview = ({ categoryId, onSKUGenerated }) => {
  const [sku, setSku] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categoryId !== undefined) {
      generateSKUPreview();
    }
  }, [categoryId]);

  const generateSKUPreview = async () => {
    setLoading(true);
    try {
      const response = await api.post('/products/generate-sku', {
        category_id: categoryId || null
      });
      setSku(response.data.data.sku);
      onSKUGenerated(response.data.data.sku);
    } catch (error) {
      console.error('SKU generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sku-preview">
      <label>SKU (สร้างอัตโนมัติ)</label>
      <div className="sku-display">
        {loading ? (
          <span className="loading">กำลังสร้าง SKU...</span>
        ) : (
          <span className="sku-value">{sku || 'เลือกหมวดหมู่เพื่อสร้าง SKU'}</span>
        )}
      </div>
      <p className="sku-hint">
        💡 SKU จะถูกสร้างอัตโนมัติตามหมวดหมู่ที่เลือก
      </p>
    </div>
  );
};
```

#### Category Management Component

```javascript
// New component for managing categories with prefixes
const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    prefix: '',
    description: ''
  });

  const handlePrefixChange = (e) => {
    // Auto-uppercase and validate
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (value.length <= 4) {
      setFormData({ ...formData, prefix: value });
    }
  };

  const validatePrefix = (prefix) => {
    if (!prefix) return 'กรุณาระบุ Prefix';
    if (prefix.length < 2) return 'Prefix ต้องมีอย่างน้อย 2 ตัวอักษร';
    if (prefix.length > 4) return 'Prefix ต้องไม่เกิน 4 ตัวอักษร';
    if (!/^[A-Z]+$/.test(prefix)) return 'Prefix ต้องเป็นตัวอักษรภาษาอังกฤษเท่านั้น';
    return null;
  };

  // ... CRUD operations
};
```

## Data Models

### ProductCategory Model

```javascript
{
  id: number,
  name: string,
  description: string | null,
  prefix: string | null,  // NEW: 2-4 uppercase letters, unique
  parent_id: number | null,
  status: 'active' | 'inactive',
  created_at: timestamp,
  updated_at: timestamp
}
```

### Product Model (SKU field)

```javascript
{
  id: number,
  sku: string,  // AUTO-GENERATED: [PREFIX][00001-99999]
  name: string,
  category_id: number | null,
  // ... other fields
}
```

### SKU Generation Result

```javascript
{
  sku: string,           // "ELEC00123"
  prefix: string,        // "ELEC"
  sequential_number: string,  // "00123"
  category_id: number | null,
  category_name: string | null
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: SKU Format Validity
*For any* generated SKU, it must match the pattern `[A-Z]{2,4}\d{5}` (2-4 uppercase letters followed by exactly 5 digits)

**Validates: Requirements 1.2, 4.1, 4.2, 4.3**

### Property 2: SKU Uniqueness
*For any* two products in the system, their SKU codes must be different

**Validates: Requirements 1.4, 7.1, 7.3**

### Property 3: Prefix Validity
*For any* category prefix, it must be 2-4 uppercase English letters (A-Z) and unique across all categories

**Validates: Requirements 2.2, 2.3, 2.4, 2.6**

### Property 4: Sequential Number Range
*For any* generated sequential number, it must be between 00001 and 99999 (inclusive)

**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

### Property 5: Default Prefix Usage
*For any* product without a category, the system must use "GEN" as the prefix

**Validates: Requirements 1.3, 6.1, 6.2**

### Property 6: Sequential Number Increment
*For any* category prefix, when generating a new SKU, the sequential number must be exactly one more than the highest existing sequential number for that prefix

**Validates: Requirements 3.1, 3.3**

### Property 7: Prefix Immutability for Existing Products
*For any* existing product, changing its category must not change its SKU

**Validates: Requirements 2.5, 6.3**

### Property 8: Category Prefix Independence
*For any* two different category prefixes, their sequential number sequences must be independent

**Validates: Requirements 3.1, 5.3, 6.4**

### Property 9: SKU Generation Idempotence
*For any* category and current state, calling SKU generation multiple times without creating products must return the same SKU

**Validates: Requirements 1.1, 7.2**

### Property 10: Prefix Change Non-Retroactivity
*For any* category with existing products, changing the category prefix must not affect the SKU of existing products

**Validates: Requirements 2.5, 5.4**

## Error Handling

### SKU Generation Errors

```javascript
// Error codes and messages
const SKU_ERRORS = {
  LIMIT_REACHED: {
    code: 'SKU_LIMIT_REACHED',
    message: 'เลขลำดับสำหรับหมวดหมู่นี้ถึงขีดจำกัดแล้ว (99999)',
    suggestion: 'กรุณาสร้างหมวดหมู่ใหม่หรือใช้ Prefix อื่น'
  },
  DUPLICATE_SKU: {
    code: 'DUPLICATE_SKU',
    message: 'SKU นี้มีอยู่ในระบบแล้ว',
    suggestion: 'ระบบจะสร้าง SKU ใหม่โดยอัตโนมัติ'
  },
  INVALID_FORMAT: {
    code: 'INVALID_SKU_FORMAT',
    message: 'รูปแบบ SKU ไม่ถูกต้อง',
    suggestion: 'SKU ต้องเป็น [PREFIX][00001-99999]'
  },
  CATEGORY_NOT_FOUND: {
    code: 'CATEGORY_NOT_FOUND',
    message: 'ไม่พบหมวดหมู่ที่เลือก',
    suggestion: 'กรุณาเลือกหมวดหมู่ที่มีอยู่ในระบบ'
  }
};
```

### Prefix Validation Errors

```javascript
const PREFIX_ERRORS = {
  INVALID_LENGTH: {
    code: 'INVALID_PREFIX_LENGTH',
    message: 'Prefix ต้องมีความยาว 2-4 ตัวอักษร',
    suggestion: 'กรุณาระบุ Prefix ที่มีความยาวถูกต้อง'
  },
  INVALID_CHARACTERS: {
    code: 'INVALID_PREFIX_CHARACTERS',
    message: 'Prefix ต้องเป็นตัวอักษรภาษาอังกฤษเท่านั้น (A-Z)',
    suggestion: 'กรุณาใช้เฉพาะตัวอักษร A-Z'
  },
  DUPLICATE_PREFIX: {
    code: 'DUPLICATE_PREFIX',
    message: 'Prefix นี้ถูกใช้งานแล้ว',
    suggestion: 'กรุณาเลือก Prefix อื่น'
  },
  PREFIX_CHANGE_WARNING: {
    code: 'PREFIX_CHANGE_WARNING',
    message: 'การเปลี่ยน Prefix จะมีผลกับสินค้าใหม่เท่านั้น',
    suggestion: 'สินค้าที่มีอยู่จะยังคงใช้ SKU เดิม'
  }
};
```

### Error Handling Strategy

1. **Validation Errors**: Return immediately with clear message
2. **Duplicate SKU**: Auto-retry with next sequential number (max 3 attempts)
3. **Limit Reached**: Prevent product creation, suggest new category
4. **Database Errors**: Log error, return user-friendly message
5. **Concurrent Creation**: Use database transactions and locks

## Testing Strategy

### Unit Tests

**SKU Generator Service:**
- Test SKU generation with valid category
- Test SKU generation without category (default "GEN")
- Test sequential number increment
- Test format validation
- Test uniqueness check
- Test limit reached scenario
- Test prefix normalization

**Category Model:**
- Test prefix validation (length, characters)
- Test prefix uniqueness check
- Test prefix normalization (lowercase → uppercase)
- Test category creation with/without prefix

**Product Controller:**
- Test product creation with auto SKU
- Test SKU immutability on update
- Test error handling for invalid category

### Property-Based Tests

Each property test should run minimum 100 iterations and reference the design document property.

**Test 1: SKU Format Validity**
```javascript
// Feature: auto-sku-generation, Property 1: SKU Format Validity
test('generated SKU always matches format [A-Z]{2,4}\\d{5}', async () => {
  // Generate random category IDs (including null)
  // For each: generate SKU and verify format
  // Assert: all SKUs match /^[A-Z]{2,4}\d{5}$/
});
```

**Test 2: SKU Uniqueness**
```javascript
// Feature: auto-sku-generation, Property 2: SKU Uniqueness
test('all generated SKUs are unique', async () => {
  // Generate multiple SKUs for same and different categories
  // Assert: no duplicates in generated SKUs
  // Assert: database constraint prevents duplicates
});
```

**Test 3: Prefix Validity**
```javascript
// Feature: auto-sku-generation, Property 3: Prefix Validity
test('category prefixes are valid and unique', async () => {
  // Generate random prefix strings
  // Attempt to create categories
  // Assert: only valid prefixes (2-4 A-Z) are accepted
  // Assert: duplicate prefixes are rejected
});
```

**Test 4: Sequential Number Range**
```javascript
// Feature: auto-sku-generation, Property 4: Sequential Number Range
test('sequential numbers are within valid range', async () => {
  // Generate SKUs for various prefixes
  // Extract sequential numbers
  // Assert: all numbers are 00001-99999
  // Assert: numbers are zero-padded to 5 digits
});
```

**Test 5: Default Prefix Usage**
```javascript
// Feature: auto-sku-generation, Property 5: Default Prefix Usage
test('products without category use GEN prefix', async () => {
  // Create products with category_id = null
  // Assert: all SKUs start with "GEN"
});
```

**Test 6: Sequential Number Increment**
```javascript
// Feature: auto-sku-generation, Property 6: Sequential Number Increment
test('sequential numbers increment correctly', async () => {
  // Create multiple products in same category
  // Extract sequential numbers
  // Assert: each number is previous + 1
});
```

**Test 7: Prefix Immutability**
```javascript
// Feature: auto-sku-generation, Property 7: Prefix Immutability
test('changing product category does not change SKU', async () => {
  // Create product with category A
  // Record original SKU
  // Update product to category B
  // Assert: SKU remains unchanged
});
```

**Test 8: Category Prefix Independence**
```javascript
// Feature: auto-sku-generation, Property 8: Category Prefix Independence
test('different prefixes have independent sequences', async () => {
  // Create products in multiple categories
  // Assert: sequential numbers are independent per prefix
  // Example: ELEC00001, FASH00001 can coexist
});
```

### Integration Tests

- Test complete product creation flow with SKU generation
- Test category management with prefix validation
- Test concurrent product creation (race conditions)
- Test database constraints enforcement
- Test API endpoints for SKU generation and validation

### Manual Testing Scenarios

1. Create product with category → Verify SKU format
2. Create product without category → Verify "GEN" prefix
3. Create multiple products in same category → Verify sequential increment
4. Change category prefix → Verify existing products unchanged
5. Attempt duplicate prefix → Verify rejection
6. Create 99999 products in one category → Verify limit error
7. Test SKU preview in UI → Verify real-time generation

