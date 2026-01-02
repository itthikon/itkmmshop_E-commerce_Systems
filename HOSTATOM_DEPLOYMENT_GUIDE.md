# คู่มือ Deploy ไปยัง Hostatom ผ่าน Plesk + GitHub

## ภาพรวม
คู่มือนี้จะแนะนำการ Deploy โปรเจค itkmmshop E-commerce ไปยัง Hostatom โดยใช้ Plesk Panel และเชื่อมต่อกับ GitHub

---

## ✅ Pre-Deployment Checklist

### 1. ตรวจสอบโค้ด
- [x] ลบโค้ด QR Code ที่ไม่ใช้แล้ว
- [x] ตรวจสอบ dependencies ใน package.json
- [x] มี .env.example สำหรับทั้ง backend และ frontend
- [x] มี .gitignore ครบถ้วน
- [ ] ทดสอบระบบใน local environment

### 2. เตรียม Environment Variables
- [ ] JWT_SECRET (ต้องเปลี่ยนจาก development)
- [ ] Database credentials
- [ ] SlipOK API Key
- [ ] Frontend URL (production domain)

### 3. เตรียม Database
- [ ] Export database schema
- [ ] เตรียม seed data (ถ้ามี)

---

## 📋 ขั้นตอนการ Deploy

## Phase 1: เตรียม GitHub Repository

### 1.1 สร้าง/อัพเดท Repository

```bash
# ตรวจสอบ git status
git status

# Add ไฟล์ทั้งหมด
git add .

# Commit
git commit -m "Prepare for Hostatom deployment"

# Push to GitHub
git push origin main
```

### 1.2 ตรวจสอบไฟล์ที่ไม่ควร commit
ตรวจสอบว่าไฟล์เหล่านี้ **ไม่ได้** อยู่ใน repository:
- ❌ `.env` files
- ❌ `node_modules/`
- ❌ `uploads/` (ไฟล์ที่ upload จริง)
- ❌ `logs/`
- ❌ Database credentials

---

## Phase 2: ตั้งค่า Hostatom + Plesk

### 2.1 เข้าสู่ Plesk Panel
1. เข้า Plesk ที่ `https://your-domain.com:8443`
2. Login ด้วย credentials ที่ Hostatom ให้มา

### 2.2 สร้าง Database (MySQL)

1. ไปที่ **Databases** → **Add Database**
2. ตั้งค่า:
   - Database name: `itkmmshop` (หรือชื่อที่ต้องการ)
   - Database user: สร้าง user ใหม่
   - Password: ใช้ password ที่แข็งแรง
   - Character set: `utf8mb4`
   - Collation: `utf8mb4_unicode_ci`

3. **บันทึก credentials**:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=itkmmshop
   ```

### 2.3 Import Database Schema

1. ไปที่ **Databases** → เลือก database → **phpMyAdmin**
2. Import ไฟล์ `backend/config/schema.sql`
3. (Optional) Import seed data ถ้ามี

---

## Phase 3: Deploy Backend (Node.js API)

### 3.1 สร้าง Node.js Application

1. ไปที่ **Websites & Domains** → **Node.js**
2. คลิก **Enable Node.js**
3. ตั้งค่า:
   - **Application mode**: Production
   - **Node.js version**: 18.x หรือสูงกว่า
   - **Document root**: `/httpdocs/backend`
   - **Application URL**: `https://api.yourdomain.com` หรือ `/api`
   - **Application startup file**: `server.js`

### 3.2 Clone Repository (Backend)

เข้า SSH หรือใช้ Plesk File Manager:

```bash
# เข้า SSH
ssh your-username@your-domain.com

# ไปที่ directory
cd /var/www/vhosts/yourdomain.com/httpdocs

# Clone repository
git clone https://github.com/your-username/your-repo.git .

# หรือถ้ามี repository อยู่แล้ว
git pull origin main
```

### 3.3 ติดตั้ง Dependencies (Backend)

```bash
cd backend
npm install --production
```

### 3.4 สร้างไฟล์ .env (Backend)

```bash
cd backend
nano .env
```

กรอกข้อมูล:
```env
# Server Configuration
PORT=5050
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=itkmmshop
DB_CONNECTION_LIMIT=10

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_production
JWT_EXPIRES_IN=7d

# SlipOK API Configuration
SLIPOK_API_KEY=your_slipok_api_key
SLIPOK_API_URL=https://api.slipok.com/api/v1

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# VAT Configuration
DEFAULT_VAT_RATE=7.00

# Logging Configuration
LOG_LEVEL=info

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
PAYMENT_RATE_LIMIT_MAX=10
```

