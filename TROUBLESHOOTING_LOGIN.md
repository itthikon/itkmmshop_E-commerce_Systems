# แก้ปัญหาการ Login

## ปัญหาที่พบบ่อย

### 1. ไม่สามารถ Login ได้ (Invalid Credentials)

**สาเหตุ:** รหัสผ่านในฐานข้อมูลยังไม่ได้ถูก hash ด้วย bcrypt

**วิธีแก้:**
```bash
cd backend
node update-passwords.js
```

ผลลัพธ์ที่ควรได้:
```
✓ Passwords updated successfully
  Admin: admin@itkmmshop22.com / admin123
  Staff: staff@itkmmshop22.com / staff123
  Customer: customer@itkmmshop22.com / customer123
```

### 2. หน้า Staff หรือ Customer ไม่แสดง (404 Not Found)

**สาเหตุ:** Frontend ยังไม่ได้ reload หรือมี error ในการ compile

**วิธีแก้:**
1. ตรวจสอบว่า frontend กำลังรันอยู่:
```bash
# ตรวจสอบ process
ps aux | grep "react-scripts"
```

2. Restart frontend:
```bash
# Kill process เก่า
pkill -f "react-scripts"

# Start ใหม่
cd frontend
npm start
```

3. Clear browser cache และ reload:
- กด `Cmd + Shift + R` (Mac) หรือ `Ctrl + Shift + R` (Windows)
- หรือเปิด DevTools → Application → Clear Storage → Clear site data

### 3. Login สำเร็จแต่ไม่ redirect

**สาเหตุ:** Token ไม่ถูกบันทึกใน localStorage

**วิธีแก้:**
1. เปิด Browser DevTools (F12)
2. ไปที่ Console tab
3. ตรวจสอบ error messages
4. ไปที่ Application tab → Local Storage
5. ตรวจสอบว่ามี `token` และ `user` หรือไม่

**ถ้าไม่มี:** ลบ localStorage และ login ใหม่:
```javascript
// ใน Console
localStorage.clear();
location.reload();
```

### 4. CORS Error

**สาเหตุ:** Backend ไม่อนุญาตให้ frontend เข้าถึง

**วิธีแก้:**
1. ตรวจสอบว่า backend รันอยู่ที่ port 5050:
```bash
curl http://localhost:5050/health
```

2. ตรวจสอบ CORS configuration ใน `backend/server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

3. Restart backend:
```bash
cd backend
npm start
```

### 5. Rate Limiting Error (429 Too Many Requests)

**สาเหตุ:** พยายาม login มากเกินไป

**วิธีแก้:**
รอ 15 นาที หรือ restart backend:
```bash
cd backend
npm start
```

## การทดสอบ API โดยตรง

### ทดสอบ Login API
```bash
# Admin
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@itkmmshop22.com","password":"admin123"}'

# Staff
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@itkmmshop22.com","password":"staff123"}'

# Customer
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@itkmmshop22.com","password":"customer123"}'
```

### ตรวจสอบ User ในฐานข้อมูล
```bash
mysql -u root -p'@Zero2540' itkmmshop22 -e "
SELECT id, email, role, status 
FROM users 
ORDER BY role;
"
```

## ขั้นตอนการแก้ปัญหาแบบเต็ม

1. **ตรวจสอบ Backend:**
```bash
cd backend
npm start
# ควรเห็น: Server running on port 5050
```

2. **ตรวจสอบ Frontend:**
```bash
cd frontend
npm start
# ควรเห็น: Compiled successfully!
```

3. **อัปเดตรหัสผ่าน:**
```bash
cd backend
node update-passwords.js
```

4. **ทดสอบ Login:**
- เปิด http://localhost:3000/login
- ใช้บัญชีทดสอบ
- ตรวจสอบ Console สำหรับ errors

5. **ตรวจสอบ Network:**
- เปิด DevTools → Network tab
- Login
- ดู request ไปที่ `/api/auth/login`
- ตรวจสอบ response

## ติดต่อขอความช่วยเหลือ

หากยังแก้ไขไม่ได้ ให้ส่งข้อมูลต่อไปนี้:
1. Error message จาก Console
2. Network request/response
3. Backend logs
4. ขั้นตอนที่ทำมาแล้ว
