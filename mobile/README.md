Phase 1: Hệ thống Thông báo (Local + Push)
Step 1.1: Tạo Notification Service (mobile)

Tạo mobile/src/services/notificationService.js — tham khảo pattern từ notificationService.js trong Firebase app
Chức năng: requestPermissions(), scheduleLocalNotification(), cancelNotification(), setupNotificationListeners(), getExpoPushToken()
Set Notifications.setNotificationHandler() cho foreground display (banner + sound + vibration)
Step 1.2: Schedule Notification Manager (mobile)

Tạo mobile/src/services/scheduleNotificationManager.js
Khi mở app / thay đổi lịch → fetch tất cả schedule active → schedule local notifications cho 7 ngày tới
Map notification identifiers → schedule IDs trong AsyncStorage để cancel
Hỗ trợ 3 rule types: daily (repeating), every_x_days (one-shot + re-schedule), weekdays (per-day triggers)
Step 1.3: Tích hợp vào App.js

Khi đăng nhập thành công: request permissions → register Expo Push Token → save token lên backend → setup listeners → sync schedules
Step 1.4: Hoàn thiện AlarmScreen (depends on 1.1)

Notification tap → navigate tới AlarmScreen với schedule data
handleTake(): gọi createMedicationLog() + updateStock() trừ tồn kho
handleSnooze(): schedule notification mới sau 10 phút
Step 1.5: Low Stock Notification (depends on 1.1)

Khi mở app + sau mỗi lần uống thuốc → check getLowStockMedicines() → fire one-time local notification cho thuốc mới xuống dưới ngưỡng
Track đã notify trong AsyncStorage tránh spam
Step 1.6: Backend Push Notification (parallel with 1.1-1.5)

Thêm endpoint POST /api/notifications/push-token để lưu Expo Push Token
Tạo DB table push_tokens(id, user_id, expo_push_token, device_id, ...)
Tạo BE/services/pushNotificationService.js — gửi qua Expo Push API
Tạo BE/services/schedulerService.js — cron job (dùng node-cron):
Mỗi phút: check schedules sắp đến → push notification
Mỗi giờ: check low-stock → push notification
Respect quiet hours từ NotificationSettings
Mount notificationRoutes vào BE/index.js (hiện chưa mount)
Step 1.7: Notification API Client (mobile) (parallel with 1.1)

Tạo mobile/src/api/notificationApi.js — savePushToken(), getNotificationSettings(), updateNotificationSettings()
Phase 2: Barcode Scanner + Prescription OCR
Step 2.1: Install Dependencies

expo-camera (với barcode scanning support)
Google Cloud Vision qua REST API (không cần thêm package)
Step 2.2: Barcode Scanner Screen (depends on 2.1)

Tạo mobile/src/screens/BarcodeScannerScreen.js
Camera full-screen với overlay scan area + flash toggle
Scan → query Open Drug API → nếu tìm thấy: pre-fill AddMedicineScreen; nếu không: chỉ điền barcode, user nhập thủ công
Step 2.3: Tích hợp Barcode vào AddMedicineScreen (depends on 2.2)

Thêm nút "Quét mã vạch" ở đầu form
Nhận result từ BarcodeScannerScreen → populate form fields
Thêm field hiển thị barcode (read-only khi scan)
Step 2.4: Prescription Photo Screen (depends on 2.1)

Tạo mobile/src/screens/PrescriptionScanScreen.js
Chụp ảnh / chọn từ gallery → gửi base64 tới Google Cloud Vision API (TEXT_DETECTION) → parse text → hiển thị danh sách thuốc extracted → user review/edit → batch create medicines
Step 2.5: Prescription Text Parser (parallel with 2.4)

Tạo mobile/src/services/prescriptionParser.js
Parse Vietnamese prescription text: regex cho format phổ biến ("Tên thuốc:", "Liều:", viết tắt mg/ml/v...)
Return array { name, dosage, form, stock_quantity, note }
Step 2.6: Tích hợp Navigation (depends on 2.2-2.5)

Thêm "Chụp đơn thuốc" button trên MedicineListScreen
Register BarcodeScannerScreen + PrescriptionScanScreen trong MedicineStack
Relevant Files
Modify:

App.js — notification init, push token, navigation ref
AlarmScreen.js — implement handleTake/handleSnooze
AddMedicineScreen.js — barcode + prescription buttons
MedicineListScreen.js — "Chụp đơn thuốc" button
HomeScreen.js — trigger notification sync
AddScheduleScreen.js — schedule notification on create
BE/index.js — mount notification routes, init scheduler
notificationRoutes.js — add push token endpoint
notificationController.js — push token logic
Create:

mobile/src/services/notificationService.js
mobile/src/services/scheduleNotificationManager.js
mobile/src/api/notificationApi.js
mobile/src/screens/BarcodeScannerScreen.js
mobile/src/screens/PrescriptionScanScreen.js
mobile/src/services/prescriptionParser.js
BE/services/pushNotificationService.js
BE/services/schedulerService.js
Verification
Phase 1 — Notifications:

Tạo schedule với giờ = 1 phút sau → verify notification xuất hiện (foreground + background)
Tap notification → verify AlarmScreen mở với đúng thông tin thuốc
Nhấn "Đã uống" → verify tồn kho bị trừ qua API + medication log tạo
Nhấn "Báo lại" → verify notification mới sau 10 phút
Set stock = threshold → uống thuốc → verify low-stock notification
Test push bằng Expo Push Tool → verify delivery
Start scheduler backend → verify push gửi đúng giờ
Set quiet hours → verify không có notification trong quiet time
Phase 2 — Barcode + OCR:

Scan barcode thuốc → verify camera mở, barcode đọc, form pre-fill
Scan barcode lạ → verify barcode lưu, user tự nhập info
Chụp ảnh đơn thuốc → verify OCR extract text
Parse sample text tiếng Việt → verify trích xuất đúng thuốc
Confirm danh sách extract → verify tất cả thuốc tạo qua API
Decisions
Phase 1 trước Phase 2 theo lựa chọn ưu tiên notification
Local + Push kết hợp: Local cho nhắc giờ (hoạt động offline), Push cho server alerts (low stock, caregiver)
Barcode: Open Drug API (miễn phí), fallback manual entry
OCR: Google Cloud Vision REST API (TEXT_DETECTION)
Schedule 7 ngày: Giới hạn hợp lý với Expo, re-sync khi mở app
Excluded: Firebase Cloud Messaging (app không dùng Firebase), offline OCR, tự xây drug database
Further Considerations
Google Cloud Vision API key: Nên proxy qua backend để giấu key, không expose trên mobile. Recommend: Tạo endpoint POST /api/prescriptions/ocr trên backend.
Barcode VN: Open FDA chỉ có thuốc Mỹ. Thuốc VN nên bắt đầu với "scan barcode + nhập thủ công", sau đó có thể mở rộng với DB thuốc VN. Recommend: Phase đầu lưu barcode, không auto-lookup.
Permission UX: Hiển thị màn hình giải thích trước khi request notification permission. Recommend: Prompt sau khi tạo schedule đầu tiên.