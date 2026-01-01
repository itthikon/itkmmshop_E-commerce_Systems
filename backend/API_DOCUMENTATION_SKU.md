# Auto SKU Generation API Documentation

## Overview

This document describes the API endpoints for the Auto SKU Generation feature. The system automatically generates unique SKU codes for products based on their category prefix and sequential numbering.

## Table of Contents

- [SKU Generation Endpoints](#sku-generation-endpoints)
- [Product Endpoints](#product-endpoints)
- [Category Endpoints](#category-endpoints)
- [Error Codes](#error-codes)

---

## SKU Generation Endpoints

### Generate SKU Preview

Generate a preview SKU before creating a product.

**Endpoint:** `POST /api/products/generate-sku`

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "category_id": 5
}
```

**Parameters:**
- `category_id` (number, optional): The category ID. If null or omitted, uses default "GEN" prefix.

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sku": "ELEC00123",
    "prefix": "ELEC",
    "sequential_number": "00123",
    "category_id": 5,
    "category_name": "Electronics"
  }
}
```

**Error Responses:**

*Sequential Limit Reached (400 Bad Request):*
```json
{
  "success": false,
  "error": {
    "code": "SKU_LIMIT_REACHED",
    "message": "เลขลำดับสำหรับหมวดหมู่นี้ถึงขีดจำกัดแล้ว (99999)",
    "suggestion": "กรุณาสร้างหมวดหมู่ใหม่หรือใช้ Prefix อื่น"
  }
}
```

*Category Not Found (404 Not Found):*
```json
{
  "success": false,
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "ไม่พบหมวดหมู่ที่เลือก",
    "suggestion": "กรุณาเลือกหมวดหมู่ที่มีอยู่ในระบบ"
  }
}
```

**Example Usage:**
```javascript
// Generate SKU for Electronics category
const response = await fetch('/api/products/generate-sku', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({ category_id: 5 })
});

const data = await response.json();
console.log(data.data.sku); // "ELEC00123"
```

---

## Product Endpoints

### Create Product (with Auto SKU)

Create a new product with automatically generated SKU.

**Endpoint:** `POST /api/products`

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse with USB receiver",
  "category_id": 5,
  "price": 599.00,
  "cost": 350.00,
  "stock_quantity": 100,
  "reorder_level": 20,
  "status": "active"
}
```

**Note:** SKU is automatically generated and should NOT be included in the request body.

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "product_id": 123,
    "sku": "ELEC00123",
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse with USB receiver",
    "category_id": 5,
    "category_name": "Electronics",
    "price": 599.00,
    "cost": 350.00,
    "stock_quantity": 100,
    "reorder_level": 20,
    "status": "active",
    "created_at": "2026-01-01T10:30:00.000Z"
  }
}
```

**Error Responses:**

*Invalid Category (400 Bad Request):*
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CATEGORY",
    "message": "หมวดหมู่ที่เลือกไม่ถูกต้อง"
  }
}
```

*SKU Generation Failed (500 Internal Server Error):*
```json
{
  "success": false,
  "error": {
    "code": "SKU_GENERATION_FAILED",
    "message": "ไม่สามารถสร้าง SKU ได้",
    "suggestion": "กรุณาลองใหม่อีกครั้ง"
  }
}
```

### Update Product

Update an existing product. SKU is immutable and cannot be changed.

**Endpoint:** `PUT /api/products/:id`

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "name": "Wireless Mouse Pro",
  "description": "Updated description",
  "category_id": 6,
  "price": 699.00,
  "stock_quantity": 150
}
```

**Note:** 
- SKU field is ignored if included in request
- Changing category_id does NOT change the SKU
- Original SKU remains unchanged

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "product_id": 123,
    "sku": "ELEC00123",
    "name": "Wireless Mouse Pro",
    "category_id": 6,
    "category_name": "Computer Accessories",
    "price": 699.00,
    "updated_at": "2026-01-01T11:00:00.000Z"
  }
}
```

**Error Response (if SKU modification attempted):**
```json
{
  "success": false,
  "error": {
    "code": "SKU_IMMUTABLE",
    "message": "ไม่สามารถแก้ไข SKU ได้",
    "suggestion": "SKU ถูกสร้างอัตโนมัติและไม่สามารถเปลี่ยนแปลงได้"
  }
}
```

---

## Category Endpoints

### Create Category (with Prefix)

Create a new product category with optional prefix for SKU generation.

**Endpoint:** `POST /api/categories`

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "name": "Electronics",
  "description": "Electronic products and accessories",
  "prefix": "ELEC",
  "status": "active"
}
```

