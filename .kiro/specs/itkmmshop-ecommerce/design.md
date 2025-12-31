# Design Document

## Overview

ระบบ itkmmshop e-commerce เป็นระบบขายสินค้าออนไลน์แบบครบวงจรที่ออกแบบด้วยสถาปัตยกรรม 3-tier (Presentation, Business Logic, Data) โดยใช้เทคโนโลยี React สำหรับ Frontend, Node.js/Express สำหรับ Backend และ MySQL สำหรับฐานข้อมูล

ระบบมีจุดเด่นหลักคือการคำนวณและแสดงผล VAT แยกต่อหน่วยสินค้าอย่างละเอียด รองรับการตรวจสอบสลิปผ่าน SlipOK API และมีระบบจัดการภาษีที่สมบูรณ์ตามกฎหมายไทย

## Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│ (Node.js/      │◄──►│   (MySQL)       │
│                 │    │  Express)       │    │                 │
│ - Customer UI   │    │ - REST API      │    │ - Product Data  │
│ - Admin Panel   │    │ - Auth Service  │    │ - Order Data    │
│ - Staff Panel   │    │ - VAT Calculator│    │ - User Data     │
└─────────────────┘    │ - SlipOK Client │    │ - Tax Records   │
                       │ - PDF Generator │    └─────────────────┘
                       └─────────────────┘
                              │
                       ┌─────────────────┐
                       │  External APIs  │
                       │ - SlipOK API    │
                       │ - Email Service │
                       │ - SMS Service   │
                       └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with Hooks
- React Router for navigation
- Context API for state management
- Axios for HTTP requests
- Tailwind CSS for styling
- React PDF for receipt generation

**Backend:**
- Node.js with Express.js
- JWT for authentication
- bcrypt for password hashing
- Multer for file uploads
- MySQL2 for database connection
- Joi for input validation
- Winston for logging

**Database:**
- MySQL 8.0+
- InnoDB storage engine
- ACID compliance for transactions

## Components and Interfaces

### Frontend Components

**Customer Interface:**
- `ProductCatalog`: แสดงสินค้าพร้อมการค้นหาและกรอง
- `ShoppingCart`: จัดการตะกร้าสินค้าพร้อมคำนวณ VAT
- `CheckoutFlow`: ขั้นตอนการสั่งซื้อพร้อม Timeline
- `OrderTracking`: ติดตามสถานะคำสั่งซื้อ
- `PaymentInterface`: หน้าชำระเงินและอัปโหลดสลิป
- `ReceiptViewer`: แสดงใบเสร็จพร้อม VAT breakdown

**Admin Interface:**
- `ProductManagement`: จัดการสินค้าและราคา
- `OrderManagement`: จัดการคำสั่งซื้อและสถานะ
- `VoucherManagement`: จัดการโค้ดส่วนลด
- `TaxManagement`: จัดการการตั้งค่าภาษีและรายงาน
- `FinancialReports`: รายงานการเงินและบัญชี
- `CustomerAnalytics`: วิเคราะห์ข้อมูลลูกค้า

**Staff Interface:**
- `OrderCreation`: สร้างคำสั่งซื้อแทนลูกค้า
- `OrderProcessing`: อัปเดตสถานะและเลขพัสดุ
- `PaymentVerification`: ตรวจสอบการชำระเงิน

### Backend Services

**Core Services:**
- `AuthService`: จัดการการยืนยันตัวตนและสิทธิ์
- `ProductService`: จัดการข้อมูลสินค้าและสต็อก
- `OrderService`: จัดการคำสั่งซื้อและสถานะ
- `PaymentService`: จัดการการชำระเงินและตรวจสอบสลิป
- `VATCalculatorService`: คำนวณภาษี VAT แยกต่อหน่วย
- `VoucherService`: จัดการโค้ดส่วนลดและการใช้งาน
- `ReportService`: สร้างรายงานทางการเงินและภาษี
- `AnalyticsService`: วิเคราะห์ข้อมูลลูกค้าและยอดขาย

**External Integration Services:**
- `SlipOKService`: เชื่อมต่อกับ SlipOK API
- `EmailService`: ส่งอีเมลแจ้งเตือน
- `SMSService`: ส่ง SMS แจ้งสถานะ
- `PDFService`: สร้างใบเสร็จและรายงาน PDF

### API Endpoints

**Authentication APIs:**
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ
- `GET /api/auth/profile` - ข้อมูลโปรไฟล์

**Product APIs:**
- `GET /api/products` - รายการสินค้า (รองรับ pagination, search, filter)
- `GET /api/products/:id` - รายละเอียดสินค้า
- `POST /api/products` - เพิ่มสินค้า (Admin)
- `PUT /api/products/:id` - แก้ไขสินค้า (Admin)
- `DELETE /api/products/:id` - ลบสินค้า (Admin)