### 3.5 สร้าง Uploads Directory

```bash
cd backend
mkdir -p uploads/products
mkdir -p uploads/receipts
chmod 755 uploads
chmod 755 uploads/products
chmod 755 uploads/receipts
```

### 3.6 เริ่ม Backend Application

ใน Plesk:
1. ไปที่ **Node.js** settings
2. คลิก **NPM Install** (ถ้ายังไม่ได้ทำ)
3. คลิก **Restart App**
4. ตรวจสอบ status ว่าเป็น **Running**

หรือผ่าน SSH:
```bash
cd backend
npm start
```

### 3.7 ตั้งค่า Process Manager (PM2) - แนะนำ

```bash
# ติดตั้ง PM2 globally
npm install -g pm2

# Start application
cd backend
pm2 start server.js --name itkmmshop-api

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
```

---

## Phase 4: Deploy Frontend (React)

### 4.1 Build Frontend Locally หรือบน Server

**Option A: Build บน Local แล้ว Upload**

```bash
# บน local machine
cd frontend

# สร้างไฟล์ .env.production
echo "REACT_APP_API_URL=https://api.yourdomain.com/api" > .env.production
echo "REACT_APP_ENV=production" >> .env.production

# Build
npm run build

# Upload folder build/ ไปยัง server
# ใช้ FTP, SFTP, หรือ Plesk File Manager
```

**Option B: Build บน Server**

```bash
# เข้า SSH
cd /var/www/vhosts/yourdomain.com/httpdocs/frontend

# สร้างไฟล์ .env.production
nano .env.production
```

เพิ่ม:
```env
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_API_TIMEOUT=30000
REACT_APP_ENV=production
```

```bash
# ติดตั้ง dependencies
npm install

# Build
npm run build
```

### 4.2 ตั้งค่า Web Server (Apache/Nginx)

**สำหรับ Apache (Plesk default):**

