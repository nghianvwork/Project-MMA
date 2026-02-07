# API Documentation - Tủ Thuốc (Medicine Cabinet)

## Base URL
```
http://localhost:3000/api
```

## Authentication
Tất cả các API yêu cầu header:
```
x-user-id: <user_id>
```

---

## Endpoints

### 1. Lấy danh sách thuốc
**GET** `/medicines`

**Query Parameters:**
- `search` (optional): Tìm kiếm theo tên thuốc
- `sortBy` (optional): Sắp xếp theo field (name, created_at, stock_quantity)
- `order` (optional): ASC hoặc DESC

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": "user123",
      "name": "Paracetamol",
      "barcode": "8934567890123",
      "dosage": "500mg",
      "form": "Viên nén",
      "note": "Uống sau ăn",
      "stock_quantity": 20,
      "stock_unit": "viên",
      "low_stock_threshold": 5,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 2. Lấy chi tiết một thuốc
**GET** `/medicines/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "user123",
    "name": "Paracetamol",
    "barcode": "8934567890123",
    "dosage": "500mg",
    "form": "Viên nén",
    "note": "Uống sau ăn",
    "stock_quantity": 20,
    "stock_unit": "viên",
    "low_stock_threshold": 5,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 3. Thêm thuốc mới
**POST** `/medicines`

**Request Body:**
```json
{
  "name": "Paracetamol",
  "barcode": "8934567890123",
  "dosage": "500mg",
  "form": "Viên nén",
  "note": "Uống sau ăn",
  "stock_quantity": 20,
  "stock_unit": "viên",
  "low_stock_threshold": 5
}
```

**Required Fields:**
- `name`: Tên thuốc (bắt buộc)

**Response:**
```json
{
  "success": true,
  "message": "Thêm thuốc thành công",
  "data": {
    "id": 1,
    "user_id": "user123",
    "name": "Paracetamol",
    ...
  }
}
```

---

### 4. Cập nhật thông tin thuốc
**PUT** `/medicines/:id`

**Request Body:**
```json
{
  "name": "Paracetamol 500mg",
  "barcode": "8934567890123",
  "dosage": "500mg",
  "form": "Viên nén",
  "note": "Uống sau ăn 30 phút",
  "stock_quantity": 15,
  "stock_unit": "viên",
  "low_stock_threshold": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cập nhật thuốc thành công",
  "data": {
    "id": 1,
    ...
  }
}
```

---

### 5. Cập nhật số lượng tồn kho
**PATCH** `/medicines/:id/stock`

**Request Body:**
```json
{
  "stock_quantity": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cập nhật tồn kho thành công",
  "data": {
    "id": 1,
    "stock_quantity": 10,
    ...
  }
}
```

---

### 6. Xóa thuốc
**DELETE** `/medicines/:id`

**Response:**
```json
{
  "success": true,
  "message": "Xóa thuốc thành công"
}
```

**Note:** Không thể xóa thuốc đang có lịch uống

---

### 7. Lấy danh sách thuốc sắp hết
**GET** `/medicines/low-stock`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Paracetamol",
      "stock_quantity": 3,
      "low_stock_threshold": 5,
      ...
    }
  ],
  "total": 1
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Tên thuốc không được để trống"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Thiếu thông tin xác thực. Vui lòng đăng nhập."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Không tìm thấy thuốc"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Lỗi server khi lấy danh sách thuốc",
  "error": "Error details..."
}
```

---

## Ví dụ sử dụng với cURL

### Lấy danh sách thuốc
```bash
curl -X GET http://localhost:3000/api/medicines \
  -H "x-user-id: user123"
```

### Thêm thuốc mới
```bash
curl -X POST http://localhost:3000/api/medicines \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "name": "Paracetamol",
    "dosage": "500mg",
    "stock_quantity": 20
  }'
```

### Cập nhật thuốc
```bash
curl -X PUT http://localhost:3000/api/medicines/1 \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "name": "Paracetamol 500mg",
    "stock_quantity": 15
  }'
```

### Xóa thuốc
```bash
curl -X DELETE http://localhost:3000/api/medicines/1 \
  -H "x-user-id: user123"
```
