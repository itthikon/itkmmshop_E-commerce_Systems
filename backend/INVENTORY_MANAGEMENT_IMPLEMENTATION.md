# Inventory Management Implementation

## Overview
This document describes the inventory management system implemented for the itkmmshop e-commerce platform.

## Features Implemented

### 1. Stock Tracking
- **Automatic stock updates** via `Product.updateStock()` method
- **Transaction-based updates** ensuring data consistency
- **Stock status management** (active, inactive, out_of_stock)
- **Automatic status updates** when stock reaches zero

### 2. Stock History Logging
- **Complete audit trail** of all stock movements
- **Detailed tracking** including:
  - Quantity changes (positive for additions, negative for reductions)
  - Before and after quantities
  - Change type (purchase, sale, adjustment, return, damage, initial)
  - Reference information (order ID, adjustment ID, etc.)
  - User who made the change
  - Timestamp of change
  - Optional notes

### 3. Low Stock Alerts
- **Configurable thresholds** per product
- **Automatic detection** of products below threshold
- **API endpoint** for retrieving low stock products
- **Excludes inactive products** from alerts

## Database Schema

### Products Table
```sql
- stock_quantity: INT DEFAULT 0
- low_stock_threshold: INT DEFAULT 10
- status: ENUM('active', 'inactive', 'out_of_stock')
```

### Stock History Table
```sql
CREATE TABLE stock_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    quantity_change INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    change_type ENUM('purchase', 'sale', 'adjustment', 'return', 'damage', 'initial'),
    reference_id INT,
    reference_type VARCHAR(50),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

## API Endpoints

### Stock Management
- `POST /api/products/:id/stock` - Update product stock
  - Requires authentication (Admin/Staff)
  - Body: `{ quantity, change_type, notes }`
  - Returns updated product with new stock level

### Low Stock Alerts
- `GET /api/products/alerts/low-stock` - Get products with low stock
  - Requires authentication (Admin/Staff)
  - Returns array of products where stock_quantity <= low_stock_threshold

### Stock History
- `GET /api/products/:id/stock-history` - Get stock history for a product
  - Requires authentication (Admin/Staff)
  - Query params: `change_type`, `limit`, `offset`
  - Returns array of stock history entries

## Models

### Product Model
- `updateStock(id, quantity, options)` - Update stock with history tracking
- `getLowStockProducts()` - Get products below threshold

### StockHistory Model
- `create(historyData)` - Create stock history entry
- `findById(id)` - Find history entry by ID
- `findByProduct(productId, options)` - Get history for a product
- `findAll(options)` - Get all stock history with filtering

## Usage Examples

### Update Stock
```javascript
// Add stock (purchase)
await Product.updateStock(productId, 50, {
  change_type: 'purchase',
  notes: 'Received shipment #12345',
  created_by: userId
});

// Reduce stock (sale)
await Product.updateStock(productId, -10, {
  change_type: 'sale',
  reference_id: orderId,
  reference_type: 'order',
  created_by: userId
});

// Adjust stock
await Product.updateStock(productId, -5, {
  change_type: 'damage',
  notes: 'Damaged during inspection',
  created_by: userId
});
```

### Get Low Stock Products
```javascript
const lowStockProducts = await Product.getLowStockProducts();
// Returns products where stock_quantity <= low_stock_threshold
```

### Get Stock History
```javascript
// Get all history for a product
const history = await StockHistory.findByProduct(productId);

// Get only sales
const salesHistory = await StockHistory.findByProduct(productId, {
  change_type: 'sale',
  limit: 20
});
```

## Testing

Comprehensive tests have been implemented in `tests/inventoryManagement.test.js`:

- ✅ Stock tracking and updates
- ✅ Stock reduction and out-of-stock status
- ✅ Low stock alerts
- ✅ Stock history logging
- ✅ History filtering by change type
- ✅ Transaction consistency

All tests pass successfully.

## Future Enhancements

The following features can be added in future iterations:

1. **Automatic stock deduction** when orders are placed (will be implemented in task 7.1)
2. **Stock reservation** for pending orders
3. **Batch stock updates** for multiple products
4. **Stock transfer** between locations (if multi-warehouse support is added)
5. **Stock forecasting** based on sales trends
6. **Email/SMS notifications** for low stock alerts
7. **Stock reports** (turnover, aging, etc.)

## Requirements Validation

This implementation satisfies **Requirement 11.5**:
- ✅ Stock tracking with automatic updates
- ✅ Low stock alerts
- ✅ Stock history logging

## Notes

- Stock updates are wrapped in database transactions to ensure consistency
- The system automatically sets product status to 'out_of_stock' when quantity reaches zero
- Stock history provides a complete audit trail for inventory management
- All stock-related operations require authentication (Admin or Staff roles)
