# Requirements Document

## Introduction

ระบบสั่งซื้อสินค้าออนไลน์แบบครบวงจรสำหรับร้านค้าออนไลน์ itkmmshop เป็นระบบ e-commerce ที่ออกแบบมาเพื่อรองรับการขายสินค้าออนไลน์ด้วยฟีเจอร์ที่ครบครัน รวมถึงระบบจัดการภาษี VAT แบบละเอียด ระบบชำระเงินผ่าน SlipOK API และระบบจัดการหลังบ้านที่สมบูรณ์

## Glossary

- **itkmmshop_system**: ระบบสั่งซื้อสินค้าออนไลน์แบบครบวงจรสำหรับร้านค้าออนไลน์ itkmmshop
- **guest_user**: ลูกค้าที่ใช้งานระบบโดยไม่ต้องสมัครสมาชิก
- **registered_user**: ลูกค้าที่สมัครสมาชิกและล็อกอินเข้าสู่ระบบ
- **admin_user**: ผู้ดูแลระบบที่มีสิทธิ์เต็มในการจัดการร้านค้า
- **staff_user**: พนักงานที่มีสิทธิ์จำกัดในการจัดการคำสั่งซื้อและสถานะการจัดส่ง
- **shopping_cart**: ตะกร้าสินค้าสำหรับเก็บสินค้าที่ลูกค้าเลือกซื้อ
- **voucher_code**: โค้ดส่วนลดที่ลูกค้าสามารถใช้เพื่อลดราคาสินค้า
- **vat_calculation**: การคำนวณภาษีมูลค่าเพิ่ม 7% แยกต่อหน่วยสินค้า
- **slipok_api**: API สำหรับตรวจสอบความถูกต้องของสลิปการโอนเงิน
- **order_timeline**: เส้นไทม์ไลน์แสดงขั้นตอนการสั่งซื้อและสถานะปัจจุบัน
- **tax_report**: รายงานภาษีรายเดือน/รายปีที่แสดง VAT แยกต่อหน่วย

## Requirements

### Requirement 1

**User Story:** As a guest user, I want to purchase products without creating an account, so that I can quickly complete my purchase without registration barriers.

#### Acceptance Criteria

1. WHEN a guest user selects products and adds them to cart THEN the itkmmshop_system SHALL allow checkout without requiring account creation
2. WHEN a guest user completes checkout THEN the itkmmshop_system SHALL collect shipping address, contact information, and generate order number
3. WHEN a guest user provides order number and phone/email THEN the itkmmshop_system SHALL display order status and tracking information
4. WHEN a guest order is created THEN the itkmmshop_system SHALL store guest order data separately from registered user orders
5. WHEN displaying order confirmation THEN the itkmmshop_system SHALL show order number and contact method for future order tracking

### Requirement 2

**User Story:** As a customer, I want to register for an account and manage my profile, so that I can track my order history and save my information for future purchases.

#### Acceptance Criteria

1. WHEN a user registers THEN the itkmmshop_system SHALL collect name, surname, gender, birth date, phone, email, password, and address
2. WHEN a registered user logs in THEN the itkmmshop_system SHALL authenticate credentials and provide access to user profile
3. WHEN a registered user accesses profile THEN the itkmmshop_system SHALL display order history, shipping addresses, and account settings
4. WHEN a registered user updates profile information THEN the itkmmshop_system SHALL validate and save changes immediately
5. WHEN a registered user logs out THEN the itkmmshop_system SHALL clear session and redirect to homepage

### Requirement 3

**User Story:** As a customer, I want to browse and search for products with filtering options, so that I can easily find products that meet my needs.

#### Acceptance Criteria

1. WHEN a customer searches for products THEN the itkmmshop_system SHALL return relevant results based on product name and description
2. WHEN a customer filters by category THEN the itkmmshop_system SHALL display only products belonging to selected categories
3. WHEN a customer sorts by price THEN the itkmmshop_system SHALL arrange products from lowest to highest or highest to lowest price
4. WHEN a customer sorts by popularity THEN the itkmmshop_system SHALL arrange products based on sales volume
5. WHEN displaying product information THEN the itkmmshop_system SHALL show price excluding VAT, VAT amount per unit, and total price including VAT

### Requirement 4

**User Story:** As a customer, I want to manage items in my shopping cart with detailed pricing breakdown, so that I can review my purchase before checkout.

#### Acceptance Criteria

1. WHEN a customer adds products to cart THEN the itkmmshop_system SHALL store quantity, unit price excluding VAT, VAT per unit, and total price including VAT
2. WHEN a customer modifies cart quantities THEN the itkmmshop_system SHALL recalculate all pricing components automatically
3. WHEN a customer removes items from cart THEN the itkmmshop_system SHALL update cart totals immediately
4. WHEN displaying cart summary THEN the itkmmshop_system SHALL show subtotal excluding VAT, total VAT amount, discounts, shipping cost, and final total
5. WHEN cart is empty THEN the itkmmshop_system SHALL display appropriate message and suggest popular products

### Requirement 5

**User Story:** As a customer, I want to apply discount vouchers similar to Shopee's system, so that I can reduce my order total with available promotions.