**Parameters:**
- `name` (string, required): Category name
- `description` (string, optional): Category description
- `prefix` (string, optional): 2-4 uppercase letters (A-Z). Will be auto-uppercased.
- `status` (string, optional): "active" or "inactive" (default: "active")

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "category_id": 5,
    "name": "Electronics",
    "description": "Electronic products and accessories",
    "prefix": "ELEC",
    "status": "active",
    "created_at": "2026-01-01T09:00:00.000Z"
  }
}
```

**Error Responses:**

*Invalid Prefix Length (400 Bad Request):*
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PREFIX_LENGTH",
    "message": "Prefix ต้องมีความยาว 2-4 ตัวอักษร",
    "suggestion": "กรุณาระบุ Prefix ที่มีความยาวถูกต้อง"
  }
}
```

*Invalid Prefix Characters (400 Bad Request):*
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PREFIX_CHARACTERS",
    "message": "Prefix ต้องเป็นตัวอักษรภาษาอังกฤษเท่านั้น (A-Z)",
    "suggestion": "กรุณาใช้เฉพาะตัวอักษร A-Z"
  }
}
```

*Duplicate Prefix (409 Conflict):*
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_PREFIX",
    "message": "Prefix นี้ถูกใช้งานแล้ว",
    "suggestion": "กรุณาเลือก Prefix อื่น"
  }
}
```

### Update Category

Update an existing category. Changing prefix affects only new products.

**Endpoint:** `PUT /api/categories/:id`

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "name": "Electronics & Gadgets",
  "description": "Updated description",
  "prefix": "ELEC"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "category_id": 5,
    "name": "Electronics & Gadgets",
    "description": "Updated description",
    "prefix": "ELEC",
    "updated_at": "2026-01-01T10:00:00.000Z"
  },
  "warning": {
    "code": "PREFIX_CHANGE_WARNING",
    "message": "การเปลี่ยน Prefix จะมีผลกับสินค้าใหม่เท่านั้น",
    "suggestion": "สินค้าที่มีอยู่จะยังคงใช้ SKU เดิม"
  }
}
```

### Get All Categories

Retrieve all categories with their prefixes.

**Endpoint:** `GET /api/categories`

**Authentication:** Optional (Public endpoint)

**Query Parameters:**
- `status` (string, optional): Filter by status ("active" or "inactive")
- `include_product_count` (boolean, optional): Include product count per category

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "category_id": 1,
      "name": "Electronics",
      "description": "Electronic products",
      "prefix": "ELEC",
      "status": "active",
      "product_count": 45,
      "created_at": "2026-01-01T08:00:00.000Z"
    },
    {
      "category_id": 2,
      "name": "Fashion",
      "description": "Clothing and accessories",
      "prefix": "FASH",
      "status": "active",
      "product_count": 120,
      "created_at": "2026-01-01T08:15:00.000Z"
    },
    {
      "category_id": 3,
      "name": "Uncategorized",
      "description": "Products without specific category",
      "prefix": null,
      "status": "active",
      "product_count": 5,
      "created_at": "2026-01-01T08:30:00.000Z"
    }
  ]
}
```

### Get Category by ID

Retrieve a specific category with its prefix.

**Endpoint:** `GET /api/categories/:id`