**Cart APIs:**
- `GET /api/cart` - ดูตะกร้าสินค้า
- `POST /api/cart/add` - เพิ่มสินค้าในตะกร้า
- `PUT /api/cart/update` - อัปเดตจำนวนสินค้า
- `DELETE /api/cart/remove` - ลบสินค้าจากตะกร้า

**Order APIs:**
- `POST /api/orders` - สร้างคำสั่งซื้อ
- `GET /api/orders` - รายการคำสั่งซื้อ
- `GET /api/orders/:id` - รายละเอียดคำสั่งซื้อ
- `PUT /api/orders/:id/status` - อัปเดตสถานะ (Staff/Admin)

**Payment APIs:**
- `POST /api/payments/slip-upload` - อัปโหลดสลิป
- `POST /api/payments/verify-slip` - ตรวจสอบสลิปผ่าน SlipOK
- `GET /api/payments/:orderId/receipt` - ดาวน์โหลดใบเสร็จ

**Voucher APIs:**
- `POST /api/vouchers/validate` - ตรวจสอบโค้ดส่วนลด
- `POST /api/vouchers/apply` - ใช้โค้ดส่วนลด

## Data Models

### Core Entities

**Users Table:**
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('male', 'female', 'other'),
    birth_date DATE,
    phone VARCHAR(20),
    role ENUM('customer', 'staff', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Products Table:**
```sql
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT,
    price_excluding_vat DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 7.00,
    vat_amount DECIMAL(10,2) GENERATED ALWAYS AS (price_excluding_vat * vat_rate / 100) STORED,
    price_including_vat DECIMAL(10,2) GENERATED ALWAYS AS (price_excluding_vat + vat_amount) STORED,
    cost_price_excluding_vat DECIMAL(10,2),
    cost_vat_amount DECIMAL(10,2),
    stock_quantity INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(id)
);
```

**Orders Table:**
```sql
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INT NULL,
    guest_name VARCHAR(100),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(20),
    shipping_address TEXT NOT NULL,
    subtotal_excluding_vat DECIMAL(10,2) NOT NULL,
    total_vat_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'packing', 'packed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    source_platform VARCHAR(50) DEFAULT 'website',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Order Items Table:**
```sql
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price_excluding_vat DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL,
    unit_vat_amount DECIMAL(10,2) NOT NULL,
    unit_price_including_vat DECIMAL(10,2) NOT NULL,
    line_total_excluding_vat DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price_excluding_vat) STORED,
    line_total_vat DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_vat_amount) STORED,
    line_total_including_vat DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price_including_vat) STORED,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

**Vouchers Table:**
```sql
CREATE TABLE vouchers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_order_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    usage_limit INT,
    usage_limit_per_customer INT DEFAULT 1,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### VAT Calculation Model

ระบบคำนวณ VAT ตามหลักการ:
1. **ราคาไม่รวม VAT** เป็นราคาฐานของสินค้า
2. **VAT ต่อหน่วย** = ราคาไม่รวม VAT × อัตรา VAT (7%)
3. **ราคารวม VAT** = ราคาไม่รวม VAT + VAT ต่อหน่วย
4. **ส่วนลดหักก่อน VAT** เพื่อให้การคำนวณภาษีถูกต้อง

### Financial Tracking Model

**Revenue Tracking:**
- เชื่อมโยงกับ order_items เพื่อติดตามรายได้แยกต่อรายการ
- บันทึก Output VAT จากการขาย

**Expense Tracking:**
```sql
CREATE TABLE expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    description VARCHAR(255) NOT NULL,
    amount_excluding_vat DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 7.00,
    input_vat_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    category VARCHAR(100),
    receipt_file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Error Handling

### Frontend Error Handling

**Network Errors:**
- Retry mechanism สำหรับ API calls ที่ล้มเหลว
- Offline detection และ queue requests
- User-friendly error messages ภาษาไทย

**Validation Errors:**
- Real-time form validation
- Clear error indicators
- Prevent form submission with invalid data

**Payment Errors:**
- SlipOK API error handling
- Payment timeout handling
- Clear instructions for payment retry

### Backend Error Handling

**API Error Responses:**
```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ข้อมูลไม่ถูกต้อง",
    "details": {
      "field": "email",
      "message": "รูปแบบอีเมลไม่ถูกต้อง"
    }
  }
}
```

**Database Error Handling:**
- Transaction rollback on failures
- Connection pool management
- Deadlock detection and retry

