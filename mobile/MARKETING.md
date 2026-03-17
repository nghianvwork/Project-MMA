# Bản Marketing Dự Án - Ứng Dụng Nhắc Uống Thuốc Thông Minh

## 1. Tổng quan dự án
Ứng dụng nhắc uống thuốc thông minh là giải pháp mobile giúp người dùng quản lý thuốc, theo dõi lịch uống, kiểm soát tồn kho và bảo vệ sức khỏe cá nhân theo cách chủ động, dễ dùng, dễ mở rộng.

Dự án được xây dựng trên React Native + Expo, tối ưu cho trải nghiệm thực tế: nhắc đúng giờ, thao tác nhanh, giao diện thân thiện với người dùng mới và phù hợp cho cả gia đình.

## 2. Giá trị nổi bật (Value Proposition)
- Nhắc đúng giờ, giảm quên liều: hệ thống thông báo đa kênh (local + push) giúp người dùng duy trì thói quen điều trị.
- Quản lý thuốc toàn diện: từ thêm thuốc, cập nhật tồn kho đến cảnh báo sắp hết thuốc.
- Tiết kiệm thời gian nhập liệu: quét mã vạch, AI gợi ý thông tin thuốc, giảm thao tác thủ công.
- Hỗ trợ chăm sóc gia đình: liên kết hồ sơ người thân và phân quyền theo dõi.
- Tập trung vào người Việt: giao diện, thông điệp và quy trình sử dụng tối ưu cho ngữ cảnh Việt Nam.

## 3. Đầy đủ tính năng hiện có

### 3.1. Hệ thống tài khoản và bảo mật
- Đăng ký tài khoản với đầy đủ thông tin cá nhân (họ tên, email, ngày sinh, giới tính, chiều cao, cân nặng).
- Đăng nhập bằng email/mật khẩu.
- Đăng nhập Google (OAuth) để tối ưu trải nghiệm vào app nhanh.
- Quên mật khẩu theo quy trình an toàn:
  - Gửi OTP 6 số qua email.
  - Xác thực OTP.
  - Đặt lại mật khẩu mới.
  - Màn hình xác nhận đổi mật khẩu thành công.

### 3.2. Trang chủ thông minh
- Dashboard tổng quan ngày hiện tại:
  - Số lượng thuốc cần uống.
  - Thuốc sắp hết.
  - Thuốc tiếp theo sắp đến giờ.
- Hiển thị lời chào theo khung giờ (sáng/chiều/tối).
- Quick actions đến nhanh Lịch uống thuốc và Kho thuốc.
- Hỗ trợ pull-to-refresh cập nhật dữ liệu real-time.

### 3.3. Quản lý kho thuốc
- Thêm mới, cập nhật, xóa thuốc.
- Trường dữ liệu đầy đủ: tên thuốc, mã vạch, liều dùng, dạng thuốc, ghi chú, tồn kho, đơn vị, ngưỡng cảnh báo.
- Tìm kiếm thuốc nhanh theo từ khóa.
- Lọc thông minh theo 3 nhóm:
  - Tất cả.
  - Sắp hết.
  - Hết hàng.
- Hiển thị trạng thái rỗng để hướng dẫn người dùng khi chưa có dữ liệu.

### 3.4. Quét mã vạch + AI hỗ trợ nhập thuốc
- Quét mã vạch bằng camera, có khung căn giữa để quét nhanh.
- Hỗ trợ bật/tắt đèn flash khi quét.
- Tra cứu thuốc theo mã vạch:
  - Ưu tiên đối chiếu dữ liệu OpenFDA.
  - Fallback bằng Gemini AI khi dữ liệu không có sẵn.
- Tự động điền sẵn thông tin thuốc vào form thêm thuốc.
- Khóa trường mã vạch khi dữ liệu đến từ scan để tránh sai lệch.
- Hỗ trợ tiếp tục nhập thủ công nếu không tra cứu được.

### 3.5. Lịch uống thuốc linh hoạt
- Tạo lịch uống thuốc mới.
- Hiển thị lịch theo ngày và nhóm theo khung giờ (sáng/chiều/tối).
- Các trạng thái sử dụng:
  - Pending.
  - Đã uống.
  - Báo lại.
- Đánh dấu đã uống:
  - Ghi log lịch sử uống thuốc.
  - Tự động trừ tồn kho.
  - Hủy thông báo tương ứng.
- Báo lại sau 10 phút (snooze) cho mỗi lần nhỡ.

### 3.6. Hệ thống thông báo nâng cao
- Local notification trên thiết bị cho lịch nhắc thuốc.
- Push token registration/de-registration với backend.
- Lưu và quản lý token theo người dùng/thiết bị.
- Tự động đồng bộ lại lịch thông báo khi:
  - Đăng nhập.
  - Mở app.
  - Thay đổi cài đặt thông báo.
- Hỗ trợ cài đặt chi tiết:
  - Bật/tắt nhắc uống thuốc.
  - Bật/tắt âm báo.
  - Bật/tắt rung.
  - Bật/tắt cảnh báo sắp hết thuốc.
  - Bật/tắt thông báo gia đình.
  - Bật/tắt thông báo hệ thống.
  - Giờ yên lặng (quiet hours).
- Công cụ test thông báo nhanh ngay trong app (test 10 giây, đồng bộ lại nhắc nhở).

### 3.7. Cảnh báo sắp hết thuốc
- Tự động phát hiện thuốc dưới ngưỡng tồn kho.
- Gửi thông báo cảnh báo ngay trên thiết bị.
- Có cơ chế tránh spam thông báo lặp cho cùng một thuốc trong ngày.

