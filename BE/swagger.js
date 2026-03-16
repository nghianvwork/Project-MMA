module.exports = {
  openapi: "3.0.0",
  info: {
    title: "Medicine Management API",
    description: `
# API quản lý tủ thuốc và lịch uống thuốc

API documentation cho ứng dụng mobile quản lý thuốc và lịch uống thuốc.

## Tính năng chính

### 🏥 Quản lý Tủ Thuốc
- Thêm, sửa, xóa thuốc
- Quản lý tồn kho
- Cảnh báo thuốc sắp hết
- Tìm kiếm và sắp xếp

### 📅 Quản lý Lịch Uống Thuốc
- Tạo lịch uống thuốc
- Hỗ trợ 3 loại lịch: hàng ngày, mỗi X ngày, theo ngày trong tuần
- Xem lịch theo ngày cụ thể

Tất cả API yêu cầu header Authorization với Bearer Token.
Ví dụ: Authorization: Bearer <your_token>

    `,
    version: "1.0.0",
    contact: {
      name: "API Support",
      email: "support@example.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "https://your-app.onrender.com",
      description: "Production server (Render)",
    },
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  tags: [
    {
      name: "Medicines",
      description: "API quan ly tu thuoc",
    },
    {
      name: "Schedules",
      description: "API quan ly lich uong thuoc",
    },
    {
      name: "User",
      description: "API dang ky va dang nhap",
    },
    {
      name: "Family",
      description: "API quan ly nguoi than",
    },
    {
      name: "MedicationLogs",
      description: "API lich su uong thuoc",
    },
    {
      name: "Health",
      description: "API ho so suc khoe",
    },
  ],
  components: {
    securitySchemes: {
      UserAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Medicine: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          user_id: { type: "string", example: "user123" },
          name: { type: "string", example: "Paracetamol" },
          barcode: { type: "string", example: "8934567890123" },
          dosage: { type: "string", example: "500mg" },
          form: { type: "string", example: "Vien nen" },
          note: { type: "string", example: "Uong sau an 30 phut" },
          stock_quantity: { type: "integer", example: 20 },
          stock_unit: { type: "string", example: "vien" },
          low_stock_threshold: { type: "integer", example: 5 },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Schedule: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          user_id: { type: "string", example: "user123" },
          medicine_id: { type: "integer", example: 1 },
          start_date: { type: "string", format: "date", example: "2024-02-07" },
          end_date: { type: "string", format: "date", example: "2024-02-14", nullable: true },
          time_of_day: { type: "string", format: "time", example: "08:00:00" },
          rule_type: { type: "string", enum: ["daily", "every_x_days", "weekdays"], example: "daily" },
          interval_days: { type: "integer", example: 3, nullable: true },
          weekdays: { type: "string", example: "1,3,5", nullable: true },
          dose_amount: { type: "number", example: 1 },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Caregiver: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          patient_user_id: { type: "string", example: "user123" },
          caregiver_user_id: { type: "string", example: "user456" },
          permission: { type: "string", example: "view" },
          relation: { type: "string", example: "Bố" },
          caregiver_email: { type: "string", example: "caregiver@gmail.com" },
          caregiver_name: { type: "string", example: "Nguyen Van B" },
          photo_url: { type: "string", example: "https://..." },
          created_at: { type: "string", format: "date-time" },
        },
      },
      MedicationLog: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          user_id: { type: "string", example: "user123" },
          schedule_id: { type: "integer", example: 5 },
          medicine_id: { type: "integer", example: 3 },
          scheduled_time: { type: "string", format: "date-time", example: "2024-02-07T08:00:00" },
          taken_time: { type: "string", format: "date-time", example: "2024-02-07T08:05:00" },
          status: { type: "string", example: "taken_on_time" },
          note: { type: "string", example: "Dung gio" },
          side_effect: { type: "string", example: "Buon non" },
          created_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
  security: [{ UserAuth: [] }],
  paths: {
    "/api/user/forgot-password": {
      post: {
        tags: ["User"],
        summary: "Quên mật khẩu - gửi email reset",
        description: "Gửi link reset mật khẩu về email nếu email tồn tại",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    example: "user@gmail.com",
                  },
                },
                required: ["email"],
              },
            },
          },
        },
        responses: {
          200: { description: "Đã gửi email reset nếu email tồn tại" },
          400: { description: "Email không hợp lệ" },
        },
      },
    },

    "/api/user/verify-reset-otp": {
      post: {
        tags: ["User"],
        summary: "Xác thực OTP - lấy reset token từ email",
        description: "Nhập OTP 6 số nhận được từ email để lấy reset token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    example: "user@gmail.com",
                  },
                  otp: {
                    type: "string",
                    example: "123456",
                  },
                },
                required: ["email", "otp"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "OTP verified",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "OTP verified" },
                    reset_token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                  },
                },
              },
            },
          },
          400: { description: "Invalid or expired OTP" },
        },
      },
    },

    "/api/user/reset-password": {
      post: {
        tags: ["User"],
        summary: "Đặt lại mật khẩu",
        description: "Reset mật khẩu bằng token nhận được từ verify OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  token: {
                    type: "string",
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  },
                  newPassword: {
                    type: "string",
                    example: "password_moi_123",
                  },
                },
                required: ["token", "newPassword"],
              },
            },
          },
        },
        responses: {
          200: { description: "Reset mật khẩu thành công" },
          400: { description: "Token không hợp lệ hoặc hết hạn" },
        },
      },
    },

    "/api/user/authorizations": {
      get: {
        tags: ["User"],
        summary: "Lấy thông tin authorizations",
        description:
          "Trả về cấu hình authorization hiện tại (UserAuth Bearer) và trạng thái token nếu có gửi kèm header Authorization.",
        responses: {
          200: {
            description: "Lấy authorizations thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string", example: "UserAuth" },
                          type: { type: "string", example: "http" },
                          scheme: { type: "string", example: "bearer" },
                          bearerFormat: { type: "string", example: "JWT" },
                          headerName: {
                            type: "string",
                            example: "Authorization",
                          },
                          valuePrefix: { type: "string", example: "Bearer " },
                          authorized: { type: "boolean", example: false },
                        },
                      },
                    },
                    currentAuthorization: {
                      type: "object",
                      properties: {
                        provided: { type: "boolean", example: true },
                        valid: { type: "boolean", example: true },
                        tokenPreview: {
                          type: "string",
                          example: "eyJhbGciOiJI...xYz123",
                          nullable: true,
                        },
                        user: {
                          type: "object",
                          nullable: true,
                          properties: {
                            id: { type: "string", example: "user-uuid" },
                            email: {
                              type: "string",
                              example: "user@example.com",
                              nullable: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    

    "/api/user/profile": {
      get: {
        tags: ["User"],
        summary: "Lấy thông tin user (profile)",
        security: [{ UserAuth: [] }],
        responses: {
          200: {
            description: "Lấy profile thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 1 },
                    email: { type: "string", example: "user@gmail.com" },
                    full_name: { type: "string", example: "Nguyen Van A" },
                    created_at: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
          },
        },
      },

      put: {
        tags: ["User"],
        summary: "Cập nhật thông tin user",
        security: [{ UserAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string" },
                  photo_url: { type: "string" },
                  dob: { type: "string", format: "date" },
                  gender: {
                    type: "string",
                    enum: ["Nam", "Nữ", "Khác"],
                  },
                  height_cm: { type: "number" },
                  weight_kg: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Cập nhật thành công" },
        },
      },
    },

    "/api/user/register": {
      post: {
        tags: ["User"],
        summary: "Đăng ký tài khoản",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                  username: { type: "string" },
                  dob: { type: "string", format: "date" },
                  gender: {
                    type: "string",
                    enum: ["Nam", "Nữ", "Khác"],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Register thành công" },
        },
      },
    },

    "/api/user/login": {
      post: {
        tags: ["User"],
        summary: "Đăng nhập",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login thành công" },
        },
      },
    },

    "/api/user/google-login": {
      post: {
        tags: ["User"],
        summary: "Đăng nhập bằng Google",
        description: "Nhận Google idToken từ mobile, verify và trả JWT hệ thống",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  idToken: { type: "string" },
                },
                required: ["idToken"],
              },
            },
          },
        },
        responses: {
          200: { description: "Google login thành công" },
          401: { description: "Google token không hợp lệ" },
        },
      },
    },

    "/api/medicines": {
      get: {
        tags: ["Medicines"],
        summary: "Lấy danh sách thuốc",
        description:
          "Lấy danh sách tất cả thuốc của user với tìm kiếm và sắp xếp",
        parameters: [
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Tìm kiếm theo tên thuốc",
          },
          {
            name: "sortBy",
            in: "query",
            schema: {
              type: "string",
              enum: ["name", "created_at", "stock_quantity"],
            },
          },
          {
            name: "order",
            in: "query",
            schema: { type: "string", enum: ["ASC", "DESC"] },
          },
        ],
        responses: { 200: { description: "Thành công" } },
      },
      post: {
        tags: ["Medicines"],
        summary: "Thêm thuốc mới",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Medicine" },
              example: {
                name: "Paracetamol",
                dosage: "500mg",
                form: "Viên nén",
                stock_quantity: 20,
                stock_unit: "viên",
              },
            },
          },
        },
        responses: { 201: { description: "Tạo thành công" } },
      },
    },
    "/api/medicines/{id}": {
      get: {
        tags: ["Medicines"],
        summary: "Lấy chi tiết thuốc",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: { 200: { description: "Thành công" } },
      },
      put: {
        tags: ["Medicines"],
        summary: "Cập nhật thuốc",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Medicine" },
            },
          },
        },
        responses: { 200: { description: "Cập nhật thành công" } },
      },
      delete: {
        tags: ["Medicines"],
        summary: "Xóa thuốc",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: { 200: { description: "Xóa thành công" } },
      },
    },
    "/api/medicines/{id}/stock": {
      patch: {
        tags: ["Medicines"],
        summary: "Cập nhật tồn kho",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { stock_quantity: { type: "integer" } },
              },
            },
          },
        },
        responses: { 200: { description: "Cập nhật thành công" } },
      },
    },
    "/api/medicines/low-stock": {
      get: {
        tags: ["Medicines"],
        summary: "Lấy danh sách thuốc sắp hết",
        responses: { 200: { description: "Thành công" } },
      },
    },
    "/api/schedules": {
      get: {
        tags: ["Schedules"],
        summary: "Lấy danh sách lịch uống thuốc",
        parameters: [
          { name: "medicine_id", in: "query", schema: { type: "integer" } },
          {
            name: "date",
            in: "query",
            schema: { type: "string", format: "date" },
          },
        ],
        responses: { 200: { description: "Thành công" } },
      },
      post: {
        tags: ["Schedules"],
        summary: "Tạo lịch uống thuốc (Thêm thuốc vào lịch)",
        description:
          "Tạo lịch uống thuốc mới với 3 loại: daily (hàng ngày), every_x_days (mỗi X ngày), weekdays (theo ngày trong tuần)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Schedule" },
              examples: {
                daily: {
                  summary: "Uống hàng ngày",
                  value: {
                    medicine_id: 1,
                    start_date: "2024-02-07",
                    end_date: "2024-02-14",
                    time_of_day: "08:00:00",
                    rule_type: "daily",
                    dose_amount: 1,
                  },
                },
                every_x_days: {
                  summary: "Uống mỗi 3 ngày",
                  value: {
                    medicine_id: 2,
                    start_date: "2024-02-07",
                    time_of_day: "20:00:00",
                    rule_type: "every_x_days",
                    interval_days: 3,
                    dose_amount: 2,
                  },
                },
                weekdays: {
                  summary: "Uống thứ 2, 4, 6",
                  value: {
                    medicine_id: 3,
                    start_date: "2024-02-07",
                    time_of_day: "09:00:00",
                    rule_type: "weekdays",
                    weekdays: "1,3,5",
                    dose_amount: 1,
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Tạo lịch thành công" } },
      },
    },
    "/api/schedules/{id}": {
      get: {
        tags: ["Schedules"],
        summary: "Lấy chi tiết lịch",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: { 200: { description: "Thành công" } },
      },
      put: {
        tags: ["Schedules"],
        summary: "Cập nhật lịch",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Schedule" },
            },
          },
        },
        responses: { 200: { description: "Cập nhật thành công" } },
      },
      delete: {
        tags: ["Schedules"],
        summary: "Xóa lịch",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: { 200: { description: "Xóa thành công" } },
      },
    },
    "/api/schedules/date/{date}": {
      get: {
        tags: ["Schedules"],
        summary: "Lấy lịch theo ngày",
        description: "Lấy lịch uống thuốc cho ngày cụ thể (có tính toán rule)",
        parameters: [
          {
            name: "date",
            in: "path",
            required: true,
            schema: { type: "string", format: "date", example: "2024-02-07" },
          },
        ],
        responses: { 200: { description: "ThÃ nh cÃ´ng" } },
      },
    },
    "/api/family-members": {
      get: {
        tags: ["Family"],
        summary: "Lay danh sach ho so gia dinh",
        responses: { 200: { description: "Thanh cong" } },
      },
      post: {
        tags: ["Family"],
        summary: "Tao ho so gia dinh",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Caregiver" },
            },
          },
        },
        responses: { 201: { description: "Tao thanh cong" } },
      },
    },
    "/api/family-members/{id}": {
      get: {
        tags: ["Family"],
        summary: "Lay chi tiet ho so gia dinh",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Thanh cong" } },
      },
      put: {
        tags: ["Family"],
        summary: "Cap nhat ho so gia dinh",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Caregiver" } } },
        },
        responses: { 200: { description: "Cap nhat thanh cong" } },
      },
      delete: {
        tags: ["Family"],
        summary: "Xoa ho so gia dinh",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Xoa thanh cong" } },
      },
    },
    "/api/medication-logs": {
      get: {
        tags: ["MedicationLogs"],
        summary: "Lay lich su uong thuoc",
        parameters: [
          { name: "schedule_id", in: "query", schema: { type: "integer" } },
          { name: "medicine_id", in: "query", schema: { type: "integer" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "from", in: "query", schema: { type: "string" } },
          { name: "to", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Thanh cong" } },
      },
      post: {
        tags: ["MedicationLogs"],
        summary: "Tao log uong thuoc",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MedicationLog" } } },
        },
        responses: { 201: { description: "Tao thanh cong" } },
      },
    },
    "/api/medication-logs/summary": {
      get: {
        tags: ["MedicationLogs"],
        summary: "Thong ke uong thuoc",
        parameters: [
          { name: "from", in: "query", schema: { type: "string" } },
          { name: "to", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Thanh cong" } },
      },
    },
    "/api/medication-logs/{id}": {
      put: {
        tags: ["MedicationLogs"],
        summary: "Cap nhat log uong thuoc",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MedicationLog" } } },
        },
        responses: { 200: { description: "Cap nhat thanh cong" } },
      },
      delete: {
        tags: ["MedicationLogs"],
        summary: "Xoa log uong thuoc",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Xoa thanh cong" } },
      },
    },
    "/api/health-profile": {
      get: {
        tags: ["Health"],
        summary: "Lay ho so suc khoe tong hop",
        description:
          "Tra ve chieu cao, can nang, BMI va danh sach benh ly nen/di ung/tien su phau thuat. Co the truyen member_id neu muon lay cho nguoi than.",
        parameters: [
          {
            name: "member_id",
            in: "query",
            schema: { type: "integer" },
          },
        ],
        responses: { 200: { description: "Thanh cong" } },
      },
    },
    "/api/health-records": {
      get: {
        tags: ["Health"],
        summary: "Lay danh sach ho so suc khoe",
        parameters: [
          { name: "member_id", in: "query", schema: { type: "integer" } },
          { name: "category", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Thanh cong" } },
      },
      post: {
        tags: ["Health"],
        summary: "Tao ho so suc khoe",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  member_id: { type: "integer", nullable: true },
                  category: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  diagnosed_date: { type: "string", format: "date" },
                  hospital: { type: "string" },
                  severity: { type: "string" },
                },
                required: ["category", "title"],
              },
            },
          },
        },
        responses: { 201: { description: "Tao thanh cong" } },
      },
    },
    "/api/health-records/{id}": {
      put: {
        tags: ["Health"],
        summary: "Cap nhat ho so suc khoe",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  member_id: { type: "integer", nullable: true },
                  category: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  diagnosed_date: { type: "string", format: "date" },
                  hospital: { type: "string" },
                  severity: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Cap nhat thanh cong" } },
      },
      delete: {
        tags: ["Health"],
        summary: "Xoa ho so suc khoe",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Xoa thanh cong" } },
      },
    },
  },
};













