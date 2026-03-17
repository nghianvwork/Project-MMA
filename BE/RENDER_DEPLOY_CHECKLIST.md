# ✅ Checklist Deploy lên Render

## Bước 1: Chuẩn bị code

- [x] Đã tạo file `render.yaml`
- [x] Đã tạo `.gitignore`
- [x] Đã cấu hình auto-detect server URL
- [x] Đã commit và push code lên GitHub

```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

## Bước 2: Tạo MySQL Database trên Render

1. Đăng nhập https://render.com
2. Click **"New +"** → **"PostgreSQL"** hoặc dùng external MySQL
3. Nếu dùng external MySQL (khuyến nghị):
   - Dùng [PlanetScale](https://planetscale.com) (free tier)
   - Hoặc [Railway MySQL](https://railway.app)
   - Hoặc [Aiven MySQL](https://aiven.io)

### Option A: Dùng PlanetScale (Khuyến nghị)

1. Đăng ký https://planetscale.com
2. Tạo database mới: `project_mma`
3. Lấy connection string
4. Chạy các câu lệnh CREATE TABLE

### Option B: Dùng Railway MySQL

1. Đăng ký https://railway.app
2. New Project → Add MySQL
3. Copy connection details
4. Import database schema

## Bước 3: Deploy Web Service lên Render

1. Vào https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository
4. Cấu hình:

### Build Settings
```
Build Command: npm install
Start Command: npm start
```

### Environment Variables

Thêm các biến sau trong Render dashboard:

```
NODE_ENV=production
PORT=3000

# Database (từ PlanetScale hoặc Railway)
DB_HOST=<your-db-host>
DB_PORT=3306
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-password>
DB_NAME=project_mma
JWT_SECRET=<your-long-random-jwt-secret>
```

**Lưu ý:** Render tự động set biến `RENDER_EXTERNAL_URL`, không cần thêm thủ công.

## Bước 4: Deploy

1. Click **"Create Web Service"**
2. Render sẽ tự động:
   - Clone repository
   - Chạy `npm install`
   - Chạy `npm start`
   - Deploy lên URL: `https://your-app-name.onrender.com`

## Bước 5: Kiểm tra

### Test API
```bash
curl https://your-app-name.onrender.com/
```

### Test Swagger UI
Mở trình duyệt:
```
https://your-app-name.onrender.com/api-docs
```

### Test Endpoints
```bash
# Test medicines
curl -H "x-user-id: user123" https://your-app-name.onrender.com/api/medicines

# Test schedules
curl -H "x-user-id: user123" https://your-app-name.onrender.com/api/schedules
```

## Bước 6: Import Database Schema

Nếu chưa import tables, làm theo:

### Với PlanetScale:
1. Vào PlanetScale Console
2. Click "Console" tab
3. Paste và chạy các câu lệnh CREATE TABLE

### Với Railway:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Connect to MySQL
railway connect mysql

# Paste và chạy các câu lệnh CREATE TABLE
```

## 🐛 Troubleshooting

### Lỗi: Cannot connect to database
**Giải pháp:**
- Kiểm tra environment variables trong Render dashboard
- Đảm bảo DB_HOST, DB_USER, DB_PASSWORD đúng
- Kiểm tra database có chạy không

### Lỗi: Swagger UI không hiển thị
**Giải pháp:**
- Xóa cache trình duyệt (Ctrl + Shift + R)
- Kiểm tra logs: Render Dashboard → Logs
- Đảm bảo `swagger.js` không có lỗi syntax

### Lỗi: 502 Bad Gateway
**Giải pháp:**
- Kiểm tra logs trong Render dashboard
- Đảm bảo app đang lắng nghe đúng PORT
- Restart service: Render Dashboard → Manual Deploy → Deploy latest commit

### Lỗi: Module not found
**Giải pháp:**
- Đảm bảo tất cả dependencies trong `package.json`
- Chạy lại build: Render Dashboard → Manual Deploy

## 📊 Monitoring

### Xem Logs
Render Dashboard → Your Service → Logs

### Xem Metrics
Render Dashboard → Your Service → Metrics

### Restart Service
Render Dashboard → Your Service → Manual Deploy → Clear build cache & deploy

## 🔄 Update Code

Mỗi khi push code mới lên GitHub:

```bash
git add .
git commit -m "Update features"
git push origin main
```

Render sẽ tự động detect và deploy lại.

## 💰 Pricing

**Free Tier:**
- 750 hours/month
- Auto-sleep sau 15 phút không hoạt động
- Khởi động lại khi có request (cold start ~30s)

**Paid Tier ($7/month):**
- Không sleep
- Faster builds
- More resources

## 🎉 Hoàn thành!

Swagger UI của bạn sẽ hiển thị tại:
```
https://your-app-name.onrender.com/api-docs
```

Với giao diện đẹp như ảnh bạn muốn! 🎨
