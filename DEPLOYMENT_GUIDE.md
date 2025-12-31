# คู่มือการ Deploy - itkmmshop E-commerce System

## สารบัญ
1. [ภาพรวมการ Deploy](#ภาพรวมการ-deploy)
2. [การเตรียมความพร้อม](#การเตรียมความพร้อม)
3. [Deploy บน VPS/Cloud Server](#deploy-บน-vpscloud-server)
4. [Deploy บน Vercel + Railway](#deploy-บน-vercel--railway)
5. [Deploy บน AWS](#deploy-บน-aws)
6. [การตั้งค่า Domain และ SSL](#การตั้งค่า-domain-และ-ssl)
7. [Monitoring และ Maintenance](#monitoring-และ-maintenance)

---

## ภาพรวมการ Deploy

### สถาปัตยกรรมระบบ
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   Database  │
│   (React)   │     │  (Node.js)  │     │   (MySQL)   │
│   Port 80   │     │  Port 5001  │     │  Port 3306  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### ตัวเลือกการ Deploy

| Platform | Frontend | Backend | Database | ราคา | ความยาก |
|----------|----------|---------|----------|------|---------|
| **VPS (DigitalOcean/Linode)** | ✓ | ✓ | ✓ | ~$10-20/เดือน | ปานกลาง |
| **Vercel + Railway** | ✓ | ✓ | ✓ | ~$5-15/เดือน | ง่าย |
| **AWS (EC2 + RDS)** | ✓ | ✓ | ✓ | ~$20-50/เดือน | ยาก |
| **Heroku** | ✓ | ✓ | ✓ | ~$15-30/เดือน | ง่าย |

---

## การเตรียมความพร้อม

### 1. Checklist ก่อน Deploy

- [ ] ทดสอบระบบใน local environment แล้ว
- [ ] มี domain name (ถ้าต้องการ)
- [ ] เตรียม environment variables สำหรับ production
- [ ] สำรองข้อมูล database
- [ ] ตรวจสอบ security settings
- [ ] เตรียม SSL certificate

### 2. สร้าง Production Environment Files

**Backend `.env.production`:**
```env
# Server Configuration
PORT=5001
NODE_ENV=production

# Database Configuration
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-strong-password
DB_NAME=itkmmshop

# JWT Configuration
JWT_SECRET=your-very-strong-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# SlipOK API
SLIPOK_API_KEY=your-slipok-api-key
SLIPOK_API_URL=https://api.slipok.com/api/v1

# Frontend URL
FRONTEND_URL=https://your-domain.com

# PromptPay
PROMPTPAY_ID=your-promptpay-id
BANK_NAME=ธนาคารของคุณ
BANK_ACCOUNT_NUMBER=xxx-x-xxxxx-x
BANK_ACCOUNT_NAME=itkmmshop
```

**Frontend `.env.production`:**
```env
REACT_APP_API_URL=https://api.your-domain.com/api
REACT_APP_ENV=production
```

---

## Deploy บน VPS/Cloud Server

### ขั้นตอนที่ 1: เตรียม Server

**1.1 เช่า VPS (แนะนำ DigitalOcean, Linode, หรือ Vultr)**
- RAM: อย่างน้อย 2GB
- Storage: อย่างน้อย 25GB SSD
- OS: Ubuntu 22.04 LTS

**1.2 เชื่อมต่อ Server**
```bash
ssh root@your-server-ip
```

**1.3 Update System**
```bash
apt update && apt upgrade -y
```

**1.4 ติดตั้ง Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
node --version  # ตรวจสอบ version
```

**1.5 ติดตั้ง MySQL**
```bash
apt install -y mysql-server
mysql_secure_installation
```

**1.6 ติดตั้ง Nginx**
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

**1.7 ติดตั้ง PM2 (Process Manager)**
```bash
npm install -g pm2
```

### ขั้นตอนที่ 2: Setup Database

**2.1 เข้าสู่ MySQL**
```bash
mysql -u root -p
```

**2.2 สร้าง Database และ User**
```sql
CREATE DATABASE itkmmshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'itkmmshop_user'@'localhost' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON itkmmshop.* TO 'itkmmshop_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**2.3 Import Schema**
```bash
mysql -u itkmmshop_user -p itkmmshop < /path/to/schema.sql
```

### ขั้นตอนที่ 3: Deploy Backend

**3.1 Clone Repository**
```bash
cd /var/www
git clone https://github.com/your-username/itkmmshop.git
cd itkmmshop/backend
```

**3.2 ติดตั้ง Dependencies**
```bash
npm install --production
```

**3.3 สร้าง .env File**
```bash
nano .env
# วาง production environment variables
```

**3.4 สร้าง Upload Directories**
```bash
mkdir -p uploads/products uploads/slips uploads/packing uploads/receipts
chmod 755 uploads -R
```

**3.5 เริ่ม Backend ด้วย PM2**
```bash
pm2 start server.js --name itkmmshop-backend
pm2 save
pm2 startup
```

**3.6 ตรวจสอบ Status**
```bash
pm2 status
pm2 logs itkmmshop-backend
```

### ขั้นตอนที่ 4: Deploy Frontend

**4.1 Build Frontend**
```bash
cd /var/www/itkmmshop/frontend
npm install
npm run build
```

**4.2 ย้าย Build Files**
```bash
mkdir -p /var/www/html/itkmmshop
cp -r build/* /var/www/html/itkmmshop/
```

### ขั้นตอนที่ 5: Configure Nginx

**5.1 สร้าง Nginx Config**
```bash
nano /etc/nginx/sites-available/itkmmshop
```

**5.2 เพิ่ม Configuration:**
```nginx
# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded files
    location /uploads {
        alias /var/www/itkmmshop/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# Frontend
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/html/itkmmshop;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
```

**5.3 Enable Site**
```bash
ln -s /etc/nginx/sites-available/itkmmshop /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### ขั้นตอนที่ 6: Setup SSL (Let's Encrypt)

**6.1 ติดตั้ง Certbot**
```bash
apt install -y certbot python3-certbot-nginx
```

**6.2 สร้าง SSL Certificate**
```bash
certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com
```

**6.3 Auto-renewal**
```bash
certbot renew --dry-run
```

---

## Deploy บน Vercel + Railway

### ขั้นตอนที่ 1: Deploy Database บน Railway

**1.1 สร้าง Account ที่ [Railway.app](https://railway.app)**

**1.2 สร้าง MySQL Database**
- คลิก "New Project"
- เลือก "Provision MySQL"
- คัดลอก connection details

**1.3 Import Schema**
```bash
mysql -h railway-host -P railway-port -u railway-user -p railway-db < backend/config/schema.sql
```

### ขั้นตอนที่ 2: Deploy Backend บน Railway

**2.1 สร้าง Service ใหม่**
- คลิก "New" → "GitHub Repo"
- เลือก repository ของคุณ
- เลือก `backend` directory

**2.2 ตั้งค่า Environment Variables**
```
NODE_ENV=production
PORT=5001
DB_HOST=railway-mysql-host
DB_PORT=railway-mysql-port
DB_USER=railway-mysql-user
DB_PASSWORD=railway-mysql-password
DB_NAME=railway-mysql-database
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**2.3 Deploy**
- Railway จะ deploy อัตโนมัติ
- คัดลอก URL ที่ได้

### ขั้นตอนที่ 3: Deploy Frontend บน Vercel

**3.1 สร้าง Account ที่ [Vercel.com](https://vercel.com)**

**3.2 Import Project**
- คลิก "New Project"
- Import จาก GitHub
- เลือก `frontend` directory

**3.3 ตั้งค่า Environment Variables**
```
REACT_APP_API_URL=https://your-railway-backend.up.railway.app/api
REACT_APP_ENV=production
```

**3.4 Deploy**
- Vercel จะ build และ deploy อัตโนมัติ

---

## Deploy บน AWS

### ขั้นตอนที่ 1: Setup RDS (Database)

**1.1 สร้าง RDS MySQL Instance**
- เข้า AWS Console → RDS
- Create Database → MySQL
- เลือก Free Tier (ถ้าต้องการ)
- ตั้งค่า username/password
- เปิด Public Access (ถ้าต้องการเข้าถึงจากภายนอก)

**1.2 Configure Security Group**
- เพิ่ม Inbound Rule: MySQL (3306) จาก EC2 Security Group

### ขั้นตอนที่ 2: Setup EC2 (Backend)

**2.1 Launch EC2 Instance**
- AMI: Ubuntu 22.04 LTS
- Instance Type: t2.micro (Free Tier) หรือ t2.small
- Configure Security Group:
  - SSH (22) จาก Your IP
  - HTTP (80) จาก Anywhere
  - HTTPS (443) จาก Anywhere
  - Custom TCP (5001) จาก Anywhere

**2.2 Connect และ Setup**
```bash
ssh -i your-key.pem ubuntu@ec2-ip-address
```

ทำตามขั้นตอนใน [Deploy บน VPS](#deploy-บน-vpscloud-server)

### ขั้นตอนที่ 3: Setup S3 (File Storage)

**3.1 สร้าง S3 Bucket**
- เข้า AWS Console → S3
- Create Bucket
- ตั้งชื่อ: `itkmmshop-uploads`
- เปิด Public Access สำหรับ images

**3.2 Update Backend Code**
ใช้ AWS SDK เพื่ออัปโหลดไฟล์ไปยัง S3 แทน local storage

### ขั้นตอนที่ 4: Setup CloudFront (CDN)

**4.1 สร้าง CloudFront Distribution**
- Origin: S3 Bucket
- Enable HTTPS
- Configure Cache Behaviors

---

## การตั้งค่า Domain และ SSL

### ตั้งค่า DNS Records

**A Records:**
```
@ → your-server-ip
www → your-server-ip
api → your-server-ip
```

**CNAME Records (ถ้าใช้ Vercel/Railway):**
```
@ → your-vercel-app.vercel.app
api → your-railway-backend.up.railway.app
```

### SSL Certificate

**Option 1: Let's Encrypt (Free)**
```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

**Option 2: Cloudflare (Free)**
- เพิ่ม domain ใน Cloudflare
- เปิด SSL/TLS → Full (strict)
- Cloudflare จะจัดการ SSL ให้อัตโนมัติ

---

## Monitoring และ Maintenance

### 1. Monitoring Tools

**PM2 Monitoring:**
```bash
pm2 monit
pm2 logs
```

**Nginx Logs:**
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

**MySQL Monitoring:**
```bash
mysqladmin -u root -p status
mysqladmin -u root -p processlist
```

### 2. Backup Strategy

**Database Backup (Daily):**
```bash
# สร้าง backup script
nano /root/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

mysqldump -u itkmmshop_user -p'your-password' itkmmshop > $BACKUP_DIR/itkmmshop_$DATE.sql
gzip $BACKUP_DIR/itkmmshop_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

```bash
chmod +x /root/backup-db.sh
```

**Setup Cron Job:**
```bash
crontab -e
```

```
0 2 * * * /root/backup-db.sh
```

**File Backup:**
```bash
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz /var/www/itkmmshop/backend/uploads
```

### 3. Update Strategy

**Backend Update:**
```bash
cd /var/www/itkmmshop/backend
git pull origin main
npm install
pm2 restart itkmmshop-backend
```

**Frontend Update:**
```bash
cd /var/www/itkmmshop/frontend
git pull origin main
npm install
npm run build
cp -r build/* /var/www/html/itkmmshop/
```

### 4. Security Checklist

- [ ] เปลี่ยน default passwords ทั้งหมด
- [ ] ปิด root SSH login
- [ ] ติดตั้ง fail2ban
- [ ] เปิด firewall (ufw)
- [ ] Update system เป็นประจำ
- [ ] Monitor logs เป็นประจำ
- [ ] Backup database เป็นประจำ
- [ ] ใช้ HTTPS เท่านั้น
- [ ] ตั้งค่า rate limiting
- [ ] เปิด CORS เฉพาะ domain ที่ต้องการ

### 5. Performance Optimization

**Enable Nginx Caching:**
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
    # ... other proxy settings
}
```

**Database Optimization:**
```sql
-- Add indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_category ON products(category_id);

-- Optimize tables
OPTIMIZE TABLE orders;
OPTIMIZE TABLE products;
```

---

## Troubleshooting

### ปัญหาที่พบบ่อย

**1. Backend ไม่สามารถเชื่อมต่อ Database**
```bash
# ตรวจสอบ MySQL service
systemctl status mysql

# ตรวจสอบ connection
mysql -u itkmmshop_user -p -h localhost itkmmshop
```

**2. Frontend ไม่สามารถเรียก API**
- ตรวจสอบ CORS settings ใน backend
- ตรวจสอบ REACT_APP_API_URL ใน frontend
- ตรวจสอบ Nginx configuration

**3. PM2 Process หยุดทำงาน**
```bash
pm2 restart itkmmshop-backend
pm2 logs itkmmshop-backend --lines 100
```

**4. SSL Certificate ไม่ทำงาน**
```bash
certbot renew --dry-run
nginx -t
systemctl reload nginx
```

---

## สรุป

การ Deploy ที่แนะนำสำหรับผู้เริ่มต้น:
1. **Development**: Local (localhost)
2. **Staging**: Vercel + Railway (ง่าย, ราคาถูก)
3. **Production**: VPS + Cloudflare (ควบคุมได้มาก, ประสิทธิภาพดี)

สำหรับคำถามเพิ่มเติม กรุณาติดต่อทีมพัฒนา
