# API Documentation - Lịch Uống Thuốc (Schedules)

## Base URL
```
http://localhost:3000/api/schedules
```

## Authentication
Tất cả các API yêu cầu header:
```
x-user-id: <user_id>
```

---

## Endpoints

### 1. Lấy danh sách lịch uống thuốc
**GET** `/schedules`

**Query Parameters:**
- `medicine_id` (optional): Lọc theo ID thuốc
- `date` (optional): Lọc lịch còn hiệu lực tại ngày này (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": "user123",
      "medicine_id": 1,
      "medicine_name": "Paracetamol",
      "dosage": "500mg",
      "form": "Viên nén",
      "start_date": "2024-01-15",
      "end_date": "2024-02-15",
      "time_of_day": "08:00:00",
      "rule_type": "daily",
      "interval_days": null,
      "weekdays": null,
      "dose_amount": 1,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 2. Lấy chi tiết một lịch
**GET** `/schedules/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "user123",
    "medicine_id": 1,
    "medicine_name": "Paracetamol",
    "dosage": "500mg",
    "form": "Viên nén",
    "start_date": "2024-01-15",
    "end_date": "2024-02-15",
    "time_of_day": "08:00:00",
    "rule_type": "daily",
    "interval_days": null,
    "weekdays": null,
    "dose_amount": 1,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 3. Tạo lịch uống thuốc (Thêm thuốc vào lịch)
**POST** `/schedules`

**Request Body:**

#### Ví dụ 1: Uống hàng ngày
```json
{
  "medicine_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-02-15",
  "time_of_day": "08:00:00",
  "rule_type": "daily",
  "dose_amount": 1
}
```

#### Ví dụ 2: Uống mỗi X ngày (ví dụ: 3 ngày/lần)
```json
{
  "medicine_id": 2,
  "start_date": "2024-01-15",
  "end_date": "2024-03-15",
  "time_of_day": "20:00:00",
  "rule_type": "every_x_days",
  "interval_days": 3,
  "dose_amount": 2
}
```

#### Ví dụ 3: Uống theo ngày trong tuần (Thứ 2, 4, 6)
```json
{
  "medicine_id": 3,
  "start_date": "2024-01-15",
  "time_of_day": "09:00:00",
  "rule_type": "weekdays",
  "weekdays": "1,3,5",
  "dose_amount": 1
}
```

**Giải thích weekdays:**
- 0 = Chủ nhật
- 1 = Thứ 2
- 2 = Thứ 3
- 3 = Thứ 4
- 4 = Thứ 5
- 5 = Thứ 6
- 6 = Thứ 7

**Required Fields:**
- `medicine_id`: ID thuốc (bắt buộc)
- `start_date`: Ngày bắt đầu (YYYY-MM-DD)
- `time_of_day`: Giờ uống (HH:MM:SS)
- `rule_type`: Loại lịch (daily, every_x_days, weekdays)

**Optional Fields:**
- `end_date`: Ngày kết thúc (null = không giới hạn)
- `interval_days`: Số ngày giữa các lần uống (bắt buộc nếu rule_type = every_x_days)
- `weekdays`: Các ngày trong tuần (bắt buộc nếu rule_type = weekdays)
- `dose_amount`: Số lượng mỗi lần uống (mặc định = 1)

**Response:**
```json
{
  "success": true,
  "message": "Tạo lịch uống thuốc thành công",
  "data": {
    "id": 1,
    "user_id": "user123",
    "medicine_id": 1,
    "medicine_name": "Paracetamol",
    ...
  }
}
```

---

### 4. Cập nhật lịch uống thuốc
**PUT** `/schedules/:id`

**Request Body:**
```json
{
  "medicine_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-03-15",
  "time_of_day": "09:00:00",
  "rule_type": "daily",
  "dose_amount": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cập nhật lịch thành công",
  "data": {
    "id": 1,
    ...
  }
}
```

---

### 5. Xóa lịch uống thuốc
**DELETE** `/schedules/:id`

**Response:**
```json
{
  "success": true,
  "message": "Xóa lịch thành công"
}
```

---

### 6. Lấy lịch uống thuốc theo ngày cụ thể
**GET** `/schedules/date/:date`

**Ví dụ:** `/schedules/date/2024-01-20`

**Response:**
```json
{
  "success": true,
  "date": "2024-01-20",
  "data": [
    {
      "id": 1,
      "medicine_name": "Paracetamol",
      "time_of_day": "08:00:00",
      "dose_amount": 1,
      "stock_quantity": 20,
      ...
    },
    {
      "id": 2,
      "medicine_name": "Vitamin C",
      "time_of_day": "12:00:00",
      "dose_amount": 1,
      ...
    }
  ],
  "total": 2
}
```

**Note:** API này tự động tính toán và lọc các lịch theo rule_type

---

## Các loại Rule Type

### 1. daily (Hàng ngày)
Uống thuốc mỗi ngày vào giờ cố định
```json
{
  "rule_type": "daily"
}
```

### 2. every_x_days (Mỗi X ngày)
Uống thuốc mỗi X ngày một lần
```json
{
  "rule_type": "every_x_days",
  "interval_days": 3
}
```

### 3. weekdays (Theo ngày trong tuần)
Uống thuốc vào các ngày cụ thể trong tuần
```json
{
  "rule_type": "weekdays",
  "weekdays": "1,3,5"
}
```

---

## Ví dụ Use Cases

### Use Case 1: Uống thuốc kháng sinh 7 ngày
```json
{
  "medicine_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-21",
  "time_of_day": "08:00:00",
  "rule_type": "daily",
  "dose_amount": 1
}
```

### Use Case 2: Uống vitamin hàng ngày không giới hạn
```json
{
  "medicine_id": 2,
  "start_date": "2024-01-15",
  "time_of_day": "09:00:00",
  "rule_type": "daily",
  "dose_amount": 1
}
```

### Use Case 3: Uống thuốc 3 lần/ngày
Tạo 3 lịch riêng biệt:
```json
// Sáng
{
  "medicine_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-21",
  "time_of_day": "08:00:00",
  "rule_type": "daily",
  "dose_amount": 1
}

// Trưa
{
  "medicine_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-21",
  "time_of_day": "12:00:00",
  "rule_type": "daily",
  "dose_amount": 1
}

// Tối
{
  "medicine_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-21",
  "time_of_day": "20:00:00",
  "rule_type": "daily",
  "dose_amount": 1
}
```

### Use Case 4: Uống thuốc thứ 2, 4, 6 hàng tuần
```json
{
  "medicine_id": 3,
  "start_date": "2024-01-15",
  "time_of_day": "09:00:00",
  "rule_type": "weekdays",
  "weekdays": "1,3,5",
  "dose_amount": 1
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "medicine_id không được để trống"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Không tìm thấy thuốc hoặc bạn không có quyền"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Lỗi server",
  "error": "Error details..."
}
```
