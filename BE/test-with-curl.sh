#!/bin/bash

# Script test API bằng cURL
BASE_URL="http://localhost:3000/api"
USER_ID="user123"

echo "=== TEST API TỦ THUỐC ==="
echo ""

# 1. Thêm thuốc mới
echo "1. Thêm thuốc Paracetamol..."
curl -X POST "$BASE_URL/medicines" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "name": "Paracetamol",
    "barcode": "8934567890123",
    "dosage": "500mg",
    "form": "Viên nén",
    "note": "Uống sau ăn 30 phút",
    "stock_quantity": 20,
    "stock_unit": "viên",
    "low_stock_threshold": 5
  }'
echo -e "\n"

# 2. Thêm thuốc Amoxicillin
echo "2. Thêm thuốc Amoxicillin..."
curl -X POST "$BASE_URL/medicines" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "name": "Amoxicillin",
    "dosage": "250mg",
    "form": "Viên nang",
    "note": "Kháng sinh",
    "stock_quantity": 30,
    "stock_unit": "viên",
    "low_stock_threshold": 10
  }'
echo -e "\n"

# 3. Lấy danh sách thuốc
echo "3. Lấy danh sách thuốc..."
curl -X GET "$BASE_URL/medicines" \
  -H "x-user-id: $USER_ID"
echo -e "\n"

# 4. Tìm kiếm thuốc
echo "4. Tìm kiếm thuốc có chữ 'para'..."
curl -X GET "$BASE_URL/medicines?search=para" \
  -H "x-user-id: $USER_ID"
echo -e "\n"

# 5. Lấy danh sách thuốc sắp hết
echo "5. Lấy danh sách thuốc sắp hết..."
curl -X GET "$BASE_URL/medicines/low-stock" \
  -H "x-user-id: $USER_ID"
echo -e "\n"

echo "=== HOÀN THÀNH ==="
