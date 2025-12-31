const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getPoolStats } = require('../config/database');
const { getCacheStats } = require('../middleware/cache');

/**
 * @route   GET /api/monitoring/health
 * @desc    Get system health status
 * @access  Private (Admin only)
 */
router.get('/health', authenticate, authorize(['admin']), (req, res) => {
  try {
    const poolStats = getPoolStats();
    const cacheStats = getCacheStats();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.floor(uptime),
          formatted: formatUptime(uptime)
        },
        database: {
          totalConnections: poolStats.totalConnections,
          freeConnections: poolStats.freeConnections,
          queuedRequests: poolStats.queuedRequests,
          utilizationPercent: Math.round(
            ((poolStats.totalConnections - poolStats.freeConnections) / poolStats.totalConnections) * 100
          )
        },
        cache: {
          entries: cacheStats.size,
          sampleKeys: cacheStats.keys.slice(0, 5)
        },
        memory: {
          rss: formatBytes(memoryUsage.rss),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsed: formatBytes(memoryUsage.heapUsed),
          external: formatBytes(memoryUsage.external),
          heapUsagePercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        },
        process: {
          pid: process.pid,
          nodeVersion: process.version,
          platform: process.platform
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'MONITORING_ERROR',
        message: 'Failed to retrieve system health',
        details: error.message
      }
    });
  }
});

/**
 * @route   GET /api/monitoring/performance
 * @desc    Get performance metrics
 * @access  Private (Admin only)
 */
router.get('/performance', authenticate, authorize(['admin']), (req, res) => {
  try {
    const cpuUsage = process.cpuUsage();
    const resourceUsage = process.resourceUsage();

    res.json({
      success: true,
      data: {
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        resources: {
          userCPUTime: resourceUsage.userCPUTime,
          systemCPUTime: resourceUsage.systemCPUTime,
          maxRSS: formatBytes(resourceUsage.maxRSS * 1024),
          sharedMemorySize: formatBytes(resourceUsage.sharedMemorySize * 1024),
          unsharedDataSize: formatBytes(resourceUsage.unsharedDataSize * 1024),
          unsharedStackSize: formatBytes(resourceUsage.unsharedStackSize * 1024)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PERFORMANCE_ERROR',
        message: 'Failed to retrieve performance metrics',
        details: error.message
      }
    });
  }
});

// Helper functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

module.exports = router;
