const logger = require('../config/logger');

/**
 * Database query optimization utilities
 */

/**
 * Build optimized pagination query
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} - { offset, limit }
 */
const buildPagination = (page = 1, limit = 20) => {
  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (parsedPage - 1) * parsedLimit;
  
  return {
    offset,
    limit: parsedLimit,
    page: parsedPage
  };
};

/**
 * Build WHERE clause for search
 * @param {string} searchTerm - Search term
 * @param {Array<string>} fields - Fields to search in
 * @returns {Object} - { clause, params }
 */
const buildSearchClause = (searchTerm, fields) => {
  if (!searchTerm || !fields || fields.length === 0) {
    return { clause: '', params: [] };
  }

  const conditions = fields.map(field => `${field} LIKE ?`).join(' OR ');
  const params = fields.map(() => `%${searchTerm}%`);
  
  return {
    clause: `(${conditions})`,
    params
  };
};

/**
 * Build ORDER BY clause
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order (asc/desc)
 * @param {Array<string>} allowedFields - Allowed fields for sorting
 * @returns {string}
 */
const buildOrderClause = (sortBy, sortOrder = 'ASC', allowedFields = []) => {
  const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  
  // Validate sortBy field
  if (sortBy && allowedFields.includes(sortBy)) {
    return `ORDER BY ${sortBy} ${order}`;
  }
  
  // Default sorting
  return 'ORDER BY created_at DESC';
};

/**
 * Build filter conditions
 * @param {Object} filters - Filter object
 * @param {Object} fieldMap - Map of filter keys to database fields
 * @returns {Object} - { conditions, params }
 */
const buildFilterConditions = (filters, fieldMap) => {
  const conditions = [];
  const params = [];
  
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '' && fieldMap[key]) {
      const field = fieldMap[key];
      
      if (Array.isArray(value)) {
        // IN clause for arrays
        const placeholders = value.map(() => '?').join(',');
        conditions.push(`${field} IN (${placeholders})`);
        params.push(...value);
      } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
        // Range filter
        conditions.push(`${field} BETWEEN ? AND ?`);
        params.push(value.min, value.max);
      } else {
        // Exact match
        conditions.push(`${field} = ?`);
        params.push(value);
      }
    }
  }
  
  return {
    conditions: conditions.length > 0 ? conditions.join(' AND ') : '',
    params
  };
};

/**
 * Log slow queries
 * @param {string} query - SQL query
 * @param {number} duration - Query duration in ms
 * @param {number} threshold - Slow query threshold in ms
 */
const logSlowQuery = (query, duration, threshold = 1000) => {
  if (duration > threshold) {
    logger.warn('Slow query detected', {
      query: query.substring(0, 200),
      duration: `${duration}ms`,
      threshold: `${threshold}ms`
    });
  }
};

/**
 * Execute query with timing
 * @param {Object} pool - Database pool
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>}
 */
const executeTimedQuery = async (pool, query, params = []) => {
  const startTime = Date.now();
  
  try {
    const [rows] = await pool.execute(query, params);
    const duration = Date.now() - startTime;
    
    logSlowQuery(query, duration);
    
    return rows;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Query execution failed', {
      query: query.substring(0, 200),
      duration: `${duration}ms`,
      error: error.message
    });
    throw error;
  }
};

/**
 * Build batch insert query
 * @param {string} table - Table name
 * @param {Array<Object>} records - Array of records to insert
 * @param {Array<string>} fields - Fields to insert
 * @returns {Object} - { query, params }
 */
const buildBatchInsert = (table, records, fields) => {
  if (!records || records.length === 0) {
    return { query: '', params: [] };
  }

  const placeholders = records.map(() => 
    `(${fields.map(() => '?').join(', ')})`
  ).join(', ');
  
  const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES ${placeholders}`;
  
  const params = records.flatMap(record => 
    fields.map(field => record[field])
  );
  
  return { query, params };
};

/**
 * Calculate total pages
 * @param {number} totalCount - Total number of records
 * @param {number} limit - Items per page
 * @returns {number}
 */
const calculateTotalPages = (totalCount, limit) => {
  return Math.ceil(totalCount / limit);
};

/**
 * Build pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} totalCount - Total number of records
 * @returns {Object}
 */
const buildPaginationMeta = (page, limit, totalCount) => {
  const totalPages = calculateTotalPages(totalCount, limit);
  
  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems: totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
};

module.exports = {
  buildPagination,
  buildSearchClause,
  buildOrderClause,
  buildFilterConditions,
  logSlowQuery,
  executeTimedQuery,
  buildBatchInsert,
  calculateTotalPages,
  buildPaginationMeta
};