### 3.8. Alarm screen chuyên biệt
- Màn hình báo thức khi đến giờ uống thuốc.
- Hiệu ứng trực quan để người dùng dễ chú ý.
- 2 hành động nhanh:
  - Đã uống.
  - Báo lại 10 phút.

### 3.9. Hồ sơ sức khỏe cá nhân
- Hiển thị BMI + phân loại tình trạng BMI.
- Hiển thị chiều cao, cân nặng.
- Quản lý bệnh lý nền.
- Quản lý dị ứng.
- Quản lý tiền sử phẫu thuật.
- Cung cấp màn hình cập nhật dữ liệu y tế theo danh mục.

### 3.10. Hồ sơ người thân
- Thêm người thân bằng email.
- Chọn mối quan hệ (Bố/Mẹ/Con/Khác).
- Gán quyền truy cập (chỉ xem/chỉnh sửa).
- Xem thông tin người thân và chuyển đổi ngữ cảnh theo dõi.
- Đặt nền tảng cho mô hình chăm sóc gia đình.

### 3.11. Lịch sử uống thuốc và thống kê tuân thủ
- Lọc lịch sử theo khoảng thời gian:
  - Hôm nay.
  - Tuần này.
  - Tháng này.
- Hiển thị tỷ lệ tuân thủ (% adherence).
- Hiển thị chi tiết từng lần uống:
  - Giờ dự kiến.
  - Giờ đã uống.
  - Trạng thái (đúng giờ, trễ, bỏ lỡ, tạm hoãn).

### 3.12. Chụp ảnh tìm thuốc và mô tả thuốc (mở rộng)
- Chụp ảnh vỉ thuốc/hộp thuốc bằng camera hoặc chọn ảnh từ thư viện.
- AI nhận diện tên thuốc, hoạt chất, dạng bào chế và hàm lượng từ hình ảnh.
- Trả về mô tả thuốc ngắn gọn, dễ hiểu:
  - Công dụng chính.
  - Cách dùng tham khảo.
  - Lưu ý an toàn phổ biến.
  - Cảnh báo khi dùng sai liều.
- Cho phép người dùng xác nhận lại trước khi lưu vào kho thuốc.
- Kết hợp với dữ liệu mã vạch và dữ liệu có sẵn để tăng độ chính xác nhận diện.

## 4. Đối tượng khách hàng mục tiêu
- Người dùng cần uống thuốc định kỳ (bệnh mạn tính, bổ sung, điều trị dài hạn).
- Người cao tuổi cần bộ nhớ thông báo để đúng liều.
- Người thân/chăm sóc viên cần theo dõi từ xa.
- Người bận rộn cần một hệ thống gọn nhẹ, dễ dùng, không bỏ sót liều.

## 5. Lợi ích kinh doanh và xã hội
- Tăng mức độ tuân thủ điều trị, góp phần nâng cao hiệu quả chăm sóc sức khỏe.
- Giảm rủi ro quên thuốc, dùng sai giờ, bỏ liều.
- Giảm gánh nặng theo dõi cho gia đình có người bệnh.
- Có khả năng mở rộng thành nền tảng HealthTech phục vụ nhiều nhóm bệnh.

## 6. Điểm khác biệt cạnh tranh
- Tích hợp quét mã vạch + AI để tối ưu nhập liệu (không chỉ là app nhắc giờ đơn thuần).
- Kết hợp quản lý tồn kho và cảnh báo sắp hết thuốc trong cùng một luồng sử dụng.
- Có mô hình gia đình và phân quyền, hướng đến chăm sóc liên kết.
- Kiến trúc mở để nâng cấp backend thông báo và mở rộng dữ liệu y tế.

## 7. Công nghệ và khả năng mở rộng
- React Native + Expo: phát triển nhanh, dễ bảo trì, đa nền tảng.
- Kiến trúc API tách riêng: thuận lợi tích hợp backend, bảo mật và scale.
- Tích hợp notifications, camera barcode và AI service.
- Nền tảng sẵn sàng cho các hướng phát triển tiếp:
  - OCR đơn thuốc.
  - Chụp ảnh nhận diện thuốc và tự động tạo mô tả thuốc.
  - Nhận diện thông minh liều dùng.
  - Báo cáo sức khỏe nâng cao.
  - Telehealth/kết nối cơ sở y tế.

## 8. Mẫu thông điệp truyền thông (có thể dùng ngay)

### 8.1. Elevator Pitch (ngắn gọn)
Ứng dụng Nhắc Uống Thuốc Thông Minh giúp bạn không bỏ lỡ một liều thuốc nào, quản lý kho thuốc dễ dàng, quét mã vạch để nhập liệu nhanh và theo dõi sức khỏe cả gia đình trên cùng một nền tảng.

### 8.2. Mô tả cho poster/social
Đúng giờ mỗi ngày - Yên tâm mỗi liều thuốc.
Từ nhắc uống thuốc, cảnh báo sắp hết đến quét mã vạch và gợi ý AI: mọi chức năng được thiết kế để bạn chăm sóc sức khỏe chủ động hơn, đơn giản hơn.

### 8.3. CTA đề xuất
- Tải và trải nghiệm ngay hôm nay.
- Bắt đầu tạo lịch thuốc đầu tiên trong 1 phút.
- Đồng hành cùng gia đình trong hành trình quản lý sức khỏe.

## 9. Kết luận
Đây là một dự án có tính ứng dụng cao, giải quyết đúng nhu cầu thực tế của người dùng: nhắc đúng giờ, theo dõi tồn kho, quản lý lịch sử và tăng tính liên kết gia đình trong chăm sóc sức khỏe.

Nếu cần triển khai demo, thuyết trình học phần, pitching startup hoặc nộp báo cáo đề tài, bộ nội dung này đã sẵn sàng để sử dụng ngay và dễ tùy biến theo từng mục đích.