#### Acceptance Criteria

1. WHEN a customer enters voucher code THEN the itkmmshop_system SHALL validate code against expiry date, usage limits, and minimum order requirements
2. WHEN voucher is valid THEN the itkmmshop_system SHALL apply discount as percentage or fixed amount before VAT calculation
3. WHEN voucher has usage limits THEN the itkmmshop_system SHALL track usage count per customer and total usage
4. WHEN multiple vouchers are applicable THEN the itkmmshop_system SHALL allow stacking according to predefined rules
5. WHEN discount is applied THEN the itkmmshop_system SHALL recalculate VAT based on discounted price and update order total

### Requirement 6

**User Story:** As a customer, I want to review my complete order details before confirmation, so that I can verify all information is correct before payment.

#### Acceptance Criteria

1. WHEN customer proceeds to order review THEN the itkmmshop_system SHALL display itemized list with product name, quantity, unit price excluding VAT, VAT per unit, and line total
2. WHEN displaying order summary THEN the itkmmshop_system SHALL show subtotal excluding VAT, total VAT, discounts applied, shipping cost, and final amount
3. WHEN customer wants to modify order THEN the itkmmshop_system SHALL allow navigation back to previous steps without losing data
4. WHEN order details are confirmed THEN the itkmmshop_system SHALL proceed to payment selection
5. WHEN displaying pricing breakdown THEN the itkmmshop_system SHALL clearly separate VAT calculations for transparency

### Requirement 7

**User Story:** As a customer, I want to see my progress through the checkout process, so that I understand which step I'm on and can navigate accordingly.

#### Acceptance Criteria

1. WHEN customer is in checkout flow THEN the itkmmshop_system SHALL display timeline showing current step and completed steps
2. WHEN customer navigates between steps THEN the itkmmshop_system SHALL update timeline to reflect current position
3. WHEN customer clicks on previous steps THEN the itkmmshop_system SHALL allow navigation backward while preserving entered data
4. WHEN timeline is displayed THEN the itkmmshop_system SHALL show steps: Product Selection → Cart → Address → Payment → Confirmation
5. WHEN step is completed THEN the itkmmshop_system SHALL mark step as done and enable next step navigation

### Requirement 8

**User Story:** As a customer, I want to track my order status from packing to delivery, so that I know the current status of my purchase.

#### Acceptance Criteria

1. WHEN order is confirmed THEN the itkmmshop_system SHALL set initial status to "Order Received"
2. WHEN staff updates order status THEN the itkmmshop_system SHALL progress through: Packing → Packed → Shipped → Tracking Number Added
3. WHEN tracking number is added THEN the itkmmshop_system SHALL display tracking information to customer
4. WHEN packing photos/videos are uploaded THEN the itkmmshop_system SHALL make them available for customer viewing
5. WHEN customer checks order status THEN the itkmmshop_system SHALL display current status with estimated timeline

### Requirement 9

**User Story:** As a customer, I want to pay via bank transfer with QR code support, so that I can complete my purchase using my preferred payment method.

#### Acceptance Criteria

1. WHEN customer selects bank transfer payment THEN the itkmmshop_system SHALL display shop bank account details and PromptPay QR code
2. WHEN customer uploads payment slip THEN the itkmmshop_system SHALL store slip image linked to order
3. WHEN payment slip is uploaded THEN the itkmmshop_system SHALL send slip to SlipOK API for verification
4. WHEN SlipOK verification completes THEN the itkmmshop_system SHALL store verification result including transfer time and amount
5. WHEN payment is verified THEN the itkmmshop_system SHALL automatically update order status to paid

### Requirement 10

**User Story:** As a customer, I want to receive an automatic receipt after successful payment, so that I have proof of purchase with detailed VAT breakdown.

#### Acceptance Criteria

1. WHEN payment is confirmed THEN the itkmmshop_system SHALL generate receipt with unique receipt number and date
2. WHEN displaying receipt items THEN the itkmmshop_system SHALL show unit price excluding VAT, VAT per unit, unit price including VAT, quantity, and line total
3. WHEN calculating receipt totals THEN the itkmmshop_system SHALL display subtotal excluding VAT, total VAT, discounts, shipping, and final amount
4. WHEN receipt is generated THEN the itkmmshop_system SHALL provide PDF download and print options
5. WHEN customer accesses receipt THEN the itkmmshop_system SHALL maintain receipt availability in order history

### Requirement 11

**User Story:** As an admin, I want to manage products with detailed pricing and VAT calculations, so that I can maintain accurate product information and pricing.

#### Acceptance Criteria

1. WHEN admin adds new product THEN the itkmmshop_system SHALL generate unique product ID automatically
2. WHEN admin sets product price THEN the itkmmshop_system SHALL calculate VAT per unit and total price including VAT automatically
3. WHEN admin uploads product images THEN the itkmmshop_system SHALL rename files using product ID and organize by category
4. WHEN admin manages inventory THEN the itkmmshop_system SHALL track stock levels and update automatically on sales
5. WHEN stock is low THEN the itkmmshop_system SHALL notify admin when inventory falls below threshold

