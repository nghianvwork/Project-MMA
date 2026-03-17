# Medicine Management API 💊

API quản lý tủ thuốc và lịch uống thuốc cho ứng dụng mobile.

## 🚀 Tính năng

### Quản lý Tủ Thuốc
- ✅ Thêm, sửa, xóa thuốc
- ✅ Quản lý tồn kho
- ✅ Cảnh báo thuốc sắp hết
- ✅ Tìm kiếm và sắp xếp

### Quản lý Lịch Uống Thuốc
- ✅ Tạo lịch uống thuốc
- ✅ Hỗ trợ 3 loại lịch:
  - Hàng ngày (daily)
  - Mỗi X ngày (every_x_days)
  - Theo ngày trong tuần (weekdays)
- ✅ Xem lịch theo ngày cụ thể

## 📦 Cài đặt

```bash
# Clone repository
git clone <repository-url>

# Cài đặt dependencies
npm install

# Cấu hình database
cp .env.example .env
# Chỉnh sửa file .env với thông tin database của bạn

# Chạy server
npm start
```

## 🗄️ Database

Sử dụng MySQL. Import các bảng sau:
- Users
- Medicines
- Schedules
- Medication_Logs
- Prescriptions
- Caregivers
- Notifications
- Pharmacies

## 📚 API Documentation

Sau khi chạy server, truy cập:

**Swagger UI:** http://localhost:3000/api-docs

## 🔑 Authentication

Tất cả API yêu cầu header:
```
x-user-id: <user_id>
```

## 📖 Endpoints

### Medicines (Tủ thuốc)
- `GET /api/medicines` - Lấy danh sách thuốc
- `GET /api/medicines/:id` - Chi tiết thuốc
- `POST /api/medicines` - Thêm thuốc mới
- `PUT /api/medicines/:id` - Cập nhật thuốc
- `PATCH /api/medicines/:id/stock` - Cập nhật tồn kho
- `DELETE /api/medicines/:id` - Xóa thuốc
- `GET /api/medicines/low-stock` - Thuốc sắp hết

### Schedules (Lịch uống thuốc)
- `GET /api/schedules` - Lấy danh sách lịch
- `GET /api/schedules/:id` - Chi tiết lịch
- `POST /api/schedules` - Tạo lịch mới
- `PUT /api/schedules/:id` - Cập nhật lịch
- `DELETE /api/schedules/:id` - Xóa lịch
- `GET /api/schedules/date/:date` - Lịch theo ngày

## 🧪 Testing

### Sử dụng REST Client (VS Code)
Mở file `test-api.http` hoặc `test-schedule-api.http`

### Sử dụng cURL
```bash
bash test-with-curl.sh
```

### Test kết nối database
```bash
npm run test-db
```

## 🌐 Deploy

### Cấu hình môi trường production

1. Cập nhật file `.env`:
```env
NODE_ENV=production
PORT=3000
DB_HOST=your-production-host
DB_USER=your-production-user
DB_PASSWORD=your-production-password
DB_NAME=your-production-database
JWT_SECRET=your-long-random-jwt-secret
```

2. Chạy server:
```bash
npm start
```

### Deploy lên các nền tảng

#### Heroku
```bash
heroku create your-app-name
git push heroku main
```

#### Railway
```bash
railway login
railway init
railway up
```

#### Render
1. Kết nối repository
2. Cấu hình environment variables
3. Deploy

## 📝 Ví dụ sử dụng

### Thêm thuốc
```bash
curl -X POST http://localhost:3000/api/medicines \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "name": "Paracetamol",
    "barcode": "8934567890123",
    "dosage": "500mg",
    "stock_quantity": 20
  }'
```

### Tạo lịch uống thuốc hàng ngày
```bash
curl -X POST http://localhost:3000/api/schedules \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "medicine_id": 1,
    "start_date": "2024-02-07",
    "end_date": "2024-02-14",
    "time_of_day": "08:00:00",
    "rule_type": "daily",
    "dose_amount": 1
  }'
```

## 🛠️ Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **MySQL** - Database
- **Swagger UI** - API documentation
- **dotenv** - Environment variables

## 📄 License

MIT

## 👥 Contributors

- Your Name

## 📞 Support

Email: support@example.com
