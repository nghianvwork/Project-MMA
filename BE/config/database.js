const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mysql = require('mysql2');

// Tạo connection pool để quản lý kết nối hiệu quả hơn
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00' // Múi giờ Việt Nam
});

// Sử dụng promise wrapper để dễ dàng làm việc với async/await
const promisePool = pool.promise();

// Test kết nối
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Lỗi kết nối database:', err.message);
    console.error('📍 DB_HOST:', process.env.DB_HOST);
    console.error('📍 DB_USER:', process.env.DB_USER);
    console.error('📍 DB_NAME:', process.env.DB_NAME);
    console.error('📍 DB_PORT:', process.env.DB_PORT);
    return;
  }
  console.log('✅ Kết nối MySQL thành công!');
  console.log('📍 Connected to:', process.env.DB_HOST);
  connection.release();
});

module.exports = promisePool;
