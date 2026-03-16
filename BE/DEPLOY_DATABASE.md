# 🗄️ Hướng dẫn Deploy Database lên Production

## Bước 1: Tạo MySQL Database trên Railway (Khuyến nghị - Miễn phí)

### 1.1. Đăng ký và tạo database

1. Truy cập https://railway.app
2. Đăng nhập bằng GitHub
3. Click **"New Project"**
4. Chọn **"Provision MySQL"**
5. Đợi Railway tạo database (~30 giây)

### 1.2. Lấy thông tin kết nối

1. Click vào MySQL service vừa tạo
2. Tab **"Variables"**
3. Copy các giá trị sau:

```
MYSQLHOST=containers-us-west-xxx.railway.app
MYSQLPORT=6543
MYSQLUSER=root
MYSQLPASSWORD=xxxxxxxxxxxxxxxxxx
MYSQLDATABASE=railway
```

---

## Bước 2: Import Database Schema

### Option A: Dùng Railway Query Editor (Dễ nhất)

1. Vào Railway → MySQL service
2. Click tab **"Query"**
3. Mở file `database-schema.sql` trong project
4. Copy toàn bộ nội dung
5. Paste vào Query Editor
6. Click **"Run"** hoặc nhấn `Ctrl + Enter`
7. Kiểm tra kết quả: Phải thấy 3 tables được tạo

### Option B: Dùng MySQL Workbench

1. Download MySQL Workbench: https://dev.mysql.com/downloads/workbench/
2. Mở MySQL Workbench
3. Tạo connection mới:
   - Hostname: `containers-us-west-xxx.railway.app`
   - Port: `6543`
   - Username: `root`
   - Password: `xxxxxxxxxx`
4. Click **"Test Connection"**
5. Nếu OK, click **"OK"** để lưu
6. Double-click vào connection
7. File → Open SQL Script → Chọn `database-schema.sql`
8. Click icon ⚡ (Execute) hoặc nhấn `Ctrl + Shift + Enter`

### Option C: Dùng Command Line (MySQL CLI)

```bash
# Kết nối đến Railway MySQL
mysql -h containers-us-west-xxx.railway.app -P 6543 -u root -p

# Nhập password khi được hỏi

# Chọn database
USE railway;

# Import schema
source database-schema.sql;

# Hoặc copy-paste nội dung file vào terminal

# Kiểm tra tables
SHOW TABLES;

# Exit
EXIT;
```

---

## Bước 3: Cấu hình Environment Variables trên Render

1. Vào https://dashboard.render.com
2. Click vào service **"project-mma-1"**
3. Tab **"Environment"**
4. Click **"Add Environment Variable"**
5. Thêm từng biến sau:

```env
NODE_ENV=production

# Database từ Railway
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=6543
DB_USER=root
DB_PASSWORD=xxxxxxxxxxxxxxxxxx
DB_NAME=railway

# JWT Secret (tự tạo - bất kỳ chuỗi ngẫu nhiên nào)
JWT_SECRET=my-super-secret-jwt-key-change-this-in-production

# Email (cho chức năng forgot password - optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

6. Click **"Save Changes"**

---

## Bước 4: Deploy lại Render

1. Render Dashboard → Service "project-mma-1"
2. Click **"Manual Deploy"**
3. Chọn **"Clear build cache & deploy"**
4. Đợi deploy hoàn tất (~2-3 phút)

---

## Bước 5: Kiểm tra kết nối

### Test 1: Health Check

```bash
curl https://project-mma-1.onrender.com/health
```

**Kết quả mong đợi:**
```json
{
  "status": "OK",
  "database": "Connected",
  "environment": "production",
  "timestamp": "2026-02-12T..."
}
```

### Test 2: Register User

```bash
curl -X POST https://project-mma-1.onrender.com/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "username": "Test User",
    "dob": "2000-01-01",
    "gender": "Nam"
  }'
```

**Kết quả mong đợi:**
```json
{
  "message": "Register success",
  "user_id": "uuid-here"
}
```

### Test 3: Login

```bash
curl -X POST https://project-mma-1.onrender.com/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

**Kết quả mong đợi:**
```json
{
  "message": "Login success",
  "token": "jwt-token-here"
}
```

---

## Bước 6: Kiểm tra Database trên Railway

### Dùng Railway Query Editor:

```sql
-- Xem tất cả tables
SHOW TABLES;

-- Xem users
SELECT id, email, display_name, created_at FROM Users;

-- Xem medicines
SELECT * FROM Medicines;

-- Xem schedules
SELECT * FROM Schedules;

-- Đếm số lượng records
SELECT 
  (SELECT COUNT(*) FROM Users) as total_users,
  (SELECT COUNT(*) FROM Medicines) as total_medicines,
  (SELECT COUNT(*) FROM Schedules) as total_schedules;
```

---

## 🎯 Checklist Deploy Database

- [ ] Đã tạo MySQL database trên Railway
- [ ] Đã copy connection details từ Railway
- [ ] Đã import file `database-schema.sql` thành công
- [ ] Đã verify 3 tables được tạo (Users, Medicines, Schedules)
- [ ] Đã thêm environment variables vào Render
- [ ] Đã deploy lại Render với clear cache
- [ ] Test `/health` endpoint → database "Connected"
- [ ] Test register user thành công
- [ ] Test login thành công

---

## 🐛 Troubleshooting

### Lỗi: "Access denied for user"
**Nguyên nhân:** Sai username/password
**Fix:** Copy lại credentials từ Railway Variables

### Lỗi: "Unknown database 'railway'"
**Nguyên nhân:** Database name sai
**Fix:** Kiểm tra `MYSQLDATABASE` trong Railway Variables

### Lỗi: "Table 'Users' doesn't exist"
**Nguyên nhân:** Chưa import schema
**Fix:** Chạy lại file `database-schema.sql`

### Lỗi: "connect ETIMEDOUT"
**Nguyên nhân:** Sai host hoặc port
**Fix:** Kiểm tra lại `MYSQLHOST` và `MYSQLPORT`

### Lỗi: "ER_DUP_ENTRY: Duplicate entry"
**Nguyên nhân:** Email đã tồn tại
**Fix:** Dùng email khác hoặc xóa user cũ

---

## 📊 Monitoring Database

### Xem logs trên Railway:

1. Railway → MySQL service
2. Tab **"Logs"**
3. Xem real-time logs

### Xem metrics:

1. Railway → MySQL service
2. Tab **"Metrics"**
3. Xem CPU, Memory, Disk usage

---

## 💡 Tips

### Backup Database:

```bash
# Export database
mysqldump -h containers-us-west-xxx.railway.app -P 6543 -u root -p railway > backup.sql

# Import backup
mysql -h containers-us-west-xxx.railway.app -P 6543 -u root -p railway < backup.sql
```

### Reset Database:

```sql
-- Xóa tất cả data (giữ structure)
TRUNCATE TABLE Schedules;
TRUNCATE TABLE Medicines;
TRUNCATE TABLE Users;

-- Hoặc drop và tạo lại
DROP TABLE IF EXISTS Schedules;
DROP TABLE IF EXISTS Medicines;
DROP TABLE IF EXISTS Users;

-- Sau đó chạy lại database-schema.sql
```

---

## ✅ Hoàn thành!

Database của bạn đã được deploy thành công lên Railway và kết nối với Render API!

**URL API:** https://project-mma-1.onrender.com
**Swagger UI:** https://project-mma-1.onrender.com/api-docs
