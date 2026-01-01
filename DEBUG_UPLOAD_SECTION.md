# Debug: ช่องอัปโหลดสลิปไม่แสดง

## ขั้นตอนการ Debug

### 1. เปิด Browser Console
1. กด F12 หรือ Right Click → Inspect
2. ไปที่ Tab "Console"
3. Refresh หน้า Order Confirmation
4. ดูว่ามีข้อความ `Payment method: ...` หรือไม่

### 2. ตรวจสอบ Payment Method
ดูว่าใน console แสดงอะไร:
- ถ้าแสดง `Payment method: bank_transfer` → ควรมีช่องอัปโหลด
- ถ้าแสดง `Payment method: cod` → ไม่มีช่องอัปโหลด (ถูกต้อง)
- ถ้าไม่แสดงอะไรเลย → มีปัญหา

### 3. ตรวจสอบ Network Request
1. ไปที่ Tab "Network"
2. Refresh หน้า
3. หา request ที่ชื่อว่า `8` หรือ order ID ของคุณ
4. คลิกที่ request นั้น
5. ไปที่ Tab "Response"
6. ดูว่า `payment_method` คืออะไร

## วิธีแก้ชั่วคราว

ถ้าต้องการอัปโหลดสลิปตอนนี้:
1. ไปที่เมนู "ติดตามคำสั่งซื้อ"
2. ใส่หมายเลขคำสั่งซื้อ: **8**
3. จะมีช่องอัปโหลดสลิปในหน้านั้น
