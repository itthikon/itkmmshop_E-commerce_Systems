# Test Accounts

บัญชีทดสอบสำหรับระบบ itkmmshop22

## บัญชีที่มีอยู่

### 1. Admin Account (ผู้ดูแลระบบ)
- **Email:** admin@itkmmshop22.com
- **Password:** admin123
- **Role:** admin
- **สิทธิ์:** จัดการระบบทั้งหมด, ดูรายงาน, จัดการผู้ใช้, จัดการสินค้า

### 2. Staff Account (พนักงาน)
- **Email:** staff@itkmmshop22.com
- **Password:** staff123
- **Role:** staff
- **สิทธิ์:** สร้างคำสั่งซื้อ, จัดการคำสั่งซื้อ, ดูข้อมูลสินค้า

### 3. Customer Account (ลูกค้า)
- **Email:** customer@itkmmshop22.com
- **Password:** customer123
- **Role:** customer
- **สิทธิ์:** ซื้อสินค้า, ดูประวัติการสั่งซื้อ, จัดการโปรไฟล์

## การตั้งค่ารหัสผ่าน

หากต้องการรีเซ็ตรหัสผ่านหรือสร้างบัญชีใหม่:

```bash
# รีเซ็ตรหัสผ่านทั้งหมด
node update-passwords.js

# เพิ่มบัญชีพนักงาน
node add-staff-user.js
```

## หมายเหตุ

- รหัสผ่านทั้งหมดถูก hash ด้วย bcrypt (10 rounds)
- ในโหมด production ควรเปลี่ยนรหัสผ่านทั้งหมด
- บัญชีเหล่านี้ใช้สำหรับการทดสอบและพัฒนาเท่านั้น
