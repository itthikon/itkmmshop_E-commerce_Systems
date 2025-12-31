# Performance Optimization Guide

## Overview

This document describes the performance optimizations implemented in the itkmmshop e-commerce backend system.

## Database Optimizations

### Connection Pooling

The application uses MySQL connection pooling with the following configuration:

```javascript
{
  connectionLimit: 10,           // Maximum number of connections
  waitForConnections: true,      // Queue requests when pool is full
  queueLimit: 0,                 // No limit on queue size
  enableKeepAlive: true,         // Keep connections alive
  connectTimeout: 10000,         // 10 second connection timeout
  acquireTimeout: 10000,         // 10 second acquire timeout
  timeout: 60000                 // 60 second query timeout
}
```

**Benefits:**
- Reuses database connections instead of creating new ones
- Reduces connection overhead
- Handles concurrent requests efficiently
- Prevents connection exhaustion

### Database Indexes

The schema includes optimized indexes on frequently queried columns:

**Users Table:**
- `idx_email` - Fast user lookup by email
- `idx_role` - Filter users by role
- `idx_status` - Filter active/inactive users

**Products Table:**
- `idx_sku` - Fast product lookup by SKU
- `idx_category_id` - Filter products by category
- `idx_status` - Filter active products
- `idx_stock_quantity` - Low stock alerts

**Orders Table:**
- `idx_order_number` - Fast order lookup
- `idx_user_id` - User order history
- `idx_status` - Filter orders by status
- `idx_payment_status` - Payment tracking
- `idx_created_at` - Date-based queries
- `idx_guest_lookup` - Guest order tracking

**Cart Items:**
- `unique_cart_product` - Prevent duplicate items
- `idx_cart_id` - Fast cart item lookup
- `idx_product_id` - Product reference

### Query Optimization Utilities

Located in `utils/queryOptimizer.js`:

- **Pagination:** Efficient offset-based pagination
- **Search:** Optimized LIKE queries with proper indexing
- **Filtering:** Dynamic WHERE clause building
- **Batch Operations:** Bulk insert optimization
- **Slow Query Logging:** Automatic detection of queries > 1 second

## API Response Caching

### In-Memory Cache

Implemented in `middleware/cache.js` with configurable durations:

```javascript
CACHE_DURATION = {
  short: 5 minutes,
  medium: 15 minutes,
  long: 1 hour,
  veryLong: 24 hours
}
```

### Cached Endpoints

**Product Routes:**
- `GET /api/products` - 15 minutes (medium)
- `GET /api/products/:id` - 15 minutes (medium)

**Category Routes:**
- `GET /api/categories` - 1 hour (long)
- `GET /api/categories/:id` - 1 hour (long)

**Cache Headers:**
- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response generated fresh
- `X-Cache-Age` - Age of cached response in seconds

### Cache Invalidation

Cache is automatically cleaned up:
- Expired entries removed every 30 minutes
- Entries older than 1 hour are purged
- Manual cache clearing available via `clearCache()` function

## Image Optimization

### Image Handling

Located in `utils/imageOptimizer.js`:

**Validation:**
- Allowed formats: JPEG, PNG, WebP
- Maximum file size: 5MB
- Automatic file type checking

**File Management:**
- Optimized filename generation
- Automatic directory creation
- Old file cleanup (30+ days)
- Safe file deletion

**Future Enhancements:**
Consider adding the `sharp` library for:
- Image resizing
- Format conversion
- Thumbnail generation
- Quality optimization

## Security Optimizations

### Rate Limiting

Multiple rate limiters for different endpoints:

**General API:**
- 100 requests per 15 minutes per IP

**Authentication:**
- 5 attempts per 15 minutes per IP
- Prevents brute force attacks

**Payment:**
- 10 attempts per hour per IP
- Prevents payment abuse

### Request Processing

