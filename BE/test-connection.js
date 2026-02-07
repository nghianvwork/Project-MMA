require('dotenv').config();
const mysql = require('mysql2');

console.log('Đang kiểm tra kết nối MySQL...\n');

// Tạo connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Test kết nối
connection.connect((err) => {
  if (err) {
    console.error('❌ Kết nối thất bại!');
    console.error('Lỗi:', err.message);
    console.error('\nKiểm tra lại:');
    console.error('- MySQL server đã chạy chưa?');
    console.error('- Thông tin trong file .env có đúng không?');
    console.error('- Database đã được tạo chưa?');
    process.exit(1);
  }

  console.log('✅ Kết nối MySQL thành công!');
  console.log('\nThông tin kết nối:');
  console.log('- Host:', process.env.DB_HOST);
  console.log('- Port:', process.env.DB_PORT);
  console.log('- User:', process.env.DB_USER);
  console.log('- Database:', process.env.DB_NAME);

  // Test query đơn giản
  connection.query('SELECT 1 + 1 AS result', (error, results) => {
    if (error) {
      console.error('\n❌ Lỗi khi thực hiện query:', error.message);
    } else {
      console.log('\n✅ Test query thành công!');
      console.log('Kết quả:', results[0].result);
    }
    
    connection.end();
    console.log('\n✅ Đã đóng kết nối.');
  });
});
