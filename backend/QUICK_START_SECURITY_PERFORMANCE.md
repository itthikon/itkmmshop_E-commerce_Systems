# Quick Start: Security & Performance Features

## Quick Reference Guide

This guide provides quick access to the security and performance features implemented in the itkmmshop backend.

## Security Features

### Rate Limiting

**Usage in Routes:**
```javascript
const { authLimiter, paymentLimiter } = require('../middleware/security');

// Apply to specific routes
router.post('/login', authLimiter, controller.login);
router.post('/payment', paymentLimiter, controller.processPayment);
```

**Default Limits:**
- General API: 100 requests / 15 min
- Authentication: 5 attempts / 15 min
- Payment: 10 attempts / hour

### Logging

**Usage:**
```javascript
const logger = require('../config/logger');

logger.info('User logged in', { userId: user.id });
logger.warn('Suspicious activity detected', { ip: req.ip });
logger.error('Payment failed', { error: err.message });
logger.debug('Debug information', { data: someData });
```

**Log Levels:**
- `error` - Critical errors
- `warn` - Warnings
- `info` - General information
- `debug` - Debug details

### Input Validation

**Already Applied Globally:**
- XSS protection
- NoSQL injection prevention
- Input sanitization

**Additional Validation:**
```javascript
const Joi = require('joi');

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const { error, value } = schema.validate(req.body);
```

## Performance Features

### Caching

**Usage in Routes:**
```javascript
const { cacheMiddleware, CACHE_DURATION } = require('../middleware/cache');

// Cache for 15 minutes
router.get('/products', cacheMiddleware(CACHE_DURATION.medium), controller.getProducts);

// Cache for 1 hour
router.get('/categories', cacheMiddleware(CACHE_DURATION.long), controller.getCategories);
```

**Cache Durations:**
- `CACHE_DURATION.short` - 5 minutes
- `CACHE_DURATION.medium` - 15 minutes
- `CACHE_DURATION.long` - 1 hour
- `CACHE_DURATION.veryLong` - 24 hours

**Clear Cache:**
```javascript
const { clearCache, clearAllCache } = require('../middleware/cache');

// Clear specific cache
clearCache('GET:/api/products:guest');

// Clear by pattern
clearCache(/^GET:\/api\/products/);

// Clear all cache
clearAllCache();
```

### Query Optimization

**Usage:**
```javascript
const { 
  buildPagination, 
  buildSearchClause,
  executeTimedQuery 
} = require('../utils/queryOptimizer');

// Pagination
const { offset, limit, page } = buildPagination(req.query.page, req.query.limit);

// Search
const { clause, params } = buildSearchClause(searchTerm, ['name', 'description']);

// Execute with timing
const rows = await executeTimedQuery(pool, query, params);
```

### Image Handling

**Usage:**
```javascript
const { 
  validateImage, 
  generateOptimizedFilename,
  deleteImage 
} = require('../utils/imageOptimizer');

// Validate uploaded file
validateImage(req.file);

// Generate filename
const filename = generateOptimizedFilename(req.file.originalname, productId);

// Delete old image
await deleteImage(oldImagePath);
```

## Monitoring

### Health Check

**Endpoint:** `GET /api/monitoring/health`

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": { "seconds": 3600, "formatted": "1h" },
    "database": {
      "totalConnections": 10,
      "freeConnections": 8,
      "utilizationPercent": 20
    },
    "cache": { "entries": 45 },
    "memory": {
      "heapUsed": "45.2 MB",
      "heapUsagePercent": 35
    }
  }
}
```

### Performance Metrics

**Endpoint:** `GET /api/monitoring/performance`

**Access:** Admin only

## Environment Variables

### Required

```bash
# Security
JWT_SECRET=your_very_long_secret_key_minimum_32_characters
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=itkmmshop
DB_CONNECTION_LIMIT=10