- **Compression:** Gzip compression for responses
- **Body Parsing:** Limited to 10MB
- **Input Sanitization:** XSS and NoSQL injection prevention
- **Security Headers:** Helmet.js for HTTP security headers

## Monitoring

### Health Check Endpoint

`GET /api/monitoring/health` (Admin only)

Returns:
- System uptime
- Database connection pool statistics
- Cache statistics
- Memory usage
- Process information

### Performance Metrics

`GET /api/monitoring/performance` (Admin only)

Returns:
- CPU usage
- Resource utilization
- Memory statistics

## Logging

### Winston Logger

Configured in `config/logger.js`:

**Log Levels:**
- `error` - Error conditions
- `warn` - Warning conditions
- `info` - Informational messages
- `debug` - Debug messages

**Log Files:**
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs
- Console output in development

**Log Rotation:**
- Maximum file size: 5MB
- Keep last 5 files
- Automatic rotation

### Request Logging

All HTTP requests are logged with:
- Method and URL
- IP address
- User agent
- Response status code
- Request duration

## Best Practices

### Database Queries

1. **Use Prepared Statements:** Prevent SQL injection
2. **Limit Result Sets:** Always use pagination
3. **Select Specific Columns:** Avoid `SELECT *`
4. **Use Indexes:** Ensure queries use appropriate indexes
5. **Monitor Slow Queries:** Review logs for optimization opportunities

### Caching Strategy

1. **Cache Static Data:** Categories, product lists
2. **Short TTL for Dynamic Data:** Cart, orders
3. **Invalidate on Updates:** Clear cache when data changes
4. **Cache at Multiple Levels:** Database, API, CDN

### API Design

1. **Pagination:** Always paginate large result sets
2. **Filtering:** Allow clients to request only needed data
3. **Compression:** Enable gzip for responses
4. **ETags:** Consider implementing for conditional requests

### Image Handling

1. **Validate Uploads:** Check file type and size
2. **Optimize Storage:** Use CDN for production
3. **Lazy Loading:** Load images on demand
4. **Responsive Images:** Serve appropriate sizes

## Performance Metrics

### Target Metrics

- **API Response Time:** < 200ms (p95)
- **Database Query Time:** < 100ms (p95)
- **Cache Hit Rate:** > 70%
- **Memory Usage:** < 512MB
- **CPU Usage:** < 50% average

### Monitoring Tools

Consider implementing:
- APM (Application Performance Monitoring)
- Database query profiling
- Real-time alerting
- Performance dashboards

## Environment Variables

Add to `.env`:

```bash
# Database
DB_CONNECTION_LIMIT=10

# Logging
LOG_LEVEL=info

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
PAYMENT_RATE_LIMIT_MAX=10
```

## Future Optimizations

1. **Redis Cache:** Replace in-memory cache with Redis
2. **CDN Integration:** Serve static assets from CDN
3. **Database Replication:** Read replicas for scaling
4. **Load Balancing:** Multiple server instances
5. **Query Optimization:** Analyze and optimize slow queries
6. **Image Processing:** Implement sharp for image optimization
7. **API Gateway:** Rate limiting and caching at gateway level
8. **Microservices:** Split into smaller services if needed

## Troubleshooting

### High Memory Usage

1. Check cache size: `GET /api/monitoring/health`
2. Clear cache if needed
3. Reduce cache duration
4. Implement Redis for external caching

### Slow Queries

1. Review `logs/combined.log` for slow query warnings
2. Check database indexes
3. Optimize query structure
4. Consider query result caching

### High CPU Usage

1. Check for inefficient loops
2. Review concurrent request handling
3. Optimize business logic
4. Consider horizontal scaling

### Connection Pool Exhaustion

1. Increase `DB_CONNECTION_LIMIT`
2. Optimize query execution time
3. Ensure connections are properly released
4. Check for connection leaks

## Conclusion

These optimizations provide a solid foundation for a performant e-commerce system. Regular monitoring and profiling will help identify additional optimization opportunities as the system scales.
