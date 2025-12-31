const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection pool configuration with optimized settings
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'itkmmshop',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Performance optimizations
  multipleStatements: false, // Security: prevent SQL injection via multiple statements
  dateStrings: false,
  supportBigNumbers: true,
  bigNumberStrings: false,
  // Connection timeout settings (connectTimeout is the only valid timeout option)
  connectTimeout: 10000, // 10 seconds
  // Character set
  charset: 'utf8mb4'
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
};

// Get pool statistics
const getPoolStats = () => {
  return {
    totalConnections: pool.pool._allConnections.length,
    freeConnections: pool.pool._freeConnections.length,
    queuedRequests: pool.pool._connectionQueue.length
  };
};

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end();
    console.log('✓ Database pool closed');
  } catch (error) {
    console.error('✗ Error closing database pool:', error.message);
  }
};

module.exports = {
  pool,
  testConnection,
  getPoolStats,
  closePool
};
