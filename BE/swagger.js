module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Medicine Management API',
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

## Authentication
Tất cả API yêu cầu header \`x-user-id\` để xác thực user.
    `,
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  tags: [
    {
      name: 'Medicines',
      description: '🏥 API quản lý tủ thuốc - Thêm, sửa, xóa thuốc và quản lý tồn kho'
    },
    {
      name: 'Schedules',
      description: '📅 API quản lý lịch uống thuốc - Tạo và quản lý lịch uống thuốc'
    }
  ],
  components: {
    securitySchemes: {
      UserAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-user-id',
        description: 'User ID để xác thực (ví dụ: user123)'
      }
    },
    schemas: {
      Medicine: {
        type: 'object',
        required: ['name'],
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'string', example: 'user123' },
          name: { type: 'string', example: 'Paracetamol' },
          barcode: { type: 'string', example: '8934567890123' },
          dosage: { type: 'string', example: '500mg' },
          form: { type: 'string', example: 'Viên nén' },
          note: { type: 'string', example: 'Uống sau ăn 30 phút' },
          stock_quantity: { type: 'integer', example: 20 },
          stock_unit: { type: 'string', example: 'viên' },
          low_stock_threshold: { type: 'integer', example: 5 },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      Schedule: {
        type: 'object',
        required: ['medicine_id', 'start_date', 'time_of_day', 'rule_type'],
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'string', example: 'user123' },
          medicine_id: { type: 'integer', example: 1 },
          start_date: { type: 'string', format: 'date', example: '2024-02-07' },
          end_date: { type: 'string', format: 'date', example: '2024-02-14', nullable: true },
          time_of_day: { type: 'string', format: 'time', example: '08:00:00' },
          rule_type: { type: 'string', enum: ['daily', 'every_x_days', 'weekdays'], example: 'daily' },
          interval_days: { type: 'integer', example: 3, nullable: true },
          weekdays: { type: 'string', example: '1,3,5', nullable: true },
          dose_amount: { type: 'number', example: 1 },
          created_at: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  security: [{ UserAuth: [] }],
  paths: {
    '/api/medicines': {
      get: {
        tags: ['Medicines'],
        summary: 'Lấy danh sách thuốc',
        description: 'Lấy danh sách tất cả thuốc của user với tìm kiếm và sắp xếp',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Tìm kiếm theo tên thuốc' },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['name', 'created_at', 'stock_quantity'] } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['ASC', 'DESC'] } }
        ],
        responses: { '200': { description: 'Thành công' } }
      },
      post: {
        tags: ['Medicines'],
        summary: 'Thêm thuốc mới',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Medicine' },
              example: {
                name: 'Paracetamol',
                dosage: '500mg',
                form: 'Viên nén',
                stock_quantity: 20,
                stock_unit: 'viên'
              }
            }
          }
        },
        responses: { '201': { description: 'Tạo thành công' } }
      }
    },
    '/api/medicines/{id}': {
      get: {
        tags: ['Medicines'],
        summary: 'Lấy chi tiết thuốc',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Thành công' } }
      },
      put: {
        tags: ['Medicines'],
        summary: 'Cập nhật thuốc',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Medicine' } } } },
        responses: { '200': { description: 'Cập nhật thành công' } }
      },
      delete: {
        tags: ['Medicines'],
        summary: 'Xóa thuốc',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Xóa thành công' } }
      }
    },
    '/api/medicines/{id}/stock': {
      patch: {
        tags: ['Medicines'],
        summary: 'Cập nhật tồn kho',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { stock_quantity: { type: 'integer' } } } } }
        },
        responses: { '200': { description: 'Cập nhật thành công' } }
      }
    },
    '/api/medicines/low-stock': {
      get: {
        tags: ['Medicines'],
        summary: 'Lấy danh sách thuốc sắp hết',
        responses: { '200': { description: 'Thành công' } }
      }
    },
    '/api/schedules': {
      get: {
        tags: ['Schedules'],
        summary: 'Lấy danh sách lịch uống thuốc',
        parameters: [
          { name: 'medicine_id', in: 'query', schema: { type: 'integer' } },
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } }
        ],
        responses: { '200': { description: 'Thành công' } }
      },
      post: {
        tags: ['Schedules'],
        summary: 'Tạo lịch uống thuốc (Thêm thuốc vào lịch)',
        description: 'Tạo lịch uống thuốc mới với 3 loại: daily (hàng ngày), every_x_days (mỗi X ngày), weekdays (theo ngày trong tuần)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Schedule' },
              examples: {
                daily: {
                  summary: 'Uống hàng ngày',
                  value: {
                    medicine_id: 1,
                    start_date: '2024-02-07',
                    end_date: '2024-02-14',
                    time_of_day: '08:00:00',
                    rule_type: 'daily',
                    dose_amount: 1
                  }
                },
                every_x_days: {
                  summary: 'Uống mỗi 3 ngày',
                  value: {
                    medicine_id: 2,
                    start_date: '2024-02-07',
                    time_of_day: '20:00:00',
                    rule_type: 'every_x_days',
                    interval_days: 3,
                    dose_amount: 2
                  }
                },
                weekdays: {
                  summary: 'Uống thứ 2, 4, 6',
                  value: {
                    medicine_id: 3,
                    start_date: '2024-02-07',
                    time_of_day: '09:00:00',
                    rule_type: 'weekdays',
                    weekdays: '1,3,5',
                    dose_amount: 1
                  }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Tạo lịch thành công' } }
      }
    },
    '/api/schedules/{id}': {
      get: {
        tags: ['Schedules'],
        summary: 'Lấy chi tiết lịch',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Thành công' } }
      },
      put: {
        tags: ['Schedules'],
        summary: 'Cập nhật lịch',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Schedule' } } } },
        responses: { '200': { description: 'Cập nhật thành công' } }
      },
      delete: {
        tags: ['Schedules'],
        summary: 'Xóa lịch',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Xóa thành công' } }
      }
    },
    '/api/schedules/date/{date}': {
      get: {
        tags: ['Schedules'],
        summary: 'Lấy lịch theo ngày',
        description: 'Lấy lịch uống thuốc cho ngày cụ thể (có tính toán rule)',
        parameters: [{ name: 'date', in: 'path', required: true, schema: { type: 'string', format: 'date', example: '2024-02-07' } }],
        responses: { '200': { description: 'Thành công' } }
      }
    }
  }
};