สร้างไฟล์ `.htaccess` ใน `frontend/build/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache Control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

### 4.3 ตั้งค่า Document Root

ใน Plesk:
1. ไปที่ **Websites & Domains** → **Hosting Settings**
2. เปลี่ยน **Document root** เป็น: `/httpdocs/frontend/build`
3. Save

---

## Phase 5: ตั้งค่า Domain และ SSL

### 5.1 ตั้งค่า Domain

1. ไปที่ **Websites & Domains**
2. เพิ่ม domain หรือ subdomain:
   - Main site: `yourdomain.com` → Frontend
   - API: `api.yourdomain.com` → Backend

### 5.2 ติดตั้ง SSL Certificate (Let's Encrypt)

1. ไปที่ **SSL/TLS Certificates**
2. คลิก **Install** (Let's Encrypt)
3. เลือก domains ที่ต้องการ
4. คลิก **Get it free**
5. รอจนได้ certificate

### 5.3 บังคับใช้ HTTPS

1. ไปที่ **Hosting Settings**
2. เปิด **Permanent SEO-safe 301 redirect from HTTP to HTTPS**
3. Save

---

## Phase 6: ตั้งค่า Reverse Proxy (สำหรับ API)

### 6.1 ตั้งค่า Nginx Reverse Proxy

ใน Plesk:
1. ไปที่ **Apache & nginx Settings**
2. เพิ่ม configuration ใน **Additional nginx directives**:

```nginx
location /api {
    proxy_pass http://localhost:5050;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

location /uploads {
    proxy_pass http://localhost:5050;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

3. คลิก **OK**
4. Restart web server

---

## Phase 7: ตั้งค่า Auto-Deploy จาก GitHub (Optional)

### 7.1 ใช้ GitHub Webhooks

1. ใน GitHub repository → **Settings** → **Webhooks**
2. คลิก **Add webhook**
3. ตั้งค่า:
   - Payload URL: `https://yourdomain.com/deploy-hook.php`
   - Content type: `application/json`
   - Secret: สร้าง secret key
   - Events: `Just the push event`

### 7.2 สร้าง Deploy Script

สร้างไฟล์ `deploy-hook.php` ใน document root:

```php
<?php
// GitHub Webhook Secret
$secret = 'your_webhook_secret';

// Get payload
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';

// Verify signature
$expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);
if (!hash_equals($expected, $signature)) {
    http_response_code(403);
    die('Invalid signature');
}

// Execute deployment
$output = shell_exec('cd /var/www/vhosts/yourdomain.com/httpdocs && ./deploy.sh 2>&1');

echo "Deployment triggered:\n";
echo $output;
?>
```

### 7.3 สร้าง Deploy Script

สร้างไฟล์ `deploy.sh`:

```bash
#!/bin/bash

# Pull latest code
git pull origin main

# Backend
cd backend
npm install --production
pm2 restart itkmmshop-api

# Frontend
cd ../frontend
npm install
npm run build

echo "Deployment completed!"
```

ทำให้ executable:
```bash
chmod +x deploy.sh
```

---

## Phase 8: ตรวจสอบและทดสอบ

### 8.1 ตรวจสอบ Backend

```bash
# ตรวจสอบ API health
curl https://api.yourdomain.com/health

# ตรวจสอบ API base
curl https://api.yourdomain.com/api
```

### 8.2 ตรวจสอบ Frontend

1. เปิด browser ไปที่ `https://yourdomain.com`
2. ตรวจสอบว่าหน้าเว็บโหลดได้
3. ทดสอบ features หลัก:
   - ดูสินค้า
   - เพิ่มสินค้าลงตะกร้า
   - Login/Register
   - Checkout

### 8.3 ตรวจสอบ Logs

```bash
# Backend logs
cd backend
tail -f logs/combined.log

# PM2 logs
pm2 logs itkmmshop-api

# Nginx/Apache logs
tail -f /var/log/nginx/error.log
tail -f /var/log/apache2/error.log
```

---

## 🔧 Troubleshooting

### ปัญหา: Backend ไม่ start

**แก้ไข:**
```bash
# ตรวจสอบ logs
pm2 logs itkmmshop-api

# ตรวจสอบ port
netstat -tulpn | grep 5050

# Restart
pm2 restart itkmmshop-api
```

### ปัญหา: Database connection failed

**แก้ไข:**
1. ตรวจสอบ credentials ใน `.env`
2. ตรวจสอบว่า MySQL service ทำงาน
3. ตรวจสอบ firewall rules

### ปัญหา: Frontend แสดง 404 เมื่อ refresh

**แก้ไข:**
- ตรวจสอบว่ามีไฟล์ `.htaccess` ใน build folder
- ตรวจสอบว่า Apache mod_rewrite เปิดอยู่

### ปัญหา: CORS errors

**แก้ไข:**
- ตรวจสอบ `FRONTEND_URL` ใน backend `.env`
- ตรวจสอบ CORS configuration ใน `backend/server.js`

### ปัญหา: File upload ไม่ทำงาน

**แก้ไข:**
```bash
# ตรวจสอบ permissions
cd backend
chmod 755 uploads
chmod 755 uploads/products
chmod 755 uploads/receipts

# ตรวจสอบ owner
chown -R www-data:www-data uploads
```

---

## 📊 Monitoring และ Maintenance

### Daily Checks
- [ ] ตรวจสอบ application status (PM2)
- [ ] ตรวจสอบ disk space
- [ ] ตรวจสอบ error logs

### Weekly Checks
- [ ] Database backup
- [ ] ตรวจสอบ SSL certificate expiry
- [ ] Review security logs

### Monthly Checks
- [ ] Update dependencies
- [ ] Performance review
- [ ] Security audit

---

## 🔐 Security Best Practices

1. **เปลี่ยน default passwords ทั้งหมด**
2. **ใช้ strong JWT_SECRET**
3. **Enable firewall**
4. **Regular backups**
5. **Keep dependencies updated**
6. **Monitor logs regularly**
7. **Use HTTPS everywhere**
8. **Limit SSH access**

---

## 📞 Support

หากมีปัญหาในการ Deploy:
1. ตรวจสอบ logs ก่อน
2. ดู Troubleshooting section
3. ติดต่อ Hostatom support
4. ตรวจสอบ Plesk documentation

---

## ✅ Post-Deployment Checklist

- [ ] Backend API ทำงานได้
- [ ] Frontend โหลดได้
- [ ] Database เชื่อมต่อได้
- [ ] SSL certificate ติดตั้งแล้ว
- [ ] HTTPS redirect ทำงาน
- [ ] File upload ทำงาน
- [ ] Payment integration ทำงาน
- [ ] Email notifications ทำงาน (ถ้ามี)
- [ ] Backup system ตั้งค่าแล้ว
- [ ] Monitoring ตั้งค่าแล้ว

---

**หมายเหตุ:** คู่มือนี้เป็น general guide สำหรับ Hostatom + Plesk อาจต้องปรับแต่งตาม configuration ของ hosting package ที่คุณใช้
