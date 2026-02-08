require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json'); // File chứa cấu hình API của bạn

// Phục vụ giao diện Swagger tại đường dẫn /swagger-ui
app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Import routes
const medicineRoutes = require('./routes/medicineRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Medicine Management API',
    version: '1.0.0',
    endpoints: {
      medicines: '/api/medicines',
      schedules: '/api/schedules'
    }
  });
});

app.use('/api/medicines', medicineRoutes);
app.use('/api/schedules', scheduleRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Có lỗi xảy ra!',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy endpoint'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/medicines`);
});

module.exports = app;
