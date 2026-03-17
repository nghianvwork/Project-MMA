# ⚡ Quick Fix Lỗi 500 trên Render

## Bước 1: Xem Logs (QUAN TRỌNG NHẤT)

1. Vào https://dashboard.render.com
2. Click vào service của bạn
3. Click tab **"Logs"**
4. Scroll xuống tìm dòng lỗi màu đỏ

**Copy dòng lỗi và gửi cho tôi nếu cần giúp!**

---

## Bước 2: Kiểm tra Environment Variables

Vào Render Dashboard → Your Service → **Environment**

### ✅ Phải có đủ các biến này:

```
NODE_ENV=production
DB_HOST=<your-database-host>
DB_PORT=3306
DB_USER=<your-database-user>
DB_PASSWORD=<your-database-password>
DB_NAME=<your-database-name>
JWT_SECRET=<your-long-random-jwt-secret>
```

### ❌ Nếu thiếu → Thêm vào và Save Changes

---

## Bước 3: Test Health Check

Mở trình duyệt hoặc dùng curl:

```bash
curl https://your-app-name.onrender.com/health
```

### Kết quả tốt:
```json
{
  "status": "OK",
  "database": "Connected",
  "environment": "production"
}
```

### Kết quả xấu:
```json
{
  "status": "ERROR",
  "database": "Disconnected",
  "error": "connect ETIMEDOUT"
}
```

→ **Nếu lỗi database, đọc tiếp Bước 4**

---

## Bước 4: Fix Database Connection

### Option A: Dùng Railway MySQL (Khuyến nghị - 5 phút)

1. **Đăng ký Railway**: https://railway.app
2. **New Project** → **Add MySQL**
3. **Copy connection details**:
   - Click vào MySQL service
   - Tab "Connect"
   - Copy các giá trị:
     ```
     MYSQL_HOST=containers-us-west-xxx.railway.app
     MYSQL_PORT=6543
     MYSQL_USER=root
     MYSQL_PASSWORD=xxx
     MYSQL_DATABASE=railway
     ```

4. **Paste vào Render Environment**:
   ```
   DB_HOST=containers-us-west-xxx.railway.app
   DB_PORT=6543
   DB_USER=root
   DB_PASSWORD=xxx
   DB_NAME=railway
   ```

5. **Save Changes** → Render sẽ tự động deploy lại

6. **Import Database Schema**:
   - Vào Railway → MySQL → Query
   - Paste các câu lệnh CREATE TABLE
   - Execute

### Option B: Dùng PlanetScale (Free)

1. Đăng ký https://planetscale.com
2. Create new database
3. Get connection string
4. Update Render environment variables

### Option C: Dùng Aiven MySQL (Free)

1. Đăng ký https://aiven.io
2. Create MySQL service
3. Copy connection details
4. Update Render environment variables

---

## Bước 5: Deploy lại

Sau khi update environment variables:

1. Render Dashboard → Your Service
2. Click **"Manual Deploy"**
3. Select **"Clear build cache & deploy"**
4. Đợi deploy xong (~2-3 phút)

---

## Bước 6: Test lại

```bash
# Test health
curl https://your-app-name.onrender.com/health

# Test API
curl -H "x-user-id: user123" https://your-app-name.onrender.com/api/medicines
```

---

## 🎯 Các lỗi thường gặp và fix nhanh

### Lỗi: "connect ETIMEDOUT"
**Nguyên nhân:** Database không accessible từ Render
**Fix:** Dùng Railway MySQL (Option A ở trên)

### Lỗi: "Access denied for user"
**Nguyên nhân:** DB_USER hoặc DB_PASSWORD sai
**Fix:** Copy lại credentials từ database provider

### Lỗi: "Unknown database"
**Nguyên nhân:** DB_NAME không tồn tại
**Fix:** Tạo database hoặc đổi DB_NAME thành tên có sẵn

### Lỗi: "Cannot find module"
**Nguyên nhân:** File chưa được commit
**Fix:** 
```bash
git add .
git commit -m "Add missing files"
git push origin main
```

### Lỗi: "Port already in use"
**Nguyên nhân:** Không xảy ra trên Render
**Fix:** Không cần fix

---

## 📊 Kiểm tra nhanh

Chạy các lệnh này để kiểm tra:

```bash
# 1. Test server
curl https://your-app-name.onrender.com/

# 2. Test health
curl https://your-app-name.onrender.com/health

# 3. Test Swagger UI
# Mở trình duyệt: https://your-app-name.onrender.com/api-docs

# 4. Test API
curl -H "x-user-id: user123" https://your-app-name.onrender.com/api/medicines
```

---

## 🆘 Vẫn lỗi?

Gửi cho tôi:

1. **Screenshot logs** từ Render Dashboard
2. **Error message** cụ thể
3. **Environment variables** (ẩn password)

Ví dụ:
```
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=6543
DB_USER=root
DB_PASSWORD=***hidden***
DB_NAME=railway
```

Tôi sẽ giúp debug ngay!

---

## ✅ Checklist

- [ ] Đã xem logs trên Render
- [ ] Đã kiểm tra environment variables
- [ ] Đã test /health endpoint
- [ ] Database đã được tạo
- [ ] Đã import schema (CREATE TABLE)
- [ ] Đã deploy lại với clear cache
- [ ] Đã test API endpoints

---

## 💡 Pro Tip

**Dùng Railway cho cả API và Database:**
- Deploy API trên Railway thay vì Render
- Tự động có MySQL
- Không