### Requirement 12

**User Story:** As an admin, I want to manage orders and shipping status, so that I can process orders efficiently and keep customers informed.

#### Acceptance Criteria

1. WHEN admin views orders THEN the itkmmshop_system SHALL display order list with status, customer info, and order details
2. WHEN admin updates order status THEN the itkmmshop_system SHALL progress order through defined workflow stages
3. WHEN admin adds tracking number THEN the itkmmshop_system SHALL update order with shipping information
4. WHEN admin uploads packing media THEN the itkmmshop_system SHALL store files linked to specific order
5. WHEN order status changes THEN the itkmmshop_system SHALL notify customer via email or SMS

### Requirement 13

**User Story:** As a staff member, I want to create orders on behalf of customers from other platforms, so that I can process cross-platform sales through the unified system.

#### Acceptance Criteria

1. WHEN staff creates customer order THEN the itkmmshop_system SHALL allow product selection from inventory
2. WHEN staff enters customer details THEN the itkmmshop_system SHALL collect name, address, contact info, and source platform
3. WHEN staff applies vouchers THEN the itkmmshop_system SHALL validate and apply discounts with automatic VAT recalculation
4. WHEN staff completes order THEN the itkmmshop_system SHALL generate order with same structure as customer-created orders
5. WHEN cross-platform order is saved THEN the itkmmshop_system SHALL track source platform for analytics

### Requirement 14

**User Story:** As an admin, I want to track revenue, expenses, and profit with detailed VAT breakdown, so that I can manage business finances accurately.

#### Acceptance Criteria

1. WHEN recording sales revenue THEN the itkmmshop_system SHALL store amount excluding VAT, VAT amount, and total amount for each item
2. WHEN recording expenses THEN the itkmmshop_system SHALL capture expense amount excluding VAT, input VAT, and total amount
3. WHEN calculating profit THEN the itkmmshop_system SHALL compute profit per item as (selling price - cost price) excluding VAT
4. WHEN generating financial reports THEN the itkmmshop_system SHALL show revenue, expenses, and profit with VAT breakdown
5. WHEN exporting financial data THEN the itkmmshop_system SHALL support Excel, PDF, and SQL dump formats

### Requirement 15

**User Story:** As an admin, I want to manage tax calculations and generate tax reports, so that I can comply with Thai tax regulations and file accurate returns.

#### Acceptance Criteria

1. WHEN calculating VAT THEN the itkmmshop_system SHALL apply 7% rate to each product unit and allow rate configuration
2. WHEN processing orders THEN the itkmmshop_system SHALL store VAT per unit, total VAT, and support both inclusive and exclusive pricing
3. WHEN generating tax reports THEN the itkmmshop_system SHALL show monthly/yearly sales with VAT breakdown per item
4. WHEN calculating tax liability THEN the itkmmshop_system SHALL compute output VAT minus input VAT for net VAT payable
5. WHEN exporting tax reports THEN the itkmmshop_system SHALL format reports suitable for Revenue Department submission

### Requirement 16

**User Story:** As an admin, I want to analyze customer demographics and location data, so that I can understand my customer base and make informed business decisions.

#### Acceptance Criteria

1. WHEN analyzing customer locations THEN the itkmmshop_system SHALL categorize customers by subdistrict, district, and province
2. WHEN analyzing demographics THEN the itkmmshop_system SHALL segment customers by gender and age groups
3. WHEN displaying analytics THEN the itkmmshop_system SHALL present data through charts and tables on dashboard
4. WHEN generating customer reports THEN the itkmmshop_system SHALL show customer distribution and purchasing patterns
5. WHEN accessing analytics THEN the itkmmshop_system SHALL update data in real-time based on current customer database

### Requirement 17

**User Story:** As a user, I want to experience a modern, responsive interface with clear VAT display, so that I can easily navigate and understand pricing information.

#### Acceptance Criteria

1. WHEN accessing the website THEN the itkmmshop_system SHALL display responsive design that works on mobile and desktop
2. WHEN viewing pricing information THEN the itkmmshop_system SHALL clearly highlight VAT amounts with distinct styling
3. WHEN interacting with interface elements THEN the itkmmshop_system SHALL provide smooth transitions and hover effects
4. WHEN loading content THEN the itkmmshop_system SHALL show loading animations and fade effects
5. WHEN displaying VAT information THEN the itkmmshop_system SHALL use consistent formatting across all pages

### Requirement 18

**User Story:** As a system administrator, I want the system to maintain security and follow best practices, so that customer data and business information are protected.

#### Acceptance Criteria

1. WHEN users authenticate THEN the itkmmshop_system SHALL use JWT tokens and bcrypt password hashing
2. WHEN processing user input THEN the itkmmshop_system SHALL validate and sanitize all data to prevent SQL injection and XSS
3. WHEN handling sensitive operations THEN the itkmmshop_system SHALL use HTTPS encryption for all data transmission
4. WHEN accessing APIs THEN the itkmmshop_system SHALL implement rate limiting to prevent abuse
5. WHEN managing database transactions THEN the itkmmshop_system SHALL use proper transaction handling for data consistency