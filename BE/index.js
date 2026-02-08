require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger');

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
    message: 'Medicine Management API 💊',
    version: '1.0.0',
    description: 'API quản lý tủ thuốc và lịch uống thuốc',
    endpoints: {
      medicines: '/api/medicines',
      schedules: '/api/schedules',
      documentation: '/api-docs'
    }
  });
});

// Swagger UI với custom options
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Medicine Management API - Documentation',
  customfavIcon: '/favicon.ico'
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

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
  console.log(`\n🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`\n📚 Swagger UI Documentation:`);
  console.log(`   👉 http://localhost:${PORT}/api-docs`);
  console.log(`\n📖 API Endpoints:`);
  console.log(`   🏥 Medicines: http://localhost:${PORT}/api/medicines`);
  console.log(`   📅 Schedules: http://localhost:${PORT}/api/schedules\n`);
});

module.exports = app;