# Logging
LOG_LEVEL=info
```

### Optional

```bash
# Rate Limiting (defaults shown)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
PAYMENT_RATE_LIMIT_MAX=10
```

## Common Tasks

### Add Rate Limiting to Route

```javascript
// 1. Import limiter
const { apiLimiter } = require('../middleware/security');

// 2. Apply to route
router.post('/endpoint', apiLimiter, controller.method);
```

### Add Caching to Route

```javascript
// 1. Import cache middleware
const { cacheMiddleware, CACHE_DURATION } = require('../middleware/cache');

// 2. Apply to GET route
router.get('/endpoint', cacheMiddleware(CACHE_DURATION.medium), controller.method);
```

### Log Important Events

```javascript
// 1. Import logger
const logger = require('../config/logger');

// 2. Log events
logger.info('Event description', { contextData });
```

### Optimize Database Query

```javascript
// 1. Import utilities
const { buildPagination, executeTimedQuery } = require('../utils/queryOptimizer');

// 2. Build pagination
const { offset, limit } = buildPagination(page, pageSize);

// 3. Execute query with timing
const query = 'SELECT * FROM table LIMIT ? OFFSET ?';
const rows = await executeTimedQuery(pool, query, [limit, offset]);
```

## Troubleshooting

### Rate Limit Errors

**Error:** `429 Too Many Requests`

**Solution:**
- Wait for rate limit window to expire
- Adjust rate limits in environment variables
- Check if legitimate traffic is being blocked

### Cache Issues

**Problem:** Stale data being served

**Solution:**
```javascript
// Clear specific cache
const { clearCache } = require('../middleware/cache');
clearCache(/pattern/);

// Or clear all cache
const { clearAllCache } = require('../middleware/cache');
clearAllCache();
```

### High Memory Usage

**Check:**
```bash
curl http://localhost:5000/api/monitoring/health
```

**Solution:**
- Clear cache if too large
- Reduce cache duration
- Consider Redis for external caching

### Slow Queries

**Check:** Review `logs/combined.log` for slow query warnings

**Solution:**
- Add database indexes
- Optimize query structure
- Implement caching

### Connection Pool Exhausted

**Check:** Monitor database connections in health endpoint

**Solution:**
- Increase `DB_CONNECTION_LIMIT`
- Optimize query execution time
- Check for connection leaks

## Best Practices

### Security

1. ✅ Always validate user input
2. ✅ Use rate limiting on sensitive endpoints
3. ✅ Log security events
4. ✅ Use HTTPS in production
5. ✅ Keep dependencies updated

### Performance

1. ✅ Cache frequently accessed data
2. ✅ Use pagination for large datasets
3. ✅ Optimize database queries
4. ✅ Monitor slow queries
5. ✅ Use connection pooling

### Logging

1. ✅ Log important events
2. ✅ Include context in logs
3. ✅ Use appropriate log levels
4. ✅ Don't log sensitive data
5. ✅ Review logs regularly

## Testing

### Test Rate Limiting

```bash
# Send multiple requests quickly
for i in {1..10}; do
  curl http://localhost:5000/api/auth/login \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### Test Caching

```bash
# First request (cache miss)
curl -i http://localhost:5000/api/products

# Second request (cache hit)
curl -i http://localhost:5000/api/products

# Check X-Cache header
```

### Test Monitoring

```bash
# Health check
curl http://localhost:5000/api/monitoring/health \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Performance metrics
curl http://localhost:5000/api/monitoring/performance \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Additional Resources

- **Full Security Guide:** See `SECURITY.md`
- **Performance Guide:** See `PERFORMANCE_OPTIMIZATION.md`
- **Implementation Details:** See `TASK_15_IMPLEMENTATION_SUMMARY.md`

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review monitoring endpoints
3. Consult full documentation
4. Check environment variables

## Quick Commands

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode
npm run dev

# Run tests
npm test

# Check logs
tail -f logs/combined.log
tail -f logs/error.log

# Clear logs
rm logs/*.log
```

---

**Last Updated:** December 2024
**Version:** 1.0.0
