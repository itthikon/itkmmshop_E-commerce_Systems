const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Upload Middleware
 * Handles file uploads with proper organization
 */

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure storage for product images
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/products';
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Temporary filename - will be renamed to SKU format after validation
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `temp-${uniqueSuffix}${ext}`);
  }
});

// File filter for product images - only .jpg, .jpeg, .png
const productImageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพ .jpg, .jpeg หรือ .png เท่านั้น'), false);
  }
};

// Configure multer for product images
const uploadProductImage = multer({
  storage: productStorage,
  fileFilter: productImageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// File filter for images only (for payment slips and other uploads)
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure storage for payment slips
const slipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/slips';
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `slip-${uniqueSuffix}${ext}`);
  }
});

const uploadPaymentSlip = multer({
  storage: slipStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Configure storage for packing media
const packingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/packing';
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `packing-${uniqueSuffix}${ext}`);
  }
});

const uploadPackingMedia = multer({
  storage: packingStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image|video/.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for videos
  }
});

// Configure storage for accounting attachments
const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/attachments';
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `attachment-${uniqueSuffix}${ext}`);
  }
});

// File filter for accounting attachments - PDF, JPG, PNG only
const attachmentFileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const allowedExtensions = /pdf|jpeg|jpg|png/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  
  if (allowedTypes.includes(file.mimetype) && extname) {
    cb(null, true);
  } else {
    cb(new Error('ประเภทไฟล์ไม่ถูกต้อง (รองรับเฉพาะ PDF, JPG, PNG)'), false);
  }
};

// Configure multer for accounting attachments
const uploadAttachment = multer({
  storage: attachmentStorage,
  fileFilter: attachmentFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = {
  uploadProductImage,
  uploadPaymentSlip,
  uploadPackingMedia,
  uploadAttachment
};
