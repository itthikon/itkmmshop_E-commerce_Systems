const AccountingSettings = require('../models/AccountingSettings');

/**
 * Settings Controller
 * Handles accounting system settings management
 */

/**
 * Get all settings
 * GET /api/accounting/settings
 */
const getSettings = async (req, res) => {
  try {
    const settings = await AccountingSettings.getAll();

    // Transform to more user-friendly format
    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.setting_key] = {
        value: setting.setting_value,
        updated_by: setting.updated_by_email,
        updated_at: setting.updated_at
      };
    });

    res.json({
      success: true,
      data: settingsObject
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า'
      }
    });
  }
};

/**
 * Update a setting
 * PUT /api/accounting/settings/:key
 */
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'กรุณาระบุค่าที่ต้องการตั้ง'
        }
      });
    }

    // Validate specific settings
    if (key === 'opening_balance') {
      const balance = parseFloat(value);
      if (isNaN(balance)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ยอดเงินเริ่มต้นต้องเป็นตัวเลข'
          }
        });
      }
    }

    if (key === 'fiscal_year_start') {
      // Validate date format (MM-DD)
      const datePattern = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
      if (!datePattern.test(value)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น MM-DD)'
          }
        });
      }
    }

    if (key === 'default_income_categories' || key === 'default_expense_categories') {
      try {
        // If value is string, try to parse it
        const categories = typeof value === 'string' ? JSON.parse(value) : value;
        
        if (!Array.isArray(categories)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'หมวดหมู่ต้องเป็น array'
            }
          });
        }

        // Store as JSON string
        const setting = await AccountingSettings.set(
          key, 
          JSON.stringify(categories), 
          userId
        );

        return res.json({
          success: true,
          data: setting,
          message: 'อัปเดตการตั้งค่าสำเร็จ'
        });
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'รูปแบบข้อมูลหมวดหมู่ไม่ถูกต้อง'
          }
        });
      }
    }

    // Update setting
    const setting = await AccountingSettings.set(key, value, userId);

    res.json({
      success: true,
      data: setting,
      message: 'อัปเดตการตั้งค่าสำเร็จ'
    });
  } catch (error) {
    console.error('Update setting error:', error);

    // Handle specific errors
    if (error.message === 'Key and value are required') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'กรุณาระบุค่าที่ต้องการตั้ง'
        }
      });
    }

    if (error.message === 'Invalid date format. Use MM-DD format') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น MM-DD)'
        }
      });
    }

    if (error.message === 'Categories must be an array') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'หมวดหมู่ต้องเป็น array'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า'
      }
    });
  }
};

/**
 * Get a specific setting
 * GET /api/accounting/settings/:key
 */
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await AccountingSettings.findByKey(key);

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบการตั้งค่าที่ต้องการ'
        }
      });
    }

    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า'
      }
    });
  }
};

/**
 * Initialize default settings
 * POST /api/accounting/settings/initialize
 */
const initializeSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    await AccountingSettings.initializeDefaults(userId);

    res.json({
      success: true,
      message: 'เริ่มต้นการตั้งค่าสำเร็จ'
    });
  } catch (error) {
    console.error('Initialize settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการเริ่มต้นการตั้งค่า'
      }
    });
  }
};

module.exports = {
  getSettings,
  getSetting,
  updateSetting,
  initializeSettings
};