**Authentication:** Optional (Public endpoint)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "category_id": 5,
    "name": "Electronics",
    "description": "Electronic products and accessories",
    "prefix": "ELEC",
    "status": "active",
    "product_count": 45,
    "created_at": "2026-01-01T09:00:00.000Z",
    "updated_at": "2026-01-01T10:00:00.000Z"
  }
}
```

---

## Error Codes

### SKU Generation Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `SKU_LIMIT_REACHED` | 400 | Sequential number reached 99999 limit |
| `DUPLICATE_SKU` | 409 | SKU already exists in database |
| `INVALID_SKU_FORMAT` | 400 | SKU format doesn't match pattern |
| `CATEGORY_NOT_FOUND` | 404 | Category ID not found |
| `SKU_GENERATION_FAILED` | 500 | Unexpected error during generation |
| `SKU_IMMUTABLE` | 400 | Attempted to modify existing SKU |

### Prefix Validation Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_PREFIX_LENGTH` | 400 | Prefix not 2-4 characters |
| `INVALID_PREFIX_CHARACTERS` | 400 | Prefix contains non-letter characters |
| `DUPLICATE_PREFIX` | 409 | Prefix already used by another category |
| `PREFIX_CHANGE_WARNING` | 200 | Warning when changing existing prefix |

### General Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## SKU Format Specification

### Format Pattern
```
[PREFIX][SEQUENTIAL_NUMBER]
```

### Components

**Prefix:**
- Length: 2-4 characters
- Characters: Uppercase English letters (A-Z)
- Examples: `EL`, `ELEC`, `FASH`, `GEN`
- Default: `GEN` (for products without category)

**Sequential Number:**
- Length: Exactly 5 digits
- Range: 00001 to 99999
- Format: Zero-padded
- Examples: `00001`, `00123`, `12345`, `99999`

### Valid SKU Examples
- `ELEC00001` - First electronics product
- `FASH00123` - 123rd fashion product
- `GEN00001` - First uncategorized product
- `COMP12345` - 12,345th computer product

### Invalid SKU Examples
- `E00001` - Prefix too short (1 character)
- `ELECTRONICS00001` - Prefix too long (>4 characters)
- `ELEC123` - Sequential number not 5 digits
- `elec00001` - Prefix not uppercase
- `ELEC-00001` - Contains invalid character

---

## Best Practices

### 1. Category Prefix Selection
- Use meaningful abbreviations (e.g., `ELEC` for Electronics)
- Keep prefixes short but recognizable
- Avoid similar-looking prefixes (e.g., `ELEC` and `ELCT`)
- Document prefix meanings for team reference

### 2. SKU Generation
- Always use the preview endpoint before creating products
- Handle limit reached errors gracefully
- Don't attempt to manually set SKU values
- Let the system handle uniqueness

### 3. Category Management
- Plan prefixes before creating categories
- Avoid changing prefixes after products exist
- Use descriptive category names
- Monitor product counts per category

### 4. Error Handling
- Always check response status codes
- Display user-friendly error messages
- Log errors for debugging
- Implement retry logic for transient failures

---

## Migration Guide

### Adding Prefixes to Existing Categories

If you have existing categories without prefixes:

1. **Identify Categories:**
```sql
SELECT id, name, prefix FROM product_categories WHERE prefix IS NULL;
```

2. **Assign Prefixes:**
```javascript
// Use the API to update categories
await fetch('/api/categories/5', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prefix: 'ELEC' })
});
```

3. **Verify Uniqueness:**
```sql
SELECT prefix, COUNT(*) as count 
FROM product_categories 
WHERE prefix IS NOT NULL 
GROUP BY prefix 
HAVING count > 1;
```

### Handling Existing Products

Existing products keep their original SKUs. New products in the same category will use the new prefix:

- Old product: `OLDSKU123` (unchanged)
- New product: `ELEC00001` (uses new prefix)

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production:

- SKU generation: 100 requests per minute per user
- Product creation: 50 requests per minute per user
- Category management: 20 requests per minute per user

---

## Changelog

### Version 1.0.0 (2026-01-01)
- Initial release
- Auto SKU generation based on category prefix
- Category prefix management
- SKU format validation
- Uniqueness enforcement
- Default "GEN" prefix for uncategorized products

---

## Support

For issues or questions:
- Check the troubleshooting section in the user guide
- Review error codes and messages
- Contact system administrator
- Submit bug reports with full error details
