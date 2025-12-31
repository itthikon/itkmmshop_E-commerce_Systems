const Product = require('../models/Product');
const StockHistory = require('../models/StockHistory');
const db = require('../config/database');

describe('Inventory Management', () => {
  let testCategoryId;

  beforeAll(async () => {
    // Create a test category for inventory tests
    const [result] = await db.pool.execute(
      'INSERT INTO product_categories (name, description) VALUES (?, ?)',
      ['Test Inventory Category', 'Category for inventory management tests']
    );
    testCategoryId = result.insertId;
  });

  afterAll(async () => {
    // Clean up test products and their dependencies
    await db.pool.execute('DELETE FROM stock_history WHERE product_id IN (SELECT id FROM products WHERE category_id = ?)', [testCategoryId]);
    await db.pool.execute('DELETE FROM products WHERE category_id = ?', [testCategoryId]);
    await db.pool.execute('DELETE FROM product_categories WHERE id = ?', [testCategoryId]);
    await db.pool.end();
  });

  afterEach(async () => {
    // Clean up products after each test to avoid duplicate SKU errors
    await db.pool.execute('DELETE FROM stock_history WHERE product_id IN (SELECT id FROM products WHERE category_id = ?)', [testCategoryId]);
    await db.pool.execute('DELETE FROM products WHERE category_id = ?', [testCategoryId]);
  });

  describe('Stock Tracking', () => {
    test('should update stock quantity and create history entry', async () => {
      // Create a product
      const product = await Product.create({
        sku: 'TEST-STOCK-001',
        name: 'Test Product for Stock',
        category_id: testCategoryId,
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 50,
        low_stock_threshold: 10
      });

      // Update stock (add 20 units)
      const updatedProduct = await Product.updateStock(product.id, 20, {
        change_type: 'purchase',
        notes: 'Test purchase'
      });

      // Verify stock was updated
      expect(updatedProduct.stock_quantity).toBe(70);

      // Verify history entry was created
      const history = await StockHistory.findByProduct(product.id);
      expect(history.length).toBe(1);
      expect(history[0].quantity_change).toBe(20);
      expect(history[0].quantity_before).toBe(50);
      expect(history[0].quantity_after).toBe(70);
      expect(history[0].change_type).toBe('purchase');
    });

    test('should handle stock reduction', async () => {
      const product = await Product.create({
        sku: 'TEST-STOCK-002',
        name: 'Test Product for Reduction',
        category_id: testCategoryId,
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 50,
        low_stock_threshold: 10
      });

      // Reduce stock (remove 30 units)
      const updatedProduct = await Product.updateStock(product.id, -30, {
        change_type: 'sale',
        notes: 'Test sale'
      });

      expect(updatedProduct.stock_quantity).toBe(20);

      const history = await StockHistory.findByProduct(product.id);
      expect(history[0].quantity_change).toBe(-30);
      expect(history[0].quantity_before).toBe(50);
      expect(history[0].quantity_after).toBe(20);
    });

    test('should set status to out_of_stock when quantity reaches zero', async () => {
      const product = await Product.create({
        sku: 'TEST-STOCK-003',
        name: 'Test Product for Out of Stock',
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 10,
        low_stock_threshold: 5
      });

      // Reduce stock to zero
      const updatedProduct = await Product.updateStock(product.id, -10, {
        change_type: 'sale',
        notes: 'Sold out'
      });

      expect(updatedProduct.stock_quantity).toBe(0);
      expect(updatedProduct.status).toBe('out_of_stock');
    });
  });

  describe('Low Stock Alerts', () => {
    test('should identify products with low stock', async () => {
      // Create products with different stock levels
      await Product.create({
        sku: 'TEST-LOW-001',
        name: 'Low Stock Product 1',
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 5,
        low_stock_threshold: 10,
        status: 'active'
      });

      await Product.create({
        sku: 'TEST-LOW-002',
        name: 'Low Stock Product 2',
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 8,
        low_stock_threshold: 10,
        status: 'active'
      });

      await Product.create({
        sku: 'TEST-NORMAL-001',
        name: 'Normal Stock Product',
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 50,
        low_stock_threshold: 10,
        status: 'active'
      });

      // Get low stock products
      const lowStockProducts = await Product.getLowStockProducts();

      // Should return only products with stock <= threshold
      expect(lowStockProducts.length).toBeGreaterThanOrEqual(2);
      
      const lowStockSkus = lowStockProducts.map(p => p.sku);
      expect(lowStockSkus).toContain('TEST-LOW-001');
      expect(lowStockSkus).toContain('TEST-LOW-002');
      expect(lowStockSkus).not.toContain('TEST-NORMAL-001');
    });

    test('should not include inactive products in low stock alerts', async () => {
      await Product.create({
        sku: 'TEST-INACTIVE-LOW',
        name: 'Inactive Low Stock Product',
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 2,
        low_stock_threshold: 10,
        status: 'inactive'
      });

      const lowStockProducts = await Product.getLowStockProducts();
      const inactiveLowStock = lowStockProducts.find(p => p.sku === 'TEST-INACTIVE-LOW');
      
      expect(inactiveLowStock).toBeUndefined();
    });
  });

  describe('Stock History Logging', () => {
    test('should track multiple stock changes', async () => {
      const product = await Product.create({
        sku: 'TEST-HISTORY-001',
        name: 'Test Product for History',
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 100,
        low_stock_threshold: 10
      });

      // Multiple stock changes
      await Product.updateStock(product.id, 50, {
        change_type: 'purchase',
        notes: 'Purchase 1'
      });

      await Product.updateStock(product.id, -30, {
        change_type: 'sale',
        notes: 'Sale 1'
      });

      await Product.updateStock(product.id, -20, {
        change_type: 'sale',
        notes: 'Sale 2'
      });

      // Get history
      const history = await StockHistory.findByProduct(product.id);

      expect(history.length).toBe(3);
      
      // Verify all operations are recorded
      const purchaseHistory = history.find(h => h.change_type === 'purchase');
      const sale1History = history.find(h => h.notes === 'Sale 1');
      const sale2History = history.find(h => h.notes === 'Sale 2');
      
      expect(purchaseHistory).toBeDefined();
      expect(purchaseHistory.quantity_change).toBe(50);
      
      expect(sale1History).toBeDefined();
      expect(sale1History.quantity_change).toBe(-30);
      
      expect(sale2History).toBeDefined();
      expect(sale2History.quantity_change).toBe(-20);
    });

    test('should filter history by change type', async () => {
      const product = await Product.create({
        sku: 'TEST-HISTORY-002',
        name: 'Test Product for Filtered History',
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 100,
        low_stock_threshold: 10
      });

      await Product.updateStock(product.id, 50, { change_type: 'purchase' });
      await Product.updateStock(product.id, -10, { change_type: 'sale' });
      await Product.updateStock(product.id, -5, { change_type: 'damage' });
      await Product.updateStock(product.id, 10, { change_type: 'return' });

      // Get only sales
      const salesHistory = await StockHistory.findByProduct(product.id, {
        change_type: 'sale'
      });

      expect(salesHistory.length).toBe(1);
      expect(salesHistory[0].change_type).toBe('sale');
      expect(salesHistory[0].quantity_change).toBe(-10);
    });
  });

  describe('Stock Consistency', () => {
    test('should maintain transaction consistency on errors', async () => {
      const product = await Product.create({
        sku: 'TEST-CONSISTENCY-001',
        name: 'Test Product for Consistency',
        price_excluding_vat: 100.00,
        vat_rate: 7.00,
        stock_quantity: 50,
        low_stock_threshold: 10
      });

      const initialStock = product.stock_quantity;

      // Try to update with invalid product ID (should fail)
      await expect(
        Product.updateStock(999999, 10, { change_type: 'adjustment' })
      ).rejects.toThrow();

      // Verify original product stock unchanged
      const unchangedProduct = await Product.findById(product.id);
      expect(unchangedProduct.stock_quantity).toBe(initialStock);
    });
  });
});
