const TransactionService = require('../services/TransactionService');

/**
 * Accounting Controller
 * Handles transaction CRUD operations
 */

/**
 * Create transaction
 * POST /api/accounting/transactions
 */
const createTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactionData = req.body;

    const transaction = await TransactionService.createManual(transactionData, userId);

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'สร้างรายการสำเร็จ'
    });
  } catch (error) {
    console.error('Create transaction error:', error);

    // Handle specific errors
    if (error.message === 'Missing required fields') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
        }
      });
    }

    if (error.message === 'Invalid transaction type') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ประเภทรายการไม่ถูกต้อง'
        }
      });
    }

    if (error.message === 'Amount must be greater than zero') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'จำนวนเงินต้องมากกว่า 0'
        }
      });
    }

    if (error.message === 'Category not found') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ไม่พบหมวดหมู่ที่เลือก'
        }
      });
    }

    if (error.message === 'Cannot use inactive category') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ไม่สามารถใช้หมวดหมู่ที่ถูกปิดใช้งาน'
        }
      });
    }

    if (error.message.includes('does not match transaction type')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ประเภทหมวดหมู่ไม่ตรงกับประเภทรายการ'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการสร้างรายการ'
      }
    });
  }
};

/**
 * Get all transactions with filters
 * GET /api/accounting/transactions
 */
const getTransactions = async (req, res) => {
  try {
    const filters = {
      transaction_type: req.query.transaction_type,
      category_id: req.query.category_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      search: req.query.search,
      sort_by: req.query.sort_by || 'transaction_date',
      sort_order: req.query.sort_order || 'DESC',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await TransactionService.getTransactions(filters);

    res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายการ'
      }
    });
  }
};

/**
 * Get transaction by ID
 * GET /api/accounting/transactions/:id
 */
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const Transaction = require('../models/Transaction');
    
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบรายการที่ต้องการ'
        }
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายการ'
      }
    });
  }
};

/**
 * Update transaction
 * PUT /api/accounting/transactions/:id
 */
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Check if transaction exists
    const Transaction = require('../models/Transaction');
    const existingTransaction = await Transaction.findById(id);

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบรายการที่ต้องการ'
        }
      });
    }

    // Prevent editing auto-generated sale transactions
    if (existingTransaction.reference_type === 'order') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'ไม่สามารถแก้ไขรายการที่สร้างอัตโนมัติจากการขาย'
        }
      });
    }

    const transaction = await TransactionService.updateTransaction(id, updateData, userId);

    res.json({
      success: true,
      data: transaction,
      message: 'อัปเดตรายการสำเร็จ'
    });
  } catch (error) {
    console.error('Update transaction error:', error);

    // Handle specific errors
    if (error.message === 'Amount must be greater than zero') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'จำนวนเงินต้องมากกว่า 0'
        }
      });
    }

    if (error.message === 'Category not found') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ไม่พบหมวดหมู่ที่เลือก'
        }
      });
    }

    if (error.message === 'Cannot use inactive category') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ไม่สามารถใช้หมวดหมู่ที่ถูกปิดใช้งาน'
        }
      });
    }

    if (error.message.includes('does not match transaction type')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ประเภทหมวดหมู่ไม่ตรงกับประเภทรายการ'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการอัปเดตรายการ'
      }
    });
  }
};

/**
 * Delete transaction (soft delete)
 * DELETE /api/accounting/transactions/:id
 */
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if transaction exists
    const Transaction = require('../models/Transaction');
    const existingTransaction = await Transaction.findById(id);

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบรายการที่ต้องการ'
        }
      });
    }

    // Prevent deletion of transactions linked to confirmed orders
    if (existingTransaction.reference_type === 'order' && existingTransaction.reference_id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'ไม่สามารถลบรายการที่เชื่อมโยงกับคำสั่งซื้อ'
        }
      });
    }

    await TransactionService.deleteTransaction(id, userId);

    res.json({
      success: true,
      message: 'ลบรายการสำเร็จ'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการลบรายการ'
      }
    });
  }
};

/**
 * Upload attachment for transaction
 * POST /api/accounting/transactions/:id/attachment
 */
const uploadTransactionAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists
    const Transaction = require('../models/Transaction');
    const existingTransaction = await Transaction.findById(id);

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบรายการที่ต้องการ'
        }
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด'
        }
      });
    }

    const filePath = req.file.path;
    const transaction = await TransactionService.uploadAttachment(id, filePath);

    res.json({
      success: true,
      data: transaction,
      message: 'อัปโหลดไฟล์แนบสำเร็จ'
    });
  } catch (error) {
    console.error('Upload attachment error:', error);

    // Handle multer errors
    if (error.message.includes('กรุณาอัปโหลดไฟล์')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'
      }
    });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  uploadTransactionAttachment
};
