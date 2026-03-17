# 🐛 Debug Lỗi 500 trên Render

## Nguyên nhân phổ biến

### 1. ❌ Lỗi kết nối Database (Phổ biến nhất)
- Environment variables chưa được set đúng
- Database host không accessible từ Render
- Database credentials sai

### 2. ❌ Module không tìm thấy
- Dependencies chưa được cài đặt đầy đủ
- Import path sai

### 3. ❌ Environment variables thiếu
- Thiếu biến DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET

---

## 🔍 Cách Debug

### Bước 1: Xem Logs trên Render

1. Vào Render Dashboard
2. Click vào service của bạn
3. Click tab **"Logs"**
4. Tìm dòng lỗi màu đỏ

**Ví dụ lỗi thường gặp:**
```
Error: connect ETIMEDOUT
Error: Access denied for user
Error: Cannot find module
Error: ER_ACCESS_DENIED_ERROR
```

### Bước 2: Kiểm tra Environment Variables

Vào Render Dashboard → Your Service → **Environment**

Đảm bảo có đủ các biến:
```
NODE_ENV=production
PORT=3000
DB_HOST=<your-database-host>
DB_PORT=3306
DB_USER=<your-database-user>
DB_PASSWORD=<your-database-password>
DB_NAME=project_mma
JWT_SECRET=<your-long-random-jwt-secret>
```

**⚠️ LỖI THƯỜNG GẶP:**
- Thiếu biến DB_HOST
- DB_PASSWORD có ký tự đặc biệt chưa được escape
- DB_NAME sai tên

---

## 🔧 Giải pháp theo từng lỗi

### Lỗi 1: Cannot connect to database

**Triệu chứng:**
```
Error: connect ETIMEDOUT
Error: connect ECONNREFUSED
```

**Giải pháp:**

#### Option A: Dùng Railway MySQL (Khuyến nghị)

1. Đăng ký https://railway.app
2. New Project → Add MySQL
3. Copy connection details:
   ```
   MYSQL_HOST=containers-us-west-xxx.railway.app
   MYSQL_PORT=6543
   MYSQL_USER=root
   MYSQL_PASSWORD=xxx
   MYSQL_DATABASE=railway
   ```
4. Paste vào Render Environment Variables:
   ```
   DB_HOST=containers-us-west-xxx.railway.app
   DB_PORT=6543
   DB_USER=root
   DB_PASSWORD=xxx
   DB_NAME=railway
   ```

#### Option B: Dùng PlanetScale

1. Đăng ký https://planetscale.com
2. Tạo database mới
3. Get connection string
4. Update Render environment variables

#### Option C: Dùng Aiven MySQL (Free)

1. Đăng ký https://aiven.io
2. Create MySQL service
3. Copy connection details
4. Update Render environment variables

### Lỗi 2: Access denied for user

**Triệu chứng:**
```
Error: ER_ACCESS_DENIED_ERROR: Access denied for user 'xxx'@'xxx'
```

**Giải pháp:**
- Kiểm tra lại DB_USER và DB_PASSWORD
- Đảm bảo user có quyền truy cập từ external IP
- Nếu dùng Railway/PlanetScale, copy lại credentials mới

### Lỗi 3: Unknown database

**Triệu chứng:**
```
Error: ER_BAD_DB_ERROR: Unknown database 'project_mma'
```

**Giải pháp:**
1. Tạo database trên MySQL server
2. Hoặc đổi DB_NAME thành tên database có sẵn (ví dụ: `railway`)

### Lỗi 4: Module not found

**Triệu chứng:**
```
Error: Cannot find module './utils/getServerUrl'
```

**Giải pháp:**
- Đảm bảo file `utils/getServerUrl.js` đã được commit
- Chạy lại build với clear cache

---

## 🧪 Test từng bước

### Test 1: Kiểm tra server có chạy không

```bash
curl https://your-app-name.onrender.com/
```

**Kết quả mong đợi:**
```json
{
  "message": "Medicine Management API 💊",
  "version": "1.0.0",
  ...
}
```

### Test 2: Kiểm tra database connection

Thêm endpoint test vào `index.js`:

```javascript
app.get('/health', async (req, res) => {
  try {
    const db = require('./config/database');
    await db.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'Disconnected',
      error: error.message 
    });
  }
});
```

Sau đó test:
```bash
curl https://your-app-name.onrender.com/health
```

### Test 3: Test API với authentication

```bash
curl -H "x-user-id: user123" https://your-app-name.onrender.com/api/medicines
```

---

## 📝 Checklist Debug

- [ ] Đã xem logs trên Render Dashboard
- [ ] Đã kiểm tra tất cả environment variables
- [ ] Database đã được tạo và accessible
- [ ] Đã import schema (CREATE TABLE)
- [ ] Đã test endpoint /health
- [ ] Đã clear build cache và deploy lại
- [ ] Đã xóa cache trình duyệt

---

## 🚀 Quick Fix

Nếu vẫn lỗi, làm theo các bước sau:

### 1. Tạo MySQL trên Railway (Nhanh nhất)

```bash
# Đăng ký Railway
# Tạo project mới
# Add MySQL
# Copy connection details
```

### 2. Update Environment Variables trên Render

```
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=6543
DB_USER=root
DB_PASSWORD=<from-railway>
DB_NAME=railway
```

### 3. Import Database Schema

Vào Railway → MySQL → Query

Paste và chạy:
```sql
CREATE TABLE Users (...);
CREATE TABLE Medicines (...);
CREATE TABLE Schedules (...);
-- ... các tables khác
```

### 4. Deploy lại trên Render

Render Dashboard → Manual Deploy → Clear build cache & deploy

### 5. Test

```bash
curl https://your-app-name.onrender.com/health
```

---

## 💡 Tips

### Tip 1: Dùng Railway cho cả API và Database
- Deploy API trên Railway luôn
- Tự động có database
- Không cần config phức tạp

### Tip 2: Thêm logging
Trong `config/database.js`:
```javascript
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('DB_HOST:', process.env.DB_HOST);
    console.error('DB_USER:', process.env.DB_USER);
    console.error('DB_NAME:', process.env.DB_NAME);
    return;
  }
  console.log('✅ Database connected successfully!');
  connection.release();
});
```

### Tip 3: Test local trước
```bash
# Set environment variables giống production
export DB_HOST=xxx
export DB_USER=xxx
export DB_PASSWORD=xxx
export DB_NAME=xxx

# Test
npm start
```

---

## 📞 Cần giúp thêm?

Gửi cho tôi:
1. Screenshot logs từ Render Dashboard
2. Environment variables (ẩn password)
3. Error message cụ thể

Tôi sẽ giúp debug!