**External API Error Handling:**
- SlipOK API timeout และ retry logic
- Graceful degradation เมื่อ external services ไม่พร้อมใช้งาน
- Error logging และ monitoring

## Testing Strategy

### Unit Testing
- ทดสอบ VAT calculation functions
- ทดสอบ voucher validation logic
- ทดสอบ order processing workflows
- ทดสอบ authentication และ authorization

### Property-Based Testing
- ใช้ fast-check library สำหรับ JavaScript
- กำหนดให้รัน minimum 100 iterations ต่อ property test
- แต่ละ property test จะมี comment อ้างอิง correctness property ในเอกสารนี้

### Integration Testing
- ทดสอบ API endpoints ทั้งหมด
- ทดสอบการเชื่อมต่อกับ SlipOK API
- ทดสอบ database transactions
- ทดสอบ file upload และ storage

### End-to-End Testing
- ทดสอบ complete user journeys
- ทดสอบ checkout flow ทั้งหมด
- ทดสอบ admin workflows
- ทดสอบ responsive design

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Guest Checkout Accessibility
*For any* valid shopping cart with products, the system should allow checkout completion without requiring user authentication
**Validates: Requirements 1.1**

### Property 2: Guest Order Creation Completeness
*For any* guest checkout completion, the system should collect all required information (shipping address, contact info) and generate a unique order number
**Validates: Requirements 1.2**

### Property 3: Guest Order Lookup Accuracy
*For any* valid order number and matching contact information, the system should return the correct order status and tracking information
**Validates: Requirements 1.3**

### Property 4: User Registration Data Completeness
*For any* user registration attempt, the system should collect and store all specified fields (name, surname, gender, birth date, phone, email, password, address)
**Validates: Requirements 2.1**

### Property 5: User Profile Data Availability
*For any* authenticated user accessing their profile, the system should display complete information including order history, shipping addresses, and account settings
**Validates: Requirements 2.3**

### Property 6: Product VAT Display Completeness
*For any* product displayed to customers, the system should show price excluding VAT, VAT amount per unit, and total price including VAT
**Validates: Requirements 3.5**

### Property 7: Cart VAT Information Preservation
*For any* product added to cart, the system should store and maintain quantity, unit price excluding VAT, VAT per unit, and total price including VAT
**Validates: Requirements 4.1**

### Property 8: Cart Quantity Recalculation Consistency
*For any* cart quantity modification, the system should automatically recalculate all pricing components (subtotals, VAT amounts, totals) correctly
**Validates: Requirements 4.2**

### Property 9: Voucher VAT Recalculation Accuracy
*For any* valid voucher application, the system should apply discount before VAT calculation and recalculate VAT based on the discounted amount
**Validates: Requirements 5.2, 5.5**

### Property 10: Order Review Information Completeness
*For any* order proceeding to review, the system should display itemized list with all required fields (product name, quantity, unit price excluding VAT, VAT per unit, line total)
**Validates: Requirements 6.1**

### Property 11: Payment Slip API Integration
*For any* payment slip upload, the system should send the slip to SlipOK API for verification and store the verification result
**Validates: Requirements 9.3**

### Property 12: Receipt VAT Breakdown Completeness
*For any* generated receipt, the system should display complete VAT breakdown including unit price excluding VAT, VAT per unit, unit price including VAT, quantity, and line total for each item
**Validates: Requirements 10.2**

### Property 13: Product Price VAT Auto-calculation
*For any* product price set by admin, the system should automatically calculate VAT per unit and total price including VAT using the configured VAT rate
**Validates: Requirements 11.2**

### Property 14: Revenue Recording VAT Completeness
*For any* sales transaction, the system should record amount excluding VAT, VAT amount, and total amount for each item in the financial records
**Validates: Requirements 14.1**

### Property 15: VAT Calculation Rate Accuracy
*For any* VAT calculation, the system should apply the configured rate (default 7%) to each product unit and allow rate configuration by admin
**Validates: Requirements 15.1**

### Property 16: Order VAT Storage Consistency
*For any* processed order, the system should store VAT per unit and total VAT amounts consistently regardless of whether pricing is displayed as inclusive or exclusive
**Validates: Requirements 15.2**

### Property 17: Input Validation Security
*For any* user input submitted to the system, the system should validate and sanitize the data to prevent SQL injection and XSS attacks
**Validates: Requirements 18.2**

### Property Reflection

After reviewing all identified properties, the following consolidations were made:
- Properties 5.2 and 5.5 were combined into Property 9 as they both test VAT recalculation after discount application
- All other properties provide unique validation value and test different aspects of the system
- Each property focuses on a specific functional requirement and can be independently tested
- The properties cover the core business logic around VAT calculations, order processing, and data integrity