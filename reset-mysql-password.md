# วิธีรีเซ็ต MySQL Password บน macOS

## วิธีที่ 1: ใช้ MySQL System Preferences
1. เปิด System Preferences
2. คลิก MySQL
3. คลิก "Stop MySQL Server"
4. คลิก "Initialize Database"
5. ตั้งรหัสผ่านใหม่
6. คลิก "Start MySQL Server"

## วิธีที่ 2: ใช้ Terminal
```bash
# หยุด MySQL
sudo /usr/local/mysql/support-files/mysql.server stop

# เริ่ม MySQL ในโหมด safe mode
sudo /usr/local/mysql/bin/mysqld_safe --skip-grant-tables &

# เชื่อมต่อ MySQL
/usr/local/mysql/bin/mysql -u root

# ใน MySQL prompt
USE mysql;
UPDATE user SET authentication_string=PASSWORD('newpassword') WHERE User='root';
FLUSH PRIVILEGES;
EXIT;

# รีสตาร์ท MySQL
sudo /usr/local/mysql/support-files/mysql.server restart
```

## วิธีที่ 3: ใช้ Homebrew (ถ้าติดตั้งผ่าน Homebrew)
```bash
# หยุด MySQL
brew services stop mysql

# เริ่ม MySQL ในโหมด safe mode
mysqld_safe --skip-grant-tables &

# เชื่อมต่อและเปลี่ยนรหัสผ่าน
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword';
FLUSH PRIVILEGES;
EXIT;

# รีสตาร์ท MySQL
brew services start mysql
```

## หลังจากรีเซ็ตรหัสผ่านแล้ว
แก้ไขไฟล์ backend/.env:
```
DB_PASSWORD=newpassword